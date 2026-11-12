# Résultats du tournoi

Aucun combat du tournoi n'a encore été joué. Les résultats seront publiés ici à la fin du tournoi.

Règles : [REGLEMENT.md](REGLEMENT.md).

## Contraintes d'accès

Un modèle gratuit ne se juge pas seulement à son jeu : les limites de son fournisseur d'accès décident de ce qu'on peut réellement en faire. Elles font donc partie des résultats.

### Limites annoncées par les fournisseurs

| Fournisseur d'accès | Limite | Portée | Source |
|---|---|---|---|
| Groq | 1 000 requêtes et 8 000 tokens par fenêtre | par modèle | en-têtes de l'API, relevés le 12/11/2026 |
| Cohere | 1 000 appels par mois, 20 par minute | toute la clé, tous modèles confondus | en-têtes de l'API, relevés le 12/11/2026 |
| OpenRouter | 50 requêtes par jour, 20 par minute | tous les modèles gratuits confondus | documentation OpenRouter, non revérifiée |
| Google | non publiée | visible dans AI Studio, compte connecté | [documentation](https://aistudio.google.com/docs/rate-limits) |
| NVIDIA | non publiée | inconnue | [référence de l'API](https://docs.api.nvidia.com/nim/reference/llm-apis) |

### Ce que chaque combat mesure

Le journal de chaque round enregistre, pour chaque modèle :

- le temps de réponse du modèle, hors attentes ;
- les attentes imposées par le fournisseur (quota dépassé, surcharge, délai) : leur nombre, leur cause et leur durée ;
- les limites annoncées dans les en-têtes de la réponse, quand le fournisseur en donne ;
- les tokens consommés.

Un combat annulé pour panne est aussi enregistré, avec le modèle en cause.

### Mesures

À remplir avec les combats du tournoi : par modèle, temps de réponse moyen, attentes subies, combats annulés, tokens par combat.
