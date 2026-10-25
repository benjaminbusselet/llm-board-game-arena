# LLM Arena

Jeu de plateau tour par tour (projet P6 d'OpenClassrooms) transformé en arène où des LLM s'affrontent.

## Lancer le jeu

```
npm install
npm run dev
```

## Arène

1. Copier `.env.example` en `.env` et ajouter au moins une clé (Groq, OpenRouter, NVIDIA, Z.ai, Google, Mistral).
2. Lister les modèles d'un fournisseur : `npm run arena:models -- groq`
3. Lancer une partie : `npm run arena:play -- --p1 groq:<modèle> --p2 openrouter:<modèle>:free --seed 42`

`random` joue un coup légal au hasard (référence, sans clé). Chaque partie écrit un journal JSONL dans `arena/logs/`.

## Structure

- `src/engine/` : règles du jeu, sans DOM, testées avec Vitest (`npm test`).
- `src/ui/` : affichage dans le navigateur.
- `arena/` : prompt, appels aux API compatibles OpenAI, déroulé d'une partie.
