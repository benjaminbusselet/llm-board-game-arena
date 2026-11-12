// Joueurs de l'arène : "random" (référence sans clé) ou "fournisseur:modèle".
import { isLegal, legalActions } from '../src/engine/game.js';
import { getProvider } from './providers.js';
import { buildUserPrompt, parseAction, SYSTEM_PROMPT } from './prompt.js';

export const MAX_ATTEMPTS = 3;
export const TEMPERATURE = 0.2;
const TIMEOUT_MS = 60_000;
const BACKOFF_SECONDS = [5, 15, 45]; // Attente avant chaque nouvel essai après une panne passagère.

export function createPlayer(spec) {
    if (spec === 'random') {
        return {
            id: 'random',
            async check() {},
            async chooseAction(state) {
                const actions = legalActions(state);
                const action = actions[Math.floor(Math.random() * actions.length)];
                return { action, attempts: 1, latencyMs: 0, usage: null, fallback: false };
            },
        };
    }

    const [providerName, ...modelParts] = spec.split(':');
    const model = modelParts.join(':'); // Les modèles OpenRouter gratuits finissent par ":free".
    if (!model) throw new Error(`Format attendu : fournisseur:modèle (reçu : ${spec})`);
    const provider = getProvider(providerName);

    return {
        id: spec,
        // Appel court avant la partie : inutile de commencer si le modèle ne répond pas.
        async check() {
            await chat(provider, model, [{ role: 'user', content: 'Réponds uniquement par {"ok":true}' }], 1);
        },
        async chooseAction(state) {
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(state) },
            ];
            const usage = { prompt_tokens: 0, completion_tokens: 0 };
            const errors = [];
            const start = performance.now();

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                let reply;
                try {
                    reply = await chat(provider, model, messages);
                } catch (error) {
                    errors.push(error.message);
                    continue;
                }
                usage.prompt_tokens += reply.usage?.prompt_tokens ?? 0;
                usage.completion_tokens += reply.usage?.completion_tokens ?? 0;

                const action = parseAction(reply.content);
                const latencyMs = Math.round(performance.now() - start);
                if (isLegal(state, action)) {
                    return { action, attempts: attempt, latencyMs, usage, fallback: false, errors };
                }
                errors.push(`Coup illégal : ${reply.content?.slice(0, 200)}`);
                messages.push(
                    { role: 'assistant', content: reply.content ?? '' },
                    { role: 'user', content: 'Ce coup est illégal ou mal formé. Réponds uniquement par un objet JSON copié de la liste des coups légaux.' },
                );
            }

            // Une panne du fournisseur n'est pas une faute du modèle : la partie est annulée plutôt que faussée.
            const apiErrors = errors.filter(e => !e.startsWith('Coup illégal'));
            if (apiErrors.length > 0) {
                throw new Error(`Fournisseur indisponible pour ${spec} : ${apiErrors.at(-1).slice(0, 200)}`);
            }

            // Après trois réponses illégales, coup aléatoire signalé dans le journal.
            const actions = legalActions(state);
            const action = actions[Math.floor(Math.random() * actions.length)];
            const latencyMs = Math.round(performance.now() - start);
            return { action, attempts: MAX_ATTEMPTS, latencyMs, usage, fallback: true, errors };
        },
    };
}

async function chat(provider, model, messages, retries = 3, attempt = 0) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.headers,
        },
        body: JSON.stringify({ model, messages, temperature: TEMPERATURE }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(error => {
        // Délai dépassé ou coupure réseau : traité comme une panne passagère tant qu'il reste des essais.
        if (retries === 0) throw error;
        return { status: 0, headers: new Headers(), reason: error.message };
    });

    // Quota par minute dépassé ou panne passagère (5xx, délai dépassé) : on attend puis on réessaie.
    const transient = response.status === 429 || response.status >= 500 || response.status === 0;
    if (transient && retries > 0) {
        const backoff = BACKOFF_SECONDS[attempt] ?? BACKOFF_SECONDS.at(-1);
        const waitSeconds = Number(response.headers.get('retry-after')) || (response.status === 429 ? 20 : backoff);
        console.warn(`${response.status || response.reason} sur ${model}, nouvel essai dans ${waitSeconds} s`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        return chat(provider, model, messages, retries - 1, attempt + 1);
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} : ${(await response.text()).slice(0, 300)}`);
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content, usage: data.usage };
}
