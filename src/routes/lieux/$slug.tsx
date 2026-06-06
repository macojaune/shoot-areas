import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, ExternalLink, MapPin, Navigation } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { navigationUrl } from "~/lib/utils"
import { getPlaceBySlug } from "~/server/places"

export const Route = createFileRoute("/lieux/$slug")({
  loader: async ({ params }) => {
    const place = await getPlaceBySlug({ data: { slug: params.slug } })
    return { place }
  },
  component: PlacePage,
})

function PlacePage() {
  const { place } = Route.useLoaderData()

  if (!place) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-5xl font-black">Spot introuvable</h1>
        <p className="mt-3 text-muted">Ce lieu n'existe pas ou n'est plus publié.</p>
        <Button asChild className="mt-8">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </main>
    )
  }

  const navUrl = navigationUrl(place.latitude, place.longitude)

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:py-12">
      <Button asChild variant="ghost">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </Link>
      </Button>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="grid gap-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{place.country}</Badge>
            <Badge>{place.city}</Badge>
            {place.categories.map((category) => (
              <Badge key={category.slug}>{category.title}</Badge>
            ))}
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black leading-none md:text-7xl">
              {place.title}
            </h1>
            <p className="flex items-center gap-2 text-lg font-semibold text-muted">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              {[place.address, place.city, place.country].filter(Boolean).join(", ")}
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-black">Tips de l'éclaireur·euse</h2>
            <p className="mt-4 whitespace-pre-wrap text-lg leading-8">
              {place.description}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Metric title="Accessibilité" value={`${place.accessibilityLevel}/5`} />
            <Metric title="Affluence" value={`${place.crowdLevel}/5`} />
            <Metric
              title="Type"
              value={place.isPublicPlace ? "Public" : "À vérifier"}
            />
            <Metric title="Lumière" value={place.bestLight || "Non précisé"} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock title="Accès et terrain" content={place.accessNotes} />
            <InfoBlock title="Meilleure période" content={place.bestPeriod} />
          </div>
        </section>

        <aside className="grid h-fit gap-4">
          {navUrl ? (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <a href={navUrl} target="_blank" rel="noreferrer">
                <Navigation className="h-5 w-5" aria-hidden="true" />
                Y aller
              </a>
            </Button>
          ) : null}

          <div className="grid gap-4">
            {place.images.length > 0 ? (
              place.images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <img
                    src={image.externalUrl}
                    alt={image.caption || place.title}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-2 border-t border-line p-4">
                    {image.caption ? (
                      <p className="font-semibold">{image.caption}</p>
                    ) : null}
                    {image.creditUrl ? (
                      <a
                        href={image.creditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-clay"
                      >
                        {image.creditName}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-muted">
                        Crédit : {image.creditName}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-muted">
                Aucune image créditée pour ce spot.
              </Card>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </Card>
  )
}

function InfoBlock({
  title,
  content,
}: {
  title: string
  content: string | null
}) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-muted">
        {content || "Non précisé pour le moment."}
      </p>
    </Card>
  )
}
