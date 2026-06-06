/// <reference types="vite/client" />
import { ClerkProvider, Show, UserButton } from "@clerk/tanstack-react-start"
import { CircleUserRound } from "lucide-react"
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import appCss from "~/styles/app.css?url"
import { Button } from "~/components/ui/button"
import { isClerkClientConfigured } from "~/lib/clerk"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "Shootareas",
      },
      {
        name: "description",
        content: "Trouve le spot de ton prochain shooting photo ou vidéo.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <RootDocument>
      <main className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="display-title text-5xl">Spot introuvable</h1>
        <p className="mt-4 text-muted">Cette page n'existe pas encore.</p>
        <Button asChild className="mt-8">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </main>
    </RootDocument>
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const clerkConfigured = isClerkClientConfigured()

  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        <MaybeClerkProvider enabled={clerkConfigured}>
          <div className="min-h-screen bg-paper text-ink">
            <header className="border-b border-line bg-surface">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2.5 text-3xl"
                >
                  <img
                    src="/favicon.svg"
                    alt=""
                    aria-hidden="true"
                    className="size-8 shrink-0"
                  />
                  <span className="brand-mark truncate">Shootareas</span>
                </Link>
                <nav aria-label="Navigation principale" className="flex items-center gap-2">
                  <Button asChild variant="secondary">
                    <Link to="/nouveau-lieu">Ajouter un spot</Link>
                  </Button>
                  <AccountMenu clerkConfigured={clerkConfigured} />
                </nav>
              </div>
            </header>
            {children}
            <footer className="border-t border-line bg-ink px-5 py-8 text-paper">
              <div className="mx-auto max-w-7xl">
                <p className="mb-7 text-center text-sm text-paper/80">
                  Projet cadré sans trépied par{" "}
                  <a
                    href="https://marvinl.com"
                    className="font-semibold underline decoration-sun underline-offset-4 hover:text-sun"
                  >
                    MarvinL.com
                  </a>
                  .
                </p>
                <div className="grid gap-6 md:grid-cols-3 md:items-center">
                  <nav
                    aria-label="Navigation du pied de page"
                    className="order-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold md:order-1 md:justify-start"
                  >
                    <Link to="/">Accueil</Link>
                    <Link to="/nouveau-lieu">Ajouter un spot</Link>
                    <Link to="/a-propos">À propos</Link>
                    <Link to="/mentions-legales">Mentions légales</Link>
                  </nav>
                  <p className="brand-mark order-1 text-center text-3xl md:order-2 md:text-4xl">
                    Shootareas <span className="font-sans text-base">© 2026</span>
                  </p>
                  <p className="order-3 text-center text-sm leading-6 text-paper/70 md:text-right">
                    Le carnet communautaire pour trouver, partager et préparer les
                    spots qui font déjà le cadre.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </MaybeClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

function MaybeClerkProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  if (!enabled) return <>{children}</>
  return <ClerkProvider>{children}</ClerkProvider>
}

function AccountMenu({ clerkConfigured }: { clerkConfigured: boolean }) {
  if (!clerkConfigured) return null

  return (
    <Show when="signed-in">
      <Button asChild variant="ghost" size="icon">
        <Link to="/profil" aria-label="Mon profil de contribution" title="Mon profil">
          <CircleUserRound className="h-5 w-5" aria-hidden="true" />
        </Link>
      </Button>
      <UserButton />
    </Show>
  )
}
