# Règlement du tournoi

Tournoi de boxe simulée entre LLM gratuits : des éliminatoires par éditeur, puis une phase finale à 16.

## 1. Admission

Un modèle est admis s'il remplit toutes ces conditions, vérifiées avec les clés du dépôt :

- il est gratuit, sans crédit à acheter ;
- il répond à un appel court ;
- il rend une séquence d'actions valide avec le prompt de l'arène.

Les variantes d'un même modèle comptent pour un seul candidat. Un modèle servi par plusieurs fournisseurs d'accès joue par un seul.

Les candidats et leur éditeur sont listés dans [participants.json](participants.json).

## 2. Zones et places

Chaque éditeur forme une zone. La phase finale compte 16 places.

- Un éditeur avec un seul modèle admis est qualifié d'office.
- Les autres éditeurs jouent des éliminatoires pour leurs places, indiquées dans `participants.json`.

## 3. Le combat

- Un combat dure 6 rounds au plus.
- À chaque round, chaque modèle rend en un seul appel une séquence de 4 actions, sans voir celle de l'adversaire.
- Actions : jab, crochet, uppercut, garde, esquive, récupération.
- Un arbitre en code résout les 4 échanges du round, action contre action. Aucun hasard n'intervient.
- Chaque boxeur a une santé et une endurance. Frapper coûte de l'endurance, un boxeur épuisé frappe moins fort.
- Avant chaque round, les deux modèles reçoivent l'historique complet des rounds précédents.
- Victoire par KO si la santé d'un boxeur tombe à zéro. Sinon, décision aux points : le vainqueur d'un round marque 10 points, le perdant 9, et un round égal donne 10 partout.
- Les deux boxeurs ont les mêmes conditions : il n'y a ni côté ni premier joueur.

Les valeurs chiffrées (dégâts, coûts en endurance, résultat de chaque paire d'actions) sont fixées dans le code du moteur après équilibrage par simulation, puis recopiées ici avant le premier combat.

## 4. Réponses invalides

- Séquence illisible, incomplète ou contenant une action inconnue : le modèle est relancé, 3 essais au total.
- Après le troisième échec, le modèle passe le round en garde et une faute est comptée.
- Délai de réponse : 60 secondes par appel.

## 5. Le match

| Phase | Combats | Vainqueur |
|---|---|---|
| Éliminatoires | 2 | le plus de combats gagnés |
| Poules de la phase finale | 2 | le plus de combats gagnés, égalité permise |
| Quarts et demi-finales | 3 | le premier à 2 victoires |
| Finale et match pour la 3e place | 5 | le premier à 3 victoires |

En cas d'égalité hors poule, dans l'ordre :

1. le total des points des juges sur le match ;
2. la différence de santé cumulée sur le match ;
3. un combat supplémentaire ;
4. le plus petit nombre de fautes sur le match ;
5. un tirage au sort.

## 6. Éliminatoires

Élimination directe dans chaque zone, jusqu'à ce qu'il reste autant de modèles que de places.

- Si le nombre de candidats n'est pas le double du nombre de places, des barrages tirés au sort ramènent la zone à ce nombre. Les autres candidats sont exemptés de barrage.
- Les vainqueurs du dernier tour sont qualifiés.

## 7. Phase finale

- 4 poules de 4, tirées au sort. Deux modèles d'un même éditeur ne sont pas placés dans la même poule.
- En poule, chaque modèle rencontre les trois autres. Victoire : 3 points. Égalité : 1 point. Défaite : 0.
- Classement de poule : points, puis total des points des juges, puis différence de santé cumulée, puis plus petit nombre de fautes, puis tirage au sort.
- Les deux premiers de chaque poule vont en quarts de finale. Le premier d'une poule rencontre le deuxième d'une autre.

## 8. Tirages au sort

Tous les tirages (barrages, poules, tableau final) viennent d'un générateur initialisé par une graine de tournoi publiée avant le premier combat. Ils sont donc rejouables et vérifiables.

## 9. Pannes et forfaits

Une panne du fournisseur (erreur HTTP, délai dépassé, quota épuisé) n'est pas une faute du modèle.

- L'appel est retenté après 5, 15 puis 45 secondes.
- Si l'appel n'aboutit toujours pas, le combat est annulé et rejoué.
- Deux combats annulés par la faute du même modèle dans un match : ce modèle est forfait pour le match.
- Modèle qui ne répond pas au test d'avant-match : le match est reporté de 24 heures, une seule fois, puis le modèle est forfait.

## 10. Conditions figées

Le prompt, la température, le nombre d'essais et le code sont les mêmes pour tous et ne changent pas pendant le tournoi. Chaque journal de combat les enregistre, avec le commit Git.

## 11. Calendrier

Les quotas gratuits sont partagés entre les modèles d'un même fournisseur d'accès. Les matchs sont donc étalés sur plusieurs jours, et un match qui épuiserait un quota est reporté au lendemain.

## 12. Résultats

Chaque combat produit un journal JSONL et une fiche lisible. Les résultats finaux sont publiés dans [BENCHMARK.md](BENCHMARK.md).
