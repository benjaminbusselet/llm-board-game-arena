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
        baseUrl: 'https://api.z.ai/api/paas/v4',
        envKey: 'ZAI_API_KEY',
    },
    google: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        envKey: 'GEMINI_API_KEY',
    },
    // URL testées le 29/10/2026 (appel réussi).
    cohere: {
        baseUrl: 'https://api.cohere.com/compatibility/v1',
        envKey: 'COHERE_API_KEY',
    },
    huggingface: {
        baseUrl: 'https://router.huggingface.co/v1',
        envKey: 'HF_TOKEN',
    },
    cloudflare: {
        baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1',
        envKey: 'CLOUDFLARE_API_TOKEN',
        accountEnvKey: 'CLOUDFLARE_ACCOUNT_ID',
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
    if (provider.accountEnvKey) {
        const accountId = process.env[provider.accountEnvKey];
        if (!accountId) {
            throw new Error(`Identifiant manquant : ajouter ${provider.accountEnvKey} dans le fichier .env`);
        }
        return { ...provider, apiKey, baseUrl: provider.baseUrl.replace('{ACCOUNT_ID}', accountId) };
    }
    return { ...provider, apiKey };
}
