# Protocole du benchmark

But : comparer des LLM sur un jeu qu'ils n'ont pas pu apprendre par cœur, avec des parties rejouables et vérifiables.

## Ce qui est fixé

- **Règles et prompt** : les mêmes pour tous les modèles (`prompt.js`). L'empreinte du prompt est inscrite dans chaque journal ; deux parties ne se comparent qu'à empreinte égale.
- **Plateau** : généré par une seed. La même seed redonne le même plateau, les mêmes armes et les mêmes positions.
- **Paramètres d'appel** : température et nombre d'essais définis dans `players.js`, inscrits dans chaque journal.
- **Code** : le commit Git est inscrit dans chaque journal.

## Un duel

- 10 parties : 5 seeds, chacune jouée deux fois en échangeant les côtés. Le joueur A commence toujours, l'échange annule cet avantage.
- Limite de 200 coups, au-delà la partie est nulle.

## Coups invalides

Le modèle reçoit la liste des coups légaux et doit en renvoyer un en JSON. Réponse illégale ou illisible : il est relancé avec un message d'erreur. Après le dernier essai raté, un coup légal est tiré au hasard et compté comme repli.

Avant chaque partie, un appel court vérifie que les deux modèles répondent ; sinon la partie n'est pas lancée.

Panne du fournisseur (erreur HTTP, délai dépassé, quota épuisé) : ce n'est pas une faute du modèle. L'appel est retenté après 5, 15 puis 45 secondes. Si un coup n'aboutit pas à cause d'une panne, la partie est annulée et sort du classement.

## Mesures

| Mesure | Source |
|---|---|
| Victoires, nuls, défaites | ligne `end` du journal |
| Coups illégaux, erreurs API, replis aléatoires | champs `errors` et `fallback` de chaque coup |
| Latence par coup | temps mesuré autour de l'appel, essais compris |
| Tokens | champ `usage` renvoyé par le fournisseur |
| Coût | tokens × prix public du modèle, nul en gamme gratuite |

`random` (coup légal au hasard) sert de plancher : un modèle qui ne le bat pas nettement ne comprend pas le jeu.

## Limites

- La latence dépend du fournisseur et de sa charge, pas seulement du modèle.
- Les quotas gratuits imposent des attentes (erreur 429), exclues de rien : elles comptent dans la latence.
- Les réponses ne sont pas déterministes, même à basse température : rejouer une seed peut donner une autre partie.

## Reproduire

Chaque partie écrit un journal JSONL (`arena/logs/`, non versionné). `npm run arena:report` en tire une fiche lisible dans `arena/games/`, `npm run arena:report -- --summary` le tableau de synthèse.
