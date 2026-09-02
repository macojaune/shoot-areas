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

## Development

```bash
bun install
bun run db:push
bun run db:seed
bun run dev
```

## Environment

Copy `.env.example` to `.env` and fill the Clerk keys when testing protected routes.

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
