# Journal de bord

Une entrée par étape : ce qui a été fait, la décision prise et sa raison, le résultat chiffré. Les échecs y figurent aussi.

## 12/11/2026

### 1. Premières parties entre LLM sur le jeu de plateau

- **Fait** : 4 parties complètes entre LLM sur le jeu de plateau d'origine (gpt-oss-120b, gemini-3.1-flash-lite, qwen3.8-27b, command-a-plus), avec journal JSONL et fiche par partie.
- **Constat** : sur le même plateau, le joueur placé près de la meilleure arme a gagné 3 parties sur 4. Le résultat dépendait du côté autant que du modèle.
- **Échec** : la « belle » entre deux modèles n'a jamais pu se jouer. Le modèle de Google renvoyait des erreurs 503, 4 parties annulées de suite.
- **Décision** : une panne du fournisseur n'est pas une faute du modèle. La partie est annulée, pas terminée par des coups au hasard. Ajout d'un test de disponibilité avant chaque partie et d'une attente de 5, 15 puis 45 secondes entre les essais.

### 2. Inventaire des modèles gratuits

- **Raison** : lancer des parties sans savoir quels modèles répondent faisait perdre du temps et faussait les résultats.
- **Fait** : un appel court à chaque modèle de chat gratuit de 7 fournisseurs d'accès.

| Étape | Modèles |
|---|---|
| Listés par les API | 773 |
| Modèles de chat gratuits testés | 234 |
| Ont répondu | 43 |
| Distincts, doublons retirés | 39 |
| Ont rendu un coup légal | 33 |
| Candidats après regroupement des variantes | 30 |

- **Causes des 191 échecs** : crédits gratuits épuisés chez Hugging Face (120) et Z.ai (12), modèles fermés au compte chez NVIDIA (37), quotas et modèles retirés chez Google, délais dépassés.
- **Quotas relevés dans les en-têtes des API** : Cohere, 1 000 appels par mois pour toute la clé ; Groq, 1 000 requêtes et 8 000 tokens par fenêtre et par modèle. Google et NVIDIA ne publient pas les leurs.
- **Constat** : les 30 candidats viennent de 11 éditeurs, mais Cohere (9), Google (7) et NVIDIA (5) en fournissent 21.

### 3. Format du tournoi

- **Décision** : des éliminatoires par éditeur, comme des qualifications par continent, puis une phase finale à 16. Les 7 éditeurs à un seul modèle sont qualifiés d'office.
- **Raison** : sans cela, un tiers du tableau serait du même éditeur.
- **Fait** : [règlement](arena/REGLEMENT.md) et [liste des candidats](arena/participants.json).

### 4. Abandon du jeu de plateau pour la boxe

- **Décision** : remplacer le jeu de plateau par un combat de boxe simulé, un jeu répété à coups simultanés et à information imparfaite.
- **Raisons** : plus d'avantage de côté ni de plateau, puisque les deux modèles jouent en même temps ; un coût fixe de 6 appels par modèle et par combat, contre 6 à 36 sur le plateau, ce qui rend les quotas calculables.
- **Fait** : le jeu de plateau est retiré de `master` et conservé sous l'étiquette `v2.0`.

### 5. Moteur de boxe et équilibrage

- **Fait** : un moteur sans hasard ni appel réseau (`arena/boxing.js`), 6 rounds de 4 actions, KO ou décision aux points.
- **Échec** : avec le premier réglage, répéter le jab gagnait 74 % des combats. Il a fallu 9 essais de valeurs.
- **Résultat** : sur 36 000 combats entre 9 boxeurs programmés, ceux qui varient ou s'adaptent gagnent 62 à 69 % de leurs combats, ceux qui répètent une seule action 14 à 53 %. Fins de combat : 52 % aux points, 37 % par KO, 11 % de nuls.
- **Vérification de l'équité** : un test rejoue 200 combats en échangeant les deux boxeurs, le résultat s'inverse exactement.

### 6. Premier combat entre deux LLM

- **Fait** : prompt tiré des valeurs du moteur (`arena/prompt.js`) et script de combat (`arena/fight.js`).
- **Résultat** : gpt-oss-120b bat qwen3.8-27b aux points, 58 à 57, en 6 rounds. Aucune réponse invalide. Santé finale : 32 contre 18.
- **Requalification** : 27 des 30 candidats rendent une séquence valide avec le nouveau prompt. Les 3 autres ont échoué sur une panne (erreur 500, quota, délai), pas sur une réponse invalide.
- **Constat à surveiller** : au premier round, 9 modèles sur 21 ouvrent par « jab, crochet, garde » suivi d'une esquive ou d'une récupération, dans l'ordre où le prompt liste les actions. Retirer l'exemple de réponse du prompt n'a rien changé. Deux modèles qui jouent la même séquence font round nul.
