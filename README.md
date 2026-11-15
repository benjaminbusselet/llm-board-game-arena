# LLM Arena

Un tournoi de boxe simulée entre LLM gratuits de toutes origines. À chaque round, les deux modèles choisissent leurs actions en secret, un arbitre en code résout l'échange, et le combat se gagne par KO ou aux points.

Ce qui est mesuré : la capacité d'un modèle à lire son adversaire et à s'adapter, le respect du format de réponse, le temps de réponse et les tokens consommés.

## État

Le tournoi est en préparation.

- Fait : accès à 8 fournisseurs, inventaire des modèles gratuits, règlement, moteur du combat équilibré par simulation.
- Fait aussi : premier combat entre deux LLM. Suivi détaillé dans le [journal de bord](JOURNAL.md).
- À faire : éliminatoires, phase finale, publication des résultats.

## Méthode

Ce projet est mené par un développeur en collaboration avec une IA (Claude Code). C'est aussi ce qu'il cherche à montrer : comment construire un benchmark à deux.

- **Ben décide** : le format du jeu et du tournoi, les règles, ce qui est gardé, supprimé ou publié.
- **L'IA propose et exécute** : elle écrit le code et les tests, lance les mesures, rédige, et signale les limites de ce qu'elle a fait.

Les règles de travail imposées à l'IA :

- un plan numéroté, validé avant toute tâche complexe ;
- aucune suppression ni publication sans accord ;
- toute affirmation vérifiée par un test ou une mesure, ou sourcée ;
- les échecs sont rapportés, pas de complaisance.

Le [journal de bord](JOURNAL.md) dit, étape par étape, qui a décidé quoi. Les commits écrits avec l'IA sont cosignés.

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
- `arena/prompt.js` et `arena/fight.js` : prompt tiré des règles, et combat entre deux LLM avec journal JSONL (`npm run arena:fight`).
- `arena/bots.js` et `arena/simulate.js` : boxeurs programmés et simulation, pour équilibrer les règles.
- `arena/providers.js` : fournisseurs d'accès, tous compatibles avec l'API d'OpenAI.
- `arena/players.js` : appels aux modèles, nouveaux essais en cas de panne, test de disponibilité.
- `arena/rng.js` : générateur aléatoire à graine, pour des tirages au sort rejouables.

## Versions précédentes

Ce dépôt a d'abord contenu un jeu de plateau, conservé sous deux étiquettes Git.

| Étiquette | Contenu | Technologies |
|---|---|---|
| [v1.0](https://github.com/benjaminbusselet/llm-board-game-arena/tree/v1.0) | Projet 6 d'OpenClassrooms « Créez un jeu de plateau tour par tour en JS » (2020) | jQuery, Bootstrap, PHP |
| [v2.0](https://github.com/benjaminbusselet/llm-board-game-arena/tree/v2.0) | Jeu réécrit avec un moteur séparé de l'affichage et testé, et première arène où des LLM y jouent | JavaScript (modules ES), Vite, Vitest, Node.js |

## État d'avancement

Le détail de chaque étape est dans `JOURNAL.md` du dépôt du niveau 1.

| Étape | État |
|---|---|
| Jeu de plateau (v1 puis v2 avec Vite et moteur testé) | Terminé, retiré de `master`, conservé sous les étiquettes `v1.0` et `v2.0` |
| Accès aux [fournisseurs gratuits](modeles.md#fournisseurs) | Fait (8 branchés, 7 testés, 5 utilisables : Groq, Cohere, Google, NVIDIA, OpenRouter ; Cloudflare non testé) |
| Inventaire et qualification des modèles gratuits | Fait (30 candidats de 11 éditeurs, `arena/participants.json`) |
| Règlement du tournoi de boxe (`arena/REGLEMENT.md`) | Fait |
| Moteur de boxe, équilibré par simulation | Fait |
| Combat complet entre deux LLM, avec journal et contraintes des fournisseurs | Fait (2 combats d'essai) |
| Dépôt publié sur GitHub, avec journal de bord et section « Méthode » | Fait |
| Script d'éliminatoires (`arena/`), selon le règlement : graine de tournoi publiée, tirage des barrages, match en 2 combats, départage, forfaits, reprise après panne, résultats par zone | À faire, prochaine tâche |
| Retester avec le prompt de boxe les 3 candidats tombés sur une panne et les 7 modèles OpenRouter | À faire, avant de jouer |
| Jouer les éliminatoires par éditeur (14 matchs), des petites zones vers Cohere | À faire |
| Phase finale à 16 | À faire |
| Résultats dans `arena/BENCHMARK.md` et sur GitHub Pages, puis post LinkedIn | À faire |
| Cours « Building with the Claude API » (Anthropic Academy) | À faire |
| [Tableau des modèles](modeles.md) étendu aux autres régions du monde, avec sources | À faire |