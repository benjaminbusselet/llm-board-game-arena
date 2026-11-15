# Journal de bord

Ce projet est mené par Ben en collaboration avec une IA (Claude Code). Une entrée par étape : qui a décidé et qui a exécuté, ce qui a été fait, la raison, le résultat chiffré. Les échecs y figurent aussi, ceux de l'IA compris.

## 12/11/2026

### 1. Premières parties entre LLM sur le jeu de plateau

- **Qui** : Ben a demandé une fiche par partie, un protocole de benchmark, puis une belle avec tirage au sort du côté. Après les pannes, il a demandé pourquoi chaque modèle n'avait pas été testé avant. L'IA a écrit les scripts et proposé la règle d'annulation, que Ben a validée.
- **Fait** : 4 parties complètes entre LLM sur le jeu de plateau d'origine (gpt-oss-120b, gemini-3.1-flash-lite, qwen3.8-27b, command-a-plus), avec journal JSONL et fiche par partie.
- **Constat** : sur le même plateau, le joueur placé près de la meilleure arme a gagné 3 parties sur 4. Le résultat dépendait du côté autant que du modèle.
- **Échec** : la « belle » entre deux modèles n'a jamais pu se jouer. Le modèle de Google renvoyait des erreurs 503, 4 parties annulées de suite.
- **Décision** : une panne du fournisseur n'est pas une faute du modèle. La partie est annulée, pas terminée par des coups au hasard. Ajout d'un test de disponibilité avant chaque partie et d'une attente de 5, 15 puis 45 secondes entre les essais.
- **Erreur de l'IA** : la première version de l'attente faisait patienter 45 secondes dès le premier nouvel essai. Repérée au premier usage réel, corrigée.

### 2. Inventaire des modèles gratuits

- **Qui** : Ben a arrêté les parties et imposé de reprendre le projet par un inventaire des modèles disponibles. L'IA a écrit le script de test, lancé les appels et trié les résultats. Ben a fait préciser les chiffres, que l'IA avait présentés sans expliquer le passage de l'un à l'autre.
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

- **Qui** : Ben a voulu un tableau comme en coupe du monde, des éliminatoires par éditeur et un règlement de compétition. L'IA a proposé la répartition des places, rédigé le règlement et signalé que les quotas de Cohere ne permettraient pas de tout jouer en un mois.
- **Décision** : des éliminatoires par éditeur, comme des qualifications par continent, puis une phase finale à 16. Les 7 éditeurs à un seul modèle sont qualifiés d'office.
- **Raison** : sans cela, un tiers du tableau serait du même éditeur.
- **Fait** : [règlement](arena/REGLEMENT.md) et [liste des candidats](arena/participants.json).

### 4. Abandon du jeu de plateau pour la boxe

- **Qui** : l'idée de simuler un combat de boxe vient de Ben, comme celle d'effacer d'abord tout ce qui concernait l'ancien jeu pour éviter la confusion. L'IA a proposé le mécanisme des coups simultanés et le plan de nettoyage.
- **Décision** : remplacer le jeu de plateau par un combat de boxe simulé, un jeu répété à coups simultanés et à information imparfaite.
- **Raisons** : plus d'avantage de côté ni de plateau, puisque les deux modèles jouent en même temps ; un coût fixe de 6 appels par modèle et par combat, contre 6 à 36 sur le plateau, ce qui rend les quotas calculables.
- **Fait** : le jeu de plateau est retiré de `master` et conservé sous l'étiquette `v2.0`.

### 5. Moteur de boxe et équilibrage

- **Qui** : l'IA a conçu les valeurs, écrit le moteur et mené la simulation seule. Ben a ensuite demandé si les modèles partaient avec les mêmes chances et ce qui empêchait tous les combats de finir en nul : les réponses sont le test d'équité ci-dessous et le risque noté à l'étape 6.
- **Fait** : un moteur sans hasard ni appel réseau (`arena/boxing.js`), 6 rounds de 4 actions, KO ou décision aux points.
- **Échec** : avec le premier réglage, répéter le jab gagnait 74 % des combats. Il a fallu 9 essais de valeurs.
- **Résultat** : sur 36 000 combats entre 9 boxeurs programmés, ceux qui varient ou s'adaptent gagnent 62 à 69 % de leurs combats, ceux qui répètent une seule action 14 à 53 %. Fins de combat : 52 % aux points, 37 % par KO, 11 % de nuls.
- **Vérification de l'équité** : un test rejoue 200 combats en échangeant les deux boxeurs, le résultat s'inverse exactement.

### 6. Premier combat entre deux LLM

- **Qui** : l'IA a écrit le prompt et le script, puis lancé le combat et la requalification. Ben a validé le plan action par action, après avoir demandé que chaque action soit présentée en 2 ou 3 lignes claires.
- **Fait** : prompt tiré des valeurs du moteur (`arena/prompt.js`) et script de combat (`arena/fight.js`).
- **Résultat** : gpt-oss-120b bat qwen3.8-27b aux points, 58 à 57, en 6 rounds. Aucune réponse invalide. Santé finale : 32 contre 18.
- **Requalification** : 27 des 30 candidats rendent une séquence valide avec le nouveau prompt. Les 3 autres ont échoué sur une panne (erreur 500, quota, délai), pas sur une réponse invalide.
- **Constat à surveiller** : au premier round, 9 modèles sur 21 ouvrent par « jab, crochet, garde » suivi d'une esquive ou d'une récupération, dans l'ordre où le prompt liste les actions. Retirer l'exemple de réponse du prompt n'a rien changé. Deux modèles qui jouent la même séquence font round nul.

### 7. Contraintes des fournisseurs et publication

- **Qui** : Ben a demandé que les contraintes des fournisseurs figurent dans le benchmark, puis que ce journal existe et dise qui fait quoi. L'IA a modifié le code et rédigé. Ben a autorisé la publication sur GitHub.
- **Raison** : un modèle gratuit ne se juge pas seulement à son jeu. Les limites de son fournisseur décident de ce qu'on peut en faire.
- **Fait** : chaque round enregistre le temps de réponse du modèle hors attentes, les attentes imposées par le fournisseur et ses limites annoncées. Les limites connues sont dans [BENCHMARK.md](arena/BENCHMARK.md).
- **Résultat** : second combat entre les deux mêmes modèles, gpt-oss-120b gagne par KO au round 5. Temps de réponse moyen : 2 915 ms contre 288 ms. Tokens : 9 107 contre 3 588.
- **Limite** : ce combat n'a subi aucune attente, donc l'enregistrement d'une attente réelle reste à vérifier.
- **Erreur de l'IA** : un bilan d'avancement mesuré contre un calendrier que Ben n'avait pas demandé. Écarté : le projet avance à l'envie, sans échéance.

## 13/11/2026

### 8. Préparer la reprise

- **Qui** : Ben a demandé que les notes de suivi du projet, tenues hors du dépôt, soient corrigées pour que la prochaine séance reparte du script d'éliminatoires, puis que ce soit testé. L'IA a corrigé les notes et lancé les tests. Ben a demandé chaque nouveau test après chaque correction.
- **Raison** : l'IA ne garde pas la mémoire d'une séance à l'autre. Elle repart de ces notes : si elles décrivent encore le jeu de plateau, elle proposera de reprendre le jeu de plateau.
- **Fait** : trois tests à froid. À chaque fois, un agent sans aucun contexte reçoit les consignes de reprise et doit dire quelle est la prochaine tâche.
- **Résultat** : les trois agents ont proposé le script d'éliminatoires. Le premier a relevé deux écarts entre les notes et ce journal, corrigés. Le deuxième n'a plus constaté de contradiction. Le troisième a respecté la limite de lecture ajoutée entre-temps, en vérifiant seulement que le script n'existait pas.
- **Erreur de l'IA** : les notes attribuaient à deux combats des mesures de tokens venues d'un seul. Repérée par le premier test, corrigée.
- **Limite** : la reprise ne revérifie plus les étapes déjà faites. Une erreur dans l'une d'elles passerait inaperçue.
- **À savoir** : le journal JSONL du premier combat de l'étape 6 a été effacé avant le second. Il n'en reste que le récit ci-dessus.
- **Prochaine tâche** : le script d'éliminatoires, selon le [règlement](arena/REGLEMENT.md).

