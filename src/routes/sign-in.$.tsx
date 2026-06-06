import { SignIn } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { Card } from "~/components/ui/card"
import { isClerkClientConfigured } from "~/lib/clerk"

export const Route = createFileRoute("/sign-in/$")({
  component: SignInPage,
})

function SignInPage() {
  if (!isClerkClientConfigured()) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
        <Card className="max-w-md p-6 text-center">
          <h1 className="section-title text-3xl">Clerk non configuré</h1>
          <p className="mt-3 text-muted">
            Ajoute `VITE_CLERK_PUBLISHABLE_KEY` et `CLERK_SECRET_KEY` dans `.env`
            pour tester la connexion.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <SignIn withSignUp />
    </main>
  )
}
