import { createFileRoute, Link } from "@tanstack/react-router"
import { Camera, MapPin } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { PlaceCard } from "~/components/place-card"
import { PlaceMap } from "~/components/place-map"
import { SpotMedia } from "~/components/spot-media"
import { listCategories, listPlaces } from "~/server/places"

export const Route = createFileRoute("/")({
  loader: async () => {
    const [places, categories] = await Promise.all([
      listPlaces(),
      listCategories(),
    ])
    return { places, categories }
  },
  component: HomePage,
})

function HomePage() {
  const { places, categories } = Route.useLoaderData()
  const featuredPlace = places[0]

  return (
    <main>
      <section className="border-b border-line bg-sun">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="flex flex-col justify-center gap-6">
            <div className="space-y-4">
              <h1 className="display-title max-w-3xl text-5xl md:text-7xl">
                Trouve le spot de ton prochain shoot
              </h1>
              <p className="max-w-2xl text-lg font-medium leading-8">
                Des spots uniques pour tes photos, vidéos, tournages, contenus,
                galeries et rendus créatifs. Avec les détails terrain qui font
                gagner du temps avant de sortir le matériel.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden bg-surface">
            {featuredPlace?.images[0] ? (
              <SpotMedia
                url={featuredPlace.images[0].externalUrl}
                alt={featuredPlace.images[0].caption || featuredPlace.title}
                className="aspect-[5/4] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[5/4] items-center justify-center bg-lagoon/20">
                <Camera className="h-20 w-20 text-muted" aria-hidden="true" />
              </div>
            )}
            <div className="border-t border-line p-5">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-muted">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Spot à découvrir
              </p>
              <h2 className="section-title mt-2 text-3xl">
                {featuredPlace?.title ?? "Le prochain spot est à toi"}
              </h2>
              <p className="mt-2 text-muted">
                {featuredPlace
                  ? `${featuredPlace.city}, ${featuredPlace.country}`
                  : "Ajoute le premier spot proprement documenté."}
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-5 py-6">
          {categories.map((category) => (
            <Badge key={category.slug}>{category.title}</Badge>
          ))}
        </div>
      </section>

      <PlaceMap places={places} />

      <section id="spots" className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title text-4xl">Les spots récents</h2>
            <p className="mt-2 text-muted">
              Pour préparer vite un rendu, un itinéraire et les contraintes du terrain.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/nouveau-lieu">Ajouter un spot</Link>
          </Button>
        </div>

        {places.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        ) : (
          <Card className="grid gap-4 p-8 text-center">
            <h3 className="section-title text-3xl">Aucun spot publié</h3>
            <p className="mx-auto max-w-2xl text-muted">
              Le socle est prêt pour collecter les premiers spots. Le MVP publie
              immédiatement les spots ajoutés par les utilisateurs connectés.
            </p>
            <Button asChild className="mx-auto">
              <Link to="/nouveau-lieu">Ajouter le premier spot</Link>
            </Button>
          </Card>
        )}
      </section>
    </main>
  )
}