## 15/11/2026

### 9. Script d'éliminatoires

- **Qui** : Ben a validé le plan, puis chaque fichier avant copie dans le dépôt. L'IA a conçu et écrit le script, les tests et le brouillon.
- **Fait** : `arena/tournoi.js` (état `arena/tournoi.json`, reprise, forfaits, report de 24 h, `--seed`, `--limite`, `--resultats`) et `arena/tournoi-logic.js` (barrages, tirages par graine, décision du match). `fight.js` annonce maintenant quel modèle ne répond pas.
- **Résultat** : 14 matchs prévus (Cohere 6, Google 4, NVIDIA 3, Liquid 1). 39 tests passent, dont 14 nouveaux.
- **Choix de l'IA que le règlement ne tranche pas** : paires du tour principal tirées au sort ; points et santé du départage comptés sur les 2 premiers combats ; combat annulé sans modèle identifiable rejoué sans limite.
- **Limite** : `tournoi.js` n'a jamais été lancé en réel, seule la logique est testée.
- **Prochaine tâche** : retester les 3 candidats en panne et les 7 modèles OpenRouter.

### 10. Requalification et attribution des places

- **Qui** : Ben a demandé de retester les 3 candidats en panne et les 7 modèles OpenRouter, a retiré Apodex et donné la 16e place à Cohere. L'IA a lancé le test sur les 30 candidats (les 3 pannes d'origine n'étaient consignées nulle part) et mis à jour les fichiers.
- **Résultat** : 27 candidats valides. `liquid/lfm-2.5-2.6b` et `apodex/apodex-1.1-mini` retirés d'OpenRouter (404). `nemotron-3-ultra-550b` en panne chez NVIDIA (503, délais dépassés), à retester avant le tirage.
- **Décision** : zone Apodex supprimée, Liquid qualifié d'office, Cohere passe à 4 places. Total : 16 places, 28 candidats de 10 éditeurs.
- **Conséquence** : 12 matchs d'éliminatoires (Cohere 5, Google 4, NVIDIA 3), au lieu de 14.
- **Constat** : le délai de 60 s s'applique par appel. Les 177 s de `command-a-reasoning` et les 106 s de `gemma-4-26b` additionnent des essais expirés et le succès final. Délai conservé (règlement §4 et §10).
- **Prochaine tâche** : choisir la graine, la publier, puis jouer les éliminatoires.

### 11. Graine et barrages

- **Qui** : Ben a choisi de garder `nemotron-3-ultra` malgré la panne, avec forfait s'il ne répond pas. L'IA a proposé la graine (entier tiré par `crypto.randomInt`), retesté ultra et créé le tournoi.
- **Résultat** : ultra échoue au 3e test (délais dépassés, 503). Graine 2204209271. 3 barrages tirés : Cohere (command-r-plus / command-a-reasoning), Google (gemini-3.5-flash-lite / gemini-3.6-flash), NVIDIA (nemotron-3-nano-omni / nemotron-3.5-lightning).
- **Écart au règlement §1** : ultra est conservé alors qu'il ne répond plus au test d'admission. Le §9 s'applique : report de 24 h une fois, puis forfait.
- **Prochaine tâche** : jouer les 12 matchs d'éliminatoires (3 barrages, puis 9 matchs créés à leur fin).
