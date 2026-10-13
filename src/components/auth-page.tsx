import { ClerkFailed, ClerkLoaded, ClerkLoading } from "@clerk/tanstack-react-start"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"

function AuthUnavailable() {
  return (
    <Card className="max-w-md p-6 text-center" role="alert">
      <h1 className="section-title text-3xl">Connexion indisponible</h1>
      <p className="mt-3 text-muted">
        La connexion est momentanément indisponible. Tu peux continuer à explorer
        les spots et réessayer plus tard.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Explorer les spots</Link>
      </Button>
    </Card>
  )
}

export function AuthPage({
  available,
  children,
}: {
  available: boolean
  children: ReactNode
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      {available ? (
        <>
          <ClerkLoading>
            <p role="status" className="text-muted">Chargement de la connexion…</p>
          </ClerkLoading>
          <ClerkFailed><AuthUnavailable /></ClerkFailed>
          <ClerkLoaded>{children}</ClerkLoaded>
        </>
      ) : <AuthUnavailable />}
    </main>
  )
}
