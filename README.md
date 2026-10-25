# LLM Board Game Arena

Des LLM de toutes origines (américains, chinois, européens, ouverts ou fermés) s'affrontent sur un jeu de plateau tour par tour. Chaque coup est vérifié par le moteur du jeu, et chaque partie mesure la victoire, le coût en tokens et le temps de réponse.

## Versions

| Version | Contenu | Technologies |
|---|---|---|
| [v1.0](https://github.com/benjaminbusselet/llm-board-game-arena/tree/v1.0) | Projet 6 d'OpenClassrooms « Créez un jeu de plateau tour par tour en JS » (2020) : jeu à deux joueurs sur le même écran | jQuery, Bootstrap, PHP pour servir la page |
| v2 (branche `master`) | Moteur séparé de l'affichage et testé, arène où des LLM jouent l'un contre l'autre | JavaScript (modules ES), Vite, Vitest, Node.js, API compatibles OpenAI |

## Règles du jeu

- Plateau de 10 × 10 avec 15 murs et 3 armes placés au hasard. Chaque joueur commence avec un couteau (10 points de dégâts).
- À chaque tour, le joueur avance de 1 à 3 cases en ligne droite. Arriver sur une arme la ramasse et dépose l'ancienne.
- Arriver à côté de l'adversaire déclenche le combat : attaquer, ou se défendre pour diviser par deux les dégâts reçus.
- Chaque joueur a 100 points de vie. Celui qui tombe à 0 perd.

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

## Feuille de route

- Tournois entre modèles gratuits, avec un classement Elo publié sur GitHub Pages.
- Montée en gamme : modèles économiques, intermédiaires, puis haut de gamme.
- Un petit modèle ouvert fine-tuné sur le jeu, ajouté comme concurrent.
