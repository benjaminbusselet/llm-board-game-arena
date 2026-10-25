// Joueurs de l'arène : "random" (référence sans clé) ou "fournisseur:modèle".
import { isLegal, legalActions } from '../src/engine/game.js';
import { getProvider } from './providers.js';
import { buildUserPrompt, parseAction, SYSTEM_PROMPT } from './prompt.js';

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 60_000;

export function createPlayer(spec) {
    if (spec === 'random') {
        return {
            id: 'random',
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

            // Après trois échecs, coup aléatoire signalé dans le journal.
            const actions = legalActions(state);
            const action = actions[Math.floor(Math.random() * actions.length)];
            const latencyMs = Math.round(performance.now() - start);
            return { action, attempts: MAX_ATTEMPTS, latencyMs, usage, fallback: true, errors };
        },
    };
}

async function chat(provider, model, messages, retries = 3) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.headers,
        },
        body: JSON.stringify({ model, messages, temperature: 0.2 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Quota par minute dépassé : on attend puis on réessaie.
    if (response.status === 429 && retries > 0) {
        const waitSeconds = Number(response.headers.get('retry-after')) || 20;
        console.warn(`429 sur ${model}, nouvel essai dans ${waitSeconds} s`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        return chat(provider, model, messages, retries - 1);
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} : ${(await response.text()).slice(0, 300)}`);
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content, usage: data.usage };
}
