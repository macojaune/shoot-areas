import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Camera, MapPin } from "lucide-react"
import { ContributorSocialLinks } from "~/components/contributor-social-links"
import { PlaceCard } from "~/components/place-card"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { getPublicContributorDashboard } from "~/server/places"

export const Route = createFileRoute("/eclaireurs/$userId")({
  loader: async ({ params }) =>
    getPublicContributorDashboard({ data: { userId: params.userId } }),
  component: ContributorPage,
})

function ContributorPage() {
  const { profile, spots } = Route.useLoaderData()
  const initials = profile.creditName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:py-12">
      <Button asChild variant="ghost">
        <Link to="/">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Explorer les spots
        </Link>
      </Button>

      <section className="mt-6 grid gap-8 border-b border-line pb-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        {profile.imageUrl ? (
          <img
            src={profile.imageUrl}
            alt=""
            className="size-28 rounded-full border border-line object-cover shadow-[5px_5px_0_#171717]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-28 items-center justify-center rounded-full border border-line bg-sun text-3xl font-bold shadow-[5px_5px_0_#171717]">
            {initials || "S"}
          </span>
        )}
        <div className="max-w-2xl">
          <p className="font-bold text-muted">Éclaireur·euse</p>
          <h1 className="display-title mt-2 text-5xl md:text-6xl">{profile.creditName}</h1>
          {profile.bio ? <p className="mt-4 text-lg leading-8 text-muted">{profile.bio}</p> : null}
          <ContributorSocialLinks links={profile.socialLinks} className="mt-5" />
        </div>
      </section>

      <section className="py-10" aria-labelledby="contributor-spots-title">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              Repérages publiés
            </p>
            <h2 id="contributor-spots-title" className="section-title mt-2 text-4xl">
              Ses spots
            </h2>
          </div>
          <span className="font-semibold text-muted">
            {spots.length} spot{spots.length > 1 ? "s" : ""}
          </span>
        </div>

        {spots.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {spots.map((spot) => (
              <PlaceCard key={spot.id} place={spot} />
            ))}
          </div>
        ) : (
          <Card className="grid justify-items-center gap-3 p-8 text-center text-muted">
            <Camera className="size-10" aria-hidden="true" />
            <p>Pas encore de spot publié par cette personne.</p>
          </Card>
        )}
      </section>
    </main>
  )
}
