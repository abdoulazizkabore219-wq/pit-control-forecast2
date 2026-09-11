# Pit Control — Forecast & Dispatch

Application Next.js prête à déployer sur Vercel.

## Fonctionnalités

- Jusqu'à 60 camions.
- Flotte initiale : 52 camions.
- Jusqu'à 8 pelles, avec noms modifiables.
- Affectation des camions par pelle.
- Benne 12 BCM par défaut.
- Damper 22 BCM par défaut.
- Temps de chargement.
- Temps de cycle total.
- Disponibilité.
- Forecast automatique en BCM/h.
- Forecast par poste.
- Simulation du nombre de camions.
- Historique des cycles/productions réels.
- Calcul d'un indicateur de fiabilité du forecast.
- Sauvegarde locale dans le navigateur, donc utilisable sans base de données pour la première livraison.

## Déploiement Vercel + GitHub

1. Créer un dépôt GitHub, par exemple `pit-control-forecast`.
2. Mettre tous les fichiers de ce projet à la racine du dépôt.
3. Dans Vercel : Add New Project → importer le dépôt GitHub.
4. Framework détecté : Next.js.
5. Build command : `next build`.
6. Deploy.

## Important pour la version terrain

Cette première version est volontairement autonome : aucune API ni base de données n'est nécessaire pour fonctionner.

Les données sont enregistrées dans `localStorage` du navigateur/appareil. Pour une vraie utilisation multi-utilisateur avec synchronisation entre tablette, téléphone et PC, la prochaine version doit ajouter une base de données/API (Supabase, PostgreSQL ou équivalent).

## Logique du forecast

BCM/h brut = nombre de camions × BCM/camion × 60 / temps de cycle en minutes

BCM/h net = BCM/h brut × disponibilité / 100

Le temps de chargement est enregistré comme donnée opérationnelle. Le cycle total reste le facteur principal du débit ; le chargement peut ensuite être utilisé pour contrôler la cohérence du cycle et construire un modèle statistique plus avancé.