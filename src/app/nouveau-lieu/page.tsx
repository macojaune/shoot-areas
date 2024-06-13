import { getServerAuthSession } from "~/server/auth"
import { redirect } from "next/navigation"
import PlaceForm from "~/components/place-form"

export default async function NewPlacePage({}) {
  const session = await getServerAuthSession()
  if (!session?.user) redirect("/connexion")

  return (
    <div className="container flex flex-col gap-5 bg-l/bg">
      <h1>Créer un nouveau lieu</h1>
      <PlaceForm />
    </div>
  )
}
