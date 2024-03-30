import { getServerAuthSession } from "~/server/auth"
import EmailLoginForm from "../components/email-login-form"

export default async function Auth() {
  const session = await getServerAuthSession()

  return (
    <main className="text-l/support flex min-h-screen flex-col">
      <div className="bg-l/bg container flex grow flex-col items-center justify-center gap-5">
        <h1 className="text-l/support text-5xl font-medium">Connexion</h1>
        {session ? (
          <div>
            <h2>Connecté en tant que {session.user.email}</h2>
            <a>Déconnexion</a>
          </div>
        ) : (
          <EmailLoginForm />
        )}
      </div>
    </main>
  )
}
