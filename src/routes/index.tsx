import { createFileRoute, Link } from "@tanstack/react-router"
import { MapPin, Tag } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { PlaceCard } from "~/components/place-card"
import {
  listCategories,
  listPlaces,
} from "~/server/places"

export const Route = createFileRoute("/")({
  loader: async () => {
    const [allPlaces, categories] = await Promise.all([
      listPlaces({ data: {} }),
      listCategories(),
    ])
    return { allPlaces, categories }
  },
  component: HomePage,
})

function HomePage() {
  const { allPlaces, categories } = Route.useLoaderData()
  const recentPlaces = allPlaces.slice(0, 3)

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

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {recentPlaces.length > 0 ? (
              recentPlaces.map((place, index) => (
                <Link
                  key={place.id}
                  to="/lieux/$slug"
                  params={{ slug: place.slug }}
                  className="group grid min-h-32 gap-2 border border-line bg-surface p-4 transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  <span className="text-sm font-bold text-clay">Nouveau repérage {String(index + 1).padStart(2, "0")}</span>
                  <span className="section-title text-2xl transition-transform group-hover:translate-x-1">{place.title}</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted">
                    <MapPin className="size-4" aria-hidden="true" />
                    {place.city}, {place.country}
                  </span>
                </Link>
              ))
            ) : (
              <div className="grid min-h-48 place-items-center border border-dashed border-line bg-surface p-6 text-center text-muted">
                Le prochain spot à documenter peut être le tien.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-7 md:grid-cols-[minmax(13rem,0.35fr)_1fr] md:items-center">
          <div>
            <h2 className="section-title text-2xl">Explorer par catégorie</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Commence par l’ambiance que tu veux créer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.slug}
                asChild
                className={
                  "bg-lagoon/15 hover:bg-lagoon/30"
                }
              >
                <Link
                  to="/spots"
                  search={{ category: category.slug }}
                >
                  <Tag className="size-3.5" aria-hidden="true" />
                  {category.title}
                </Link>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:py-18">
          <div>
            <h2 className="section-title text-3xl text-paper">Le rendu ne suffit pas.</h2>
            <p className="mt-4 max-w-xl leading-7 text-paper/75">
              Une belle image ne dit pas toujours s’il faut marcher vingt minutes,
              viser le matin ou éviter le dimanche. Ici, les détails terrain
              comptent autant que le décor.
            </p>
          </div>
          <div className="md:border-l md:border-paper/30 md:pl-10">
            <h2 className="section-title text-3xl text-paper">Le repérage se partage.</h2>
            <p className="mt-4 max-w-xl leading-7 text-paper/75">
              Chaque spot aide à préparer la prochaine sortie, tout en mettant en
              avant les créatif·ves qui l’ont repéré et documenté.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title text-4xl">Les spots récents</h2>
            <p className="mt-2 text-muted">
              Les trois derniers repérages publiés, toutes catégories confondues.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/nouveau-lieu">Ajouter un spot</Link>
          </Button>
        </div>

        {recentPlaces.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentPlaces.map((place) => (
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
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/nouveau-lieu">Ajouter le premier spot</Link>
              </Button>
            </div>
          </Card>
        )}
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title text-4xl">Trouver le bon décor</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Parcours tous les spots, cherche une ambiance ou compare les retours de terrain avant ton prochain shoot.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/spots">Voir tous les spots</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
