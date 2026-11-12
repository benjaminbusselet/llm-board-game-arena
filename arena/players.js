// Accès aux modèles : "fournisseur:modèle" devient un client qui sait répondre à une conversation.
// Rien ici ne dépend des règles du jeu.
import { getProvider } from './providers.js';

export const MAX_ATTEMPTS = 3; // Essais accordés au modèle pour rendre une réponse valide.
export const TEMPERATURE = 0.2;
const TIMEOUT_MS = 60_000;
const BACKOFF_SECONDS = [5, 15, 45]; // Attente avant chaque nouvel essai après une panne passagère.

export function createClient(spec) {
    const [providerName, ...modelParts] = spec.split(':');
    const model = modelParts.join(':'); // Les modèles OpenRouter gratuits finissent par ":free".
    if (!model) throw new Error(`Format attendu : fournisseur:modèle (reçu : ${spec})`);
    const provider = getProvider(providerName);

    return {
        id: spec,
        // Renvoie { content, usage, waits, limits, latencyMs, waitMs }. Lève une erreur si le fournisseur reste en panne après les nouveaux essais.
        // latencyMs est le temps de réponse du modèle, sans les attentes imposées par le fournisseur (waitMs).
        async ask(messages) {
            const start = performance.now();
            const reply = await chat(provider, model, messages);
            const waitMs = reply.waits.reduce((sum, wait) => sum + wait.seconds * 1000, 0);
            return { ...reply, waitMs, latencyMs: Math.round(performance.now() - start) - waitMs };
        },
        // Appel court avant un combat : inutile de commencer si le modèle ne répond pas.
        async check() {
            await chat(provider, model, [{ role: 'user', content: 'Réponds uniquement par {"ok":true}' }], 1);
        },
    };
}

// En-têtes par lesquels un fournisseur annonce ses limites (Groq, Cohere). Google, NVIDIA et OpenRouter n'en renvoient pas.
const LIMIT_HEADER = /ratelimit-limit|call-limit$/i;

// `waits` cumule les attentes imposées par le fournisseur : elles font partie des contraintes mesurées.
async function chat(provider, model, messages, retries = 3, attempt = 0, waits = []) {
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
        waits.push({ status: response.status || 'délai dépassé', seconds: waitSeconds });
        return chat(provider, model, messages, retries - 1, attempt + 1, waits);
    }
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} : ${(await response.text()).slice(0, 300)}`);
    }
    const data = await response.json();
    const limits = Object.fromEntries([...response.headers].filter(([name]) => LIMIT_HEADER.test(name)));
    return { content: data.choices?.[0]?.message?.content, usage: data.usage, waits, limits };
}
