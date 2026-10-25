// Fournisseurs compatibles avec l'API Chat Completions d'OpenAI.
// URL vérifiées dans la doc officielle le 25/10/2026, sauf mention contraire.
export const PROVIDERS = {
    groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        envKey: 'GROQ_API_KEY',
    },
    openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        envKey: 'OPENROUTER_API_KEY',
        headers: { 'X-OpenRouter-Title': 'LLM Arena' },
    },
    nvidia: {
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        envKey: 'NVIDIA_API_KEY',
    },
    zai: {
        // Source tierce uniquement : à confirmer dans la doc de Z.ai.
        baseUrl: 'https://api.z.ai/api/paas/v4',
        envKey: 'ZAI_API_KEY',
    },
    google: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        envKey: 'GEMINI_API_KEY',
    },
    mistral: {
        baseUrl: 'https://api.mistral.ai/v1',
        envKey: 'MISTRAL_API_KEY',
    },
};

export function getProvider(name) {
    const provider = PROVIDERS[name];
    if (!provider) {
        throw new Error(`Fournisseur inconnu : ${name}. Choix : ${Object.keys(PROVIDERS).join(', ')}`);
    }
    const apiKey = process.env[provider.envKey];
    if (!apiKey) {
        throw new Error(`Clé manquante : ajouter ${provider.envKey} dans le fichier .env`);
    }
    return { ...provider, apiKey };
}
