import { createFileRoute } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { requireUser } from "~/server/auth"
import {
  getCurrentContributorProfile,
  updateCurrentContributorProfile,
} from "~/server/contributor"

export const Route = createFileRoute("/profil")({
  beforeLoad: async () => await requireUser(),
  loader: async () => getCurrentContributorProfile(),
  component: ProfilePage,
})

function ProfilePage() {
  const profile = Route.useLoaderData()
  const updateProfile = useServerFn(updateCurrentContributorProfile)
  const [creditName, setCreditName] = React.useState(profile.creditName)
  const [creditUrl, setCreditUrl] = React.useState(profile.creditUrl)
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )
  const [error, setError] = React.useState("")

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-8 max-w-2xl space-y-3">
        <h1 className="display-title text-5xl">Mon profil de contribution</h1>
        <p className="text-lg leading-8 text-muted">
          Ces informations apparaissent sous les images ajoutées sans crédit
          spécifique.
        </p>
      </div>

      <Card className="grid gap-5 p-5">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            setStatus("saving")
            setError("")

            void updateProfile({
              data: { creditName, creditUrl },
            })
              .then((nextProfile) => {
                setCreditName(nextProfile.creditName)
                setCreditUrl(nextProfile.creditUrl)
                setStatus("saved")
              })
              .catch((profileError) => {
                setStatus("error")
                setError(
                  profileError instanceof Error
                    ? profileError.message
                    : "Le profil n'a pas pu être enregistré."
                )
              })
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="credit-name">Nom du crédit</Label>
            <Input
              id="credit-name"
              value={creditName}
              placeholder="@toncompte ou Prénom Nom"
              onChange={(event) => setCreditName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="credit-url">Lien du crédit</Label>
            <Input
              id="credit-url"
              type="url"
              value={creditUrl}
              placeholder="https://instagram.com/toncompte"
              onChange={(event) => setCreditUrl(event.target.value)}
            />
          </div>
          {error ? <p className="font-semibold text-clay">{error}</p> : null}
          {status === "saved" ? (
            <p className="font-semibold text-lagoon">Profil enregistré.</p>
          ) : null}
          <Button type="submit" className="justify-self-start" disabled={status === "saving"}>
            {status === "saving" ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </Card>
    </main>
  )
}
