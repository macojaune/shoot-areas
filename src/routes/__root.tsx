/// <reference types="vite/client" />
import {
  ClerkProvider,
  Show,
  SignInButton,
  UserButton,
} from "@clerk/tanstack-react-start"
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
        content: "Trouve le lieu de ton prochain shooting photo ou vidéo.",
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
        <h1 className="display-title text-5xl">Lieu introuvable</h1>
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
                <Link to="/" className="brand-mark text-3xl">
                  Shootareas
                </Link>
                <nav className="flex items-center gap-2">
                  <Button asChild variant="ghost" className="hidden sm:inline-flex">
                    <Link to="/">Explorer</Link>
                  </Button>
                  <AuthNav clerkConfigured={clerkConfigured} />
                </nav>
              </div>
            </header>
            {children}
            <footer className="border-t border-line bg-ink px-5 py-8 text-paper">
              <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="brand-mark text-3xl">Shootareas</p>
                <p className="max-w-xl text-sm text-paper/70">
                  Spots photo, vidéo et contenus créatifs, avec les infos terrain
                  qu'on aimerait toujours avoir avant d'y aller.
                </p>
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

function AuthNav({ clerkConfigured }: { clerkConfigured: boolean }) {
  if (!clerkConfigured) {
    return (
      <Button asChild variant="secondary">
        <a href="/sign-in">Connexion</a>
      </Button>
    )
  }

  return (
    <>
      <Show when="signed-in">
        <Button asChild variant="secondary">
          <Link to="/nouveau-lieu">Ajouter</Link>
        </Button>
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button type="button" variant="secondary">
            Connexion
          </Button>
        </SignInButton>
      </Show>
    </>
  )
}
