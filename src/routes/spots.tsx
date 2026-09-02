import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Building2, MapPinned, Search, SlidersHorizontal, Tag, X } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { PlaceCard } from "~/components/place-card"
import { PlaceMap } from "~/components/place-map"
import {
  listCategories,
  listPlaces,
  listPlacesFilterSchema,
  type ListPlacesFilter,
} from "~/server/places"

export const Route = createFileRoute("/spots")({
  validateSearch: (search) => listPlacesFilterSchema.parse(search),
  loader: async ({ location }) => {
    const search = listPlacesFilterSchema.parse(location.search)
    const [allPlaces, places, categories] = await Promise.all([
      listPlaces({ data: {} }),
      listPlaces({ data: search }),
      listCategories(),
    ])
    return { allPlaces, places, categories }
  },
  component: SpotsPage,
})

function SpotsPage() {
  const { allPlaces, places, categories } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
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
  const hasFilters = Boolean(
    search.query || search.category || search.country || search.city || search.sort
  )

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextSearch: ListPlacesFilter = {}
    const query = String(formData.get("query") ?? "").trim()
    const country = String(formData.get("country") ?? "").trim()
    const city = String(formData.get("city") ?? "").trim()
    const sort = String(formData.get("sort") ?? "").trim()

    if (query) nextSearch.query = query
    if (country) nextSearch.country = country
    if (city) nextSearch.city = city
    if (sort === "rating" || sort === "images") nextSearch.sort = sort

    void navigate({ to: "/spots", search: nextSearch })
  }

  return (
    <main>
      <section className="border-b border-line bg-sun">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:items-end md:py-16">
          <div>
            <h1 className="display-title max-w-3xl text-5xl md:text-7xl">Tous les spots</h1>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8">
              Cherche un décor, affine un territoire ou prépare une sortie avec les
              repères partagés par la communauté.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/nouveau-lieu">Ajouter un spot</Link>
          </Button>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-7">
          <form onSubmit={handleFilterSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="spots-query">Rechercher</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <Input
                  id="spots-query"
                  name="query"
                  defaultValue={search.query}
                  placeholder="Nom, ville, ambiance, accès..."
                  className="pl-10"
                />
              </div>
            </div>
            <SelectField id="spots-country" label="Région" name="country" defaultValue={search.country}>
              <option value="">Toutes les régions</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </SelectField>
            <SelectField id="spots-city" label="Commune" name="city" defaultValue={search.city}>
              <option value="">Toutes les communes</option>
              {cities.map(({ country, city }) => (
                <option key={`${country}-${city}`} value={city}>{city}</option>
              ))}
            </SelectField>
            <SelectField id="spots-sort" label="Trier" name="sort" defaultValue={search.sort}>
              <option value="">Plus récents</option>
              <option value="rating">Mieux notés</option>
              <option value="images">Plus documentés</option>
            </SelectField>
            <Button type="submit" variant="secondary" className="min-h-10">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filtrer
            </Button>
          </form>

          <div className="mt-5 grid gap-4 border-t border-line pt-5">
            <FilterRow icon={Tag} label="Catégories">
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
                  <Link to="/spots" search={{ ...search, category: category.slug }}>
                    {category.title}
                  </Link>
                </Badge>
              ))}
            </FilterRow>
            <FilterRow icon={MapPinned} label="Régions">
              {countries.map((country) => (
                <Badge key={country} asChild className="hover:bg-paper">
                  <Link to="/spots" search={{ ...search, country, city: undefined }}>
                    <MapPinned className="size-3.5" aria-hidden="true" />
                    {country}
                  </Link>
                </Badge>
              ))}
            </FilterRow>
            <FilterRow icon={Building2} label="Communes">
              {cities.map(({ country, city }) => (
                <Badge key={`${country}-${city}`} asChild className="hover:bg-paper">
                  <Link to="/spots" search={{ ...search, country, city }}>
                    <Building2 className="size-3.5" aria-hidden="true" />
                    {city}
                  </Link>
                </Badge>
              ))}
            </FilterRow>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-muted">{places.length} résultat{places.length > 1 ? "s" : ""}</p>
            <h2 className="section-title mt-1 text-4xl">À explorer maintenant</h2>
          </div>
          {hasFilters ? (
            <Button asChild variant="ghost">
              <Link to="/spots">
                <X className="size-4" aria-hidden="true" />
                Effacer les filtres
              </Link>
            </Button>
          ) : null}
        </div>
        {places.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        ) : (
          <Card className="grid gap-4 p-8 text-center">
            <h3 className="section-title text-3xl">Aucun spot ne correspond</h3>
            <p className="text-muted">Essaie une autre recherche ou élargis le territoire.</p>
            <Button asChild variant="outline" className="mx-auto">
              <Link to="/spots">Voir tous les spots</Link>
            </Button>
          </Card>
        )}
      </section>

      <PlaceMap places={places} />
    </main>
  )
}

function SelectField({
  id,
  label,
  name,
  defaultValue,
  children,
}: {
  id: string
  label: string
  name: string
  defaultValue?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 border border-line bg-paper px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sun"
      >
        {children}
      </select>
    </div>
  )
}

function FilterRow({
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
