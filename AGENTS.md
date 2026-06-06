# Shootareas Agent Instructions

## Project Context

Shootareas is an MVP directory for visually interesting places where people can prepare photo shoots, video shoots, filming sessions, travel content, portfolio work, and social content.

The product goal is not a polished marketplace yet. The priority is to launch quickly with a useful public MVP:

- list places suitable for creative shoots;
- expose practical field details: access, light, crowd level, accessibility, best period, coordinates, image credits;
- let authenticated contributors add places;
- publish submitted places immediately for now;
- highlight creators through credited external images and links.

The user wants this project to move fast and stay consistent with the stack used across current projects.

## Stack

Use the current TanStack Start stack:

- Bun for package management and scripts.
- TanStack Start + Vite + Nitro for the app runtime.
- React 19.
- Tailwind CSS v4.
- shadcn/ui-inspired local primitives in `src/components/ui`.
- Drizzle ORM.
- Turso/libSQL.
- Clerk for auth.
- TanStack React Form.

Do not add tRPC. This project intentionally uses TanStack Start server functions instead.

## Key Commands

Use these from the repo root:

```bash
bun install
bun run build
bun run typecheck
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

Production start is:

```bash
bun run start
```

`start` runs migrations, seeds categories, then starts the Nitro server:

```bash
bun run db:migrate && bun run db:seed && node .output/server/index.mjs
```

Do not replace production startup with `drizzle-kit push`; `push` can require an interactive TTY against Turso and break Coolify deploys.

## Local Development

The user may keep a local dev server running on:

```text
http://localhost:3000
```

When that server is available, prefer testing changes against it instead of starting a second server. Use a separate port only when port `3000` is not responding or the user asks for a dedicated preview.

For UI work, verify the relevant route in the browser or with Playwright against `http://localhost:3000` before deploying when feasible.

## Environment

Expected env variables:

- `DATABASE_URL`
- `TURSO_TOKEN` or `TURSO_AUTH_TOKEN`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Never print, commit, or paste secret values.

Coolify currently runs the app on context `vps2`, project `shootareas`, app `shootareas-web`, branch `develop`, domain:

```text
https://shootareas.marvinl.com
```

Coolify has been configured with `DATABASE_URL`, `TURSO_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` from the local `.env`. The local publishable Clerk key may be named `CLERK_PUBLISHABLE_KEY`; map that value to `VITE_CLERK_PUBLISHABLE_KEY` in Coolify because the Vite client expects the `VITE_` prefix.

## Data Model

Core tables live in `src/server/db/schema.ts`:

- `places`
- `placeImages`
- `categories`
- `categoriesToPlaces`

MVP images are external URLs with credits. Do not add upload/storage work unless explicitly requested.

Do not migrate or rely on old local demo DB data. The clean schema and seed data are the source of truth.

## Product Behavior

Public routes:

- `/`
- `/lieux/$slug`
- `/sign-in/$`
- `/sign-up/$`

Protected route:

- `/nouveau-lieu`

Logged-out users should be redirected from `/nouveau-lieu` to sign-in.

Authenticated place creation should publish immediately for now.

## Design Direction

Read `.impeccable.md` before design/UI changes.

Current direction:

- visual, direct, community-oriented;
- clear, sunny, contrasted interface;
- practical creative scouting notebook, not a neutral corporate directory;
- title typography should feel distinct but stay readable;
- interface must remain fast to scan on mobile.

Current typography:

- display/title: `Fraunces`;
- body/UI: `Space Grotesk`.

Important CSS note: global base styles belong inside `@layer base` in `src/styles/app.css`. Do not put global anchor color rules outside Tailwind layers, because they can override utility classes and break button contrast.

## Engineering Rules

- Prefer existing local patterns and components.
- Keep changes narrow and MVP-oriented.
- Use `rg` for searching.
- Use `apply_patch` for manual file edits.
- Do not introduce local auth/session tables; Clerk is the only auth source.
- Do not hardcode secrets or environment fallbacks that hide missing production config.
- Keep public pages usable without Clerk keys; protected/authenticated flows can require Clerk configuration.
- Use `Link` from `@tanstack/react-router` for internal navigation when touching navigation code.
- After React/UI changes, run at least `bun run build`, `bun run typecheck`, and `git diff --check`.
- For visual changes, verify mobile and desktop if feasible.

## Git And Delivery

This repository uses Jujutsu (`jj`) alongside git. Prefer `jj status`, `jj diff`, and `jj log` for quick local state inspection when useful, then make sure the git branch is exported/pushed correctly for remote delivery.

Default active rebuild branch:

```text
feature/tanstack-start-rebuild
```

Deploy branch:

```text
develop
```

When opening a PR, always open it as normal/ready, never draft.

Use conventional commits. Examples:

- `feat: refine shootareas typography`
- `fix: restore button contrast and db startup`
- `chore: update agent instructions`

When the user asks for deployment, push to `develop` and deploy through Coolify context `vps2`.

## Known Pitfalls

- `drizzle-kit push` can fail in Coolify because interactive prompts require a TTY. Use `db:migrate` for production startup.
- The app needs Nitro in `vite.config.ts` to generate `.output/server/index.mjs`; `dist/server/server.js` is not the production listener.
- If a button appears black-on-black, check Tailwind layer ordering and global anchor styles first.
- The old temporary Coolify domain may still answer, but the intended public domain is `https://shootareas.marvinl.com`.
