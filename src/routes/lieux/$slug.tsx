import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  MapPinned,
  MapPin,
  Navigation,
  Tag,
} from "lucide-react"
import { usePostHog } from "@posthog/react"
import * as React from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { SpotMedia } from "~/components/spot-media"
import {
  ContributorIdentity,
  RatingSummary,
  SpotReviews,
} from "~/components/spot-reviews"
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
  const posthog = usePostHog()

  // Capture spot_viewed once when the component mounts (top of the funnel)
  React.useEffect(() => {
    if (!place) return
    posthog.capture('spot_viewed', {
      spot_slug: place.slug,
      spot_country: place.country,
      spot_city: place.city,
      category_count: place.categories.length,
      has_location: place.latitude !== null && place.longitude !== null,
      review_count: place.reviewCount,
    })
    // We intentionally run this only once on mount — a pageview-style event
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!place) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="display-title text-5xl">Spot introuvable</h1>
        <p className="mt-3 text-muted">Ce spot n'existe pas ou n'est plus publié.</p>
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

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="grid gap-6">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-label="Localisation">
              <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-bold text-muted">
                <MapPinned className="size-4" aria-hidden="true" />
                Région
              </span>
              <Badge asChild className="hover:bg-paper">
                <Link to="/" search={{ country: place.country }}>
                  <MapPinned className="size-3.5" aria-hidden="true" />
                  {place.country}
                </Link>
              </Badge>
              <Badge asChild className="hover:bg-paper">
                <Link to="/" search={{ country: place.country, city: place.city }}>
                  <Building2 className="size-3.5" aria-hidden="true" />
                  {place.city}
                </Link>
              </Badge>
            </div>
            {place.categories.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2" aria-label="Catégories">
                <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-bold text-muted">
                  <Tag className="size-4" aria-hidden="true" />
                  Catégories
                </span>
                {place.categories.map((category) => (
                  <Badge
                    key={category.slug}
                    asChild
                    className="bg-lagoon/15 hover:bg-lagoon/30"
                  >
                    <Link to="/" search={{ category: category.slug }}>
                      {category.title}
                    </Link>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <h1 className="display-title text-5xl md:text-7xl">
              {place.title}
            </h1>
            <p className="flex items-center gap-2 text-lg font-semibold text-muted">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              {[place.address, place.city, place.country].filter(Boolean).join(", ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
            <p className="font-semibold text-muted">
              Repéré par la communauté, enrichi sur le terrain.
            </p>
            <RatingSummary
              averageRating={place.averageRating}
              reviewCount={place.reviewCount}
            />
          </div>

          <Card className="grid gap-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <h2 className="section-title text-2xl">L’avis de l’éclaireur·euse</h2>
                <p className="mt-2 text-muted">Le premier repérage, avant ton passage.</p>
              </div>
              <ContributorIdentity contributor={place.creator} label="Éclaireur·euse" />
            </div>
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

          <SpotReviews
            placeId={place.id}
            reviews={place.reviews}
            averageRating={place.averageRating}
            reviewCount={place.reviewCount}
          />
        </section>

        <aside className="grid h-fit gap-4">
          {navUrl ? (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <a
                href={navUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  posthog.capture('spot_navigation_clicked', {
                    spot_slug: place.slug,
                    spot_country: place.country,
                    spot_city: place.city,
                  })
                }
              >
                <Navigation className="h-5 w-5" aria-hidden="true" />
                Y aller
              </a>
            </Button>
          ) : null}

          <div className="grid gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="section-title text-3xl">Galerie</h2>
              <span className="text-sm font-semibold text-muted">
                {place.images.length} image{place.images.length > 1 ? "s" : ""}
              </span>
            </div>
            {place.images.length > 0 ? (
              place.images.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <SpotMedia
                    url={image.externalUrl}
                    alt={image.caption || place.title}
                    className="w-full object-cover"
                    variant="embed"
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
      <p className="text-sm font-semibold uppercase tracking-normal text-muted">
        {title}
      </p>
      <p className="section-title mt-3 break-words text-3xl">{value}</p>
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
      <h2 className="section-title text-xl">{title}</h2>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-muted">
        {content || "Non précisé pour le moment."}
      </p>
    </Card>
  )
}
