import { SignUp } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { Card } from "~/components/ui/card"
import { isClerkClientConfigured } from "~/lib/clerk"

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpPage,
})

function SignUpPage() {
  if (!isClerkClientConfigured()) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-3xl font-black">Clerk non configuré</h1>
          <p className="mt-3 text-muted">
            Ajoute les clés Clerk dans `.env` pour tester l'inscription.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <SignUp signInUrl="/sign-in" />
    </main>
  )
}
