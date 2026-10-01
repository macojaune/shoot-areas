import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router"
import { LoaderCircle, Search, SlidersHorizontal, Tag, X } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
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
  type PlaceListItem,
} from "~/server/places"

export const Route = createFileRoute("/spots")({
  validateSearch: (search) => listPlacesFilterSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [allPlaces, places, categories] = await Promise.all([
      listPlaces({ data: {} }),
      listPlaces({ data: deps }),
      listCategories(),
    ])
    return { allPlaces, places, categories, filters: deps }
  },
  component: SpotsPage,
})

function SpotsPage() {
  const { allPlaces, places, categories, filters } = Route.useLoaderData()
  const search = Route.useSearch()
  const isFiltering = useRouterState({
    select: (state) => state.isLoading && state.location.pathname === "/spots",
  })
  const hasFilters = Boolean(
    search.query || search.category || search.country || search.city || search.sort
  )

  return (
    <main>
      <section className="border-b border-line bg-sun">
        <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
          <h1 className="display-title max-w-3xl text-5xl md:text-7xl">Tous les spots</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium leading-8">
            Cherche un décor, affine un territoire ou prépare une sortie avec les
            repères partagés par la communauté.
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-surface" aria-label="Filtrer les spots">
        <div className="mx-auto max-w-7xl px-5 py-7">
          <SpotFilters
            key={JSON.stringify(search)}
            search={search}
            allPlaces={allPlaces}
            isFiltering={isFiltering}
          />
          <div className="mt-5 grid gap-3 border-t border-line pt-5">
            <p className="flex items-center gap-2 text-sm font-bold text-muted" id="spots-categories">
              <Tag className="size-4" aria-hidden="true" />
              Catégories
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="spots-categories">
              {categories.map((category) => {
                const selected = search.category === category.slug
                return (
                  <Badge
                    key={category.slug}
                    asChild
                    className={selected ? "min-h-9 bg-sun text-ink" : "min-h-9 bg-lagoon/15 hover:bg-sun focus-visible:bg-sun"}
                  >
                    <Link
                      to="/spots"
                      search={{ ...search, category: selected ? undefined : category.slug }}
                      aria-label={selected ? `Retirer le filtre ${category.title}` : category.title}
                      aria-current={selected ? "true" : undefined}
                    >
                      {category.title}
                      {selected ? <X className="size-3.5" aria-hidden="true" /> : null}
                    </Link>
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12" aria-busy={isFiltering}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-muted" role="status" aria-atomic="true">
              {isFiltering ? "Recherche en cours…" : `${places.length} résultat${places.length > 1 ? "s" : ""}`}
            </p>
            <h2 className="section-title mt-1 text-4xl">À explorer maintenant</h2>
          </div>
          {hasFilters ? (
            <Button asChild variant="ghost">
              <Link to="/spots" search={{}}>
                <X className="size-4" aria-hidden="true" />
                Effacer les filtres
              </Link>
            </Button>
          ) : null}
        </div>
        <div key={JSON.stringify(filters)} className="results-reveal">
          {places.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {places.map((place) => <PlaceCard key={place.id} place={place} />)}
            </div>
          ) : (
            <Card className="grid gap-4 p-8 text-center">
              <h3 className="section-title text-3xl">Aucun spot ne correspond</h3>
              <p className="text-muted">Essaie une autre recherche ou élargis le territoire.</p>
              <Button asChild variant="outline" className="mx-auto">
                <Link to="/spots" search={{}}>Voir tous les spots</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      <PlaceMap places={places} />
    </main>
  )
}

function SpotFilters({
  search,
  allPlaces,
  isFiltering,
}: {
  search: ListPlacesFilter
  allPlaces: PlaceListItem[]
  isFiltering: boolean
}) {
  const navigate = useNavigate({ from: Route.fullPath })
  const [country, setCountry] = useState(search.country ?? "")
  const [city, setCity] = useState(search.city ?? "")
  const [sort, setSort] = useState(search.sort === "recent" ? "" : search.sort ?? "")
  const countries = [...new Set(allPlaces.map((place) => place.country))].sort((a, b) =>
    a.localeCompare(b, "fr")
  )
  const cities = [...new Set(
    allPlaces.filter((place) => !country || place.country === country).map((place) => place.city)
  )].sort((a, b) => a.localeCompare(b, "fr"))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get("query") ?? "").trim()
    const nextSearch: ListPlacesFilter = {
      category: search.category,
      query: query || undefined,
      country: country || undefined,
      city: city || undefined,
      sort: sort === "rating" || sort === "images" ? sort : undefined,
    }
    void navigate({ to: "/spots", search: nextSearch })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))_auto] lg:items-end">
      <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="spots-query">Rechercher</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 text-muted -translate-y-1/2" aria-hidden="true" />
          <Input id="spots-query" name="query" defaultValue={search.query ?? ""} placeholder="Nom, ville, ambiance…" className="h-11 pl-10" />
        </div>
      </div>
      <SelectField id="spots-country" label="Région" name="country" value={country} onChange={(value) => { setCountry(value); setCity("") }}>
        <option value="">Toutes les régions</option>
        {countries.map((value) => <option key={value} value={value}>{value}</option>)}
      </SelectField>
      <SelectField id="spots-city" label="Commune" name="city" value={city} onChange={setCity}>
        <option value="">Toutes les communes</option>
        {cities.map((value) => <option key={value} value={value}>{value}</option>)}
      </SelectField>
      <SelectField id="spots-sort" label="Trier" name="sort" value={sort} onChange={setSort}>
        <option value="">Plus récents</option>
        <option value="rating">Mieux notés</option>
        <option value="images">Plus documentés</option>
      </SelectField>
      <Button type="submit" variant="secondary" disabled={isFiltering} className="h-11 sm:self-end">
        {isFiltering ? <LoaderCircle className="feedback-spinner size-4" aria-hidden="true" /> : <SlidersHorizontal className="size-4" aria-hidden="true" />}
        {isFiltering ? "Recherche…" : "Filtrer"}
      </Button>
    </form>
  )
}

function SelectField({
  id,
  label,
  name,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 border border-line bg-paper px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sun"
      >
        {children}
      </select>
    </div>
  )
}
