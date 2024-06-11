import { getServerAuthSession } from "~/server/auth"
import EmailLoginForm from "../components/login-form"
import { Button } from "~/app/components/ui/button"
import { signOut } from "next-auth/react"

export default async function Auth() {
  const session = await getServerAuthSession()
  console.log("login session:", session)
  return (
    <main className="flex min-h-screen flex-col text-l/support">
      <div className="container flex grow flex-col items-center justify-center gap-5 bg-l/bg">
        {session ? (
          <div>
            <h2>Connecté en tant que {session.user.email}</h2>
          </div>
        ) : (
          <EmailLoginForm />
        )}
      </div>
    </main>
  )
}
