# EstimeLe — Mode d'emploi

## Ajouter des questions

1. Ouvre `data/questions.json` dans un éditeur de texte (Notepad, VS Code…)
2. Copie un bloc `{ "id": "q...", ... }` existant et colle-le à la fin de la liste d'une manche, ou crée une nouvelle manche
3. Chaque manche doit contenir **exactement 3 questions**
4. Règles à respecter :
   - La vraie réponse doit être à **plus de 15 %** de chaque borne (ni trop proche du min, ni trop proche du max)
   - La plage `borne_max / borne_min` doit être **≥ 100** (2 ordres de grandeur minimum)
   - Tous les champs sont obligatoires : `id`, `question`, `reponse`, `unite`, `borne_min`, `borne_max`, `source`, `anecdote`, `theme`, `difficulte`
5. Sauvegarde le fichier

## Redéployer sur Netlify

1. Va sur [app.netlify.com](https://app.netlify.com)
2. Glisse-dépose le dossier `estimele/` sur la zone de déploiement de ton site
3. C'est tout — le site est mis à jour en moins d'une minute

## Champs du JSON

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique (`q001`, `q002`…) |
| `question` | string | La question posée au joueur |
| `reponse` | number | La vraie valeur numérique |
| `unite` | string | L'unité affichée (`km`, `boulangeries`…) |
| `borne_min` | number | Valeur minimale du curseur |
| `borne_max` | number | Valeur maximale du curseur |
| `source` | string | Source officielle + année |
| `anecdote` | string | Fait intéressant révélé après la réponse |
| `theme` | string | Thème (`quotidien`, `géographie`, `alimentation`, `transports`, `culture`) |
| `difficulte` | 1, 2 ou 3 | Difficulté de la question |

## Contact

Questions ou problèmes : contact@estimele.fr
