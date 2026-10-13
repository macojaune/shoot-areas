# Shootareas

Annuaire MVP de lieux pour préparer des shootings photo, vidéo et contenus créatifs.

## Stack

- TanStack Start
- React
- Clerk
- Drizzle
- Turso/libSQL
- Tailwind CSS
- shadcn/ui-inspired components
- Bun

## Développement

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

Le serveur utilise `http://localhost:3000`. Le seed est idempotent : il ajoute
uniquement les catégories manquantes. Les migrations versionnées constituent le
schéma de référence ; ne pas importer les anciennes bases de démonstration.

## Configuration

Copier `.env.example` vers `.env`. `DATABASE_URL=file:shootareas.db` crée une base
locale ; une URL Turso distante utilise `TURSO_TOKEN` ou `TURSO_AUTH_TOKEN`.
Utiliser une base locale dédiée pour les données fictives de recette.

`VITE_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY` activent la connexion. Les pages
publiques restent disponibles sans Clerk ; la publication, le profil, les avis
et les favoris nécessitent une session. Ne jamais placer de clé secrète dans une
variable `VITE_`. Pour la recette, utiliser uniquement l’instance Clerk de test.

## Parcours disponibles

- `/` : découverte et derniers spots.
- `/spots` : recherche, filtres, tris et carte des spots géolocalisés.
- `/lieux/$slug` : détails, galerie créditée, retours terrain et favoris.
- `/nouveau-lieu` : création connectée, avec publication immédiate.
- `/profil` : bio, liens publics, contributions et favoris personnels.
- `/eclaireurs/$userId` : identité publique et contributions d’un membre.

La connexion conserve la destination demandée. Les favoris sont privés ; la bio,
les réseaux sociaux, les contributions et leurs crédits sont publics.

## Communes

La saisie d’une commune propose jusqu’à huit résultats de l’API officielle
[Découpage administratif](https://geo.api.gouv.fr/decoupage-administratif),
filtrés par territoire. Aucun compte API n’est nécessaire. Les centres et codes
officiels sont conservés dans la table `communes` ; les résultats déjà connus
peuvent être proposés explicitement depuis le cache si le service est indisponible.

Choisir une commune centre la carte. Cela ne renseigne pas la position exacte du
spot : celle-ci reste facultative et peut être placée sur la carte, géolocalisée
ou saisie manuellement. La saisie libre reste disponible pour les autres pays ou
en cas d’indisponibilité du service.

## Vérification et démarrage de production

```bash
bun run test
bun run typecheck
bun run build
git diff --check
```

Les tests métier utilisent des bases SQLite temporaires. Les appels Clerk sont
simulés dans ces tests ; leur succès ne remplace pas une recette connectée dans
le navigateur. Consulter `QA.md` pour les résultats et limites de la dernière passe.

`bun run start` applique les migrations et les catégories puis démarre
`node .output/server/index.mjs`. Ne pas remplacer ce démarrage par `db:push`.
La branche de déploiement documentée est `develop` sur Coolify `vps2`, application
`shootareas-web`, domaine `https://shootareas.marvinl.com`. Vérifier à chaque
livraison la correspondance branche/commit/runtime ; une PR seule ne déploie pas.

## Analytics PostHog

Configure the PostHog project token for browser capture and server-side events:

- `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`
- `POSTHOG_PROJECT_TOKEN`
- `POSTHOG_HOST=https://eu.i.posthog.com`

The two token variables use the same PostHog project token. In Coolify, make them
available at build time and runtime so the browser bundle and Nitro handlers are
both configured.

## Images R2

Les images sont envoyées directement du navigateur vers le bucket R2 à l'aide
d'une URL signée de cinq minutes. Configure les variables suivantes dans
l'environnement local et dans Coolify :

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET=shootareas-media`
- `R2_PUBLIC_URL`
- `META_APP_ACCESS_TOKEN` (optionnel, pour l'aperçu des nouveaux posts Instagram)

Crée une paire de clés S3 R2 limitée à la lecture et l'écriture des objets du
bucket `shootareas-media`. La politique CORS utilisée par le bucket est versionnée
dans `config/r2-cors.json` et autorise uniquement le serveur local et le domaine
public de Shootareas.
