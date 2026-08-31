import { createFileRoute, Link } from "@tanstack/react-router"
import { Building2, Camera, MapPin, MapPinned, Tag, X } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { PlaceCard } from "~/components/place-card"
import { PlaceMap } from "~/components/place-map"
import { isSocialUrl, SpotMedia } from "~/components/spot-media"
import {
  listCategories,
  listPlaces,
  listPlacesFilterSchema,
} from "~/server/places"

export const Route = createFileRoute("/")({
  validateSearch: (search) => listPlacesFilterSchema.parse(search),
  loader: async ({ location }) => {
    const search = listPlacesFilterSchema.parse(location.search)
    const [allPlaces, filteredPlaces, categories] = await Promise.all([
      listPlaces({ data: {} }),
      listPlaces({ data: search }),
      listCategories(),
    ])
    return { allPlaces, filteredPlaces, categories }
  },
  component: HomePage,
})

function HomePage() {
  const { allPlaces, filteredPlaces, categories } = Route.useLoaderData()
  const search = Route.useSearch()
  const featuredPlace = allPlaces[0]
  const featuredImage = featuredPlace?.images.find(
    (image) => !isSocialUrl(image.externalUrl)
  )
  const recentPlaces = allPlaces.slice(0, 3)
  const countries = [...new Set(allPlaces.map((place) => place.country))].sort((a, b) =>
    a.localeCompare(b, "fr")
  )
  const cities = [
    ...new Map(
      allPlaces.map((place) => [
        `${place.country}::${place.city}`,
        { country: place.country, city: place.city },
      ])
    ).values(),
  ].sort((left, right) => left.city.localeCompare(right.city, "fr"))
  const activeFilterLabel = [
    search.category && categories.find((category) => category.slug === search.category)?.title,
    search.city,
    search.country,
  ]
    .filter(Boolean)
    .join(" · ")

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
            {featuredPlace && featuredImage ? (
              <SpotMedia
                url={featuredImage.externalUrl}
                alt={featuredImage.caption || featuredPlace.title}
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
                  search.category === category.slug
                    ? "bg-ink text-paper hover:bg-clay"
                    : "bg-lagoon/15 hover:bg-lagoon/30"
                }
              >
                <Link
                  to="/"
                  hash="tous-les-spots"
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

      <section id="tous-les-spots" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="section-title text-4xl">
                {activeFilterLabel ? `Spots : ${activeFilterLabel}` : "Tous les spots"}
              </h2>
              <p className="mt-2 text-muted">
                {activeFilterLabel
                  ? "Résultats correspondant aux labels sélectionnés."
                  : "Filtre par territoire, commune ou catégorie pour préparer ton repérage."}
              </p>
            </div>
            {activeFilterLabel ? (
              <Button asChild variant="ghost">
                <Link to="/">
                  <X className="size-4" aria-hidden="true" />
                  Effacer les filtres
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="grid gap-5 border-y border-line py-5">
            <FilterGroup icon={MapPinned} label="Région">
              {countries.map((country) => (
                <Badge
                  key={country}
                  asChild
                  className={
                    search.country === country
                      ? "bg-ink text-paper hover:bg-clay"
                      : "hover:bg-paper"
                  }
                >
                  <Link to="/" search={{ country }}>
                    <MapPinned className="size-3.5" aria-hidden="true" />
                    {country}
                  </Link>
                </Badge>
              ))}
            </FilterGroup>

            <FilterGroup icon={Building2} label="Commune">
              {cities.map(({ country, city }) => (
                <Badge
                  key={`${country}-${city}`}
                  asChild
                  className={
                    search.country === country && search.city === city
                      ? "bg-ink text-paper hover:bg-clay"
                      : "hover:bg-paper"
                  }
                >
                  <Link to="/" search={{ country, city }}>
                    <Building2 className="size-3.5" aria-hidden="true" />
                    {city}
                  </Link>
                </Badge>
              ))}
            </FilterGroup>

            <FilterGroup icon={Tag} label="Catégories">
              {categories.map((category) => (
                <Badge
                  key={category.slug}
                  asChild
                  className={
                    search.category === category.slug
                      ? "bg-ink text-paper hover:bg-clay"
                      : "bg-lagoon/15 hover:bg-lagoon/30"
                  }
                >
                  <Link to="/" search={{ category: category.slug }}>
                    {category.title}
                  </Link>
                </Badge>
              ))}
            </FilterGroup>
          </div>

          <div className="mt-8">
            {filteredPlaces.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPlaces.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <Card className="grid gap-4 p-8 text-center">
                <h3 className="section-title text-3xl">Aucun spot avec ce filtre</h3>
                <p className="mx-auto max-w-2xl text-muted">
                  Essaie un autre label ou efface les filtres pour voir tous les spots.
                </p>
                <Button asChild variant="outline" className="mx-auto">
                  <Link to="/">Effacer les filtres</Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </section>

      <PlaceMap places={filteredPlaces} />
    </main>
  )
}

function FilterGroup({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Tag
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <p className="flex items-center gap-2 text-sm font-bold text-muted">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
