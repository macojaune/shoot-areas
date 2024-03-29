import { getServerAuthSession } from "~/server/auth"

export default async function Auth() {
  const session = await getServerAuthSession()

  return (
    <div>
      <h1>Connexion</h1>
      {session ? (
        <div>
          <h2>Connecté en tant que {session.user.email}</h2>
          <a href="/api/auth/logout">Déconnexion</a>
        </div>
      ) : (
        <a href="/api/auth/login">Connexion</a>
      )}
    </div>
  )
}
