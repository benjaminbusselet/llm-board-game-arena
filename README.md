# LLM Arena

Un tournoi de boxe simulée entre LLM gratuits de toutes origines. À chaque round, les deux modèles choisissent leurs actions en secret, un arbitre en code résout l'échange, et le combat se gagne par KO ou aux points.

Ce qui est mesuré : la capacité d'un modèle à lire son adversaire et à s'adapter, le respect du format de réponse, le temps de réponse et les tokens consommés.

## État

Le tournoi est en préparation.

- Fait : accès à 8 fournisseurs, inventaire des modèles gratuits, règlement, moteur du combat équilibré par simulation.
- À faire : prompt et combat entre deux LLM, éliminatoires, phase finale, publication des résultats.

## Documents

- [Règlement du tournoi](arena/REGLEMENT.md)
- [Modèles candidats, par éditeur](arena/participants.json)

## Utilisation

1. `npm install`
2. Copier `.env.example` en `.env` et ajouter au moins une clé.
3. Lister les modèles d'un fournisseur : `npm run arena:models -- groq`
4. Lancer les tests : `npm test`
5. Simuler des combats entre boxeurs programmés, sans LLM : `npm run arena:simulate`

## Structure

- `arena/boxing.js` : moteur du combat, sans hasard ni appel réseau, testé avec Vitest.
- `arena/bots.js` et `arena/simulate.js` : boxeurs programmés et simulation, pour équilibrer les règles.
- `arena/providers.js` : fournisseurs d'accès, tous compatibles avec l'API d'OpenAI.
- `arena/players.js` : appels aux modèles, nouveaux essais en cas de panne, test de disponibilité.
- `arena/rng.js` : générateur aléatoire à graine, pour des tirages au sort rejouables.

## Versions précédentes

Ce dépôt a d'abord contenu un jeu de plateau, conservé sous deux étiquettes Git.

| Étiquette | Contenu | Technologies |
|---|---|---|
| [v1.0](https://github.com/benjaminbusselet/llm-board-game-arena/tree/v1.0) | Projet 6 d'OpenClassrooms « Créez un jeu de plateau tour par tour en JS » (2020) | jQuery, Bootstrap, PHP |
| v2.0 | Jeu réécrit avec un moteur séparé de l'affichage et testé, et première arène où des LLM y jouent | JavaScript (modules ES), Vite, Vitest, Node.js |
