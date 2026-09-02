import { Link } from "@tanstack/react-router"
import { Camera, MapPin } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { isSocialUrl } from "~/components/spot-media"
import type { PlaceListItem } from "~/server/places"

export function PlaceCard({ place }: { place: PlaceListItem }) {
  const image = selectThumbnail(place)

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] border-b border-line bg-lagoon/20">
        {image ? (
          <img
            src={image.previewUrl || image.externalUrl}
            alt={image.caption || place.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-paper">
            <Camera className="h-12 w-12 text-muted" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex grow flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          {place.categories.slice(0, 3).map((category) => (
            <Badge
              key={category.slug}
              asChild
              className="bg-lagoon/15 hover:bg-lagoon/30"
            >
              <Link to="/spots" search={{ category: category.slug }}>
                {category.title}
              </Link>
            </Badge>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="section-title text-2xl">{place.title}</h3>
          <p className="flex items-center gap-2 text-sm font-semibold text-muted">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {place.city}, {place.country}
          </p>
          <p className="line-clamp-3 text-sm leading-6 text-muted">
            {place.description}
          </p>
        </div>
        <Button asChild variant="outline" className="mt-auto w-full">
          <Link to="/lieux/$slug" params={{ slug: place.slug }}>
            Voir le spot
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function selectThumbnail(place: PlaceListItem) {
  const candidates = place.images.filter(
    (image) => image.previewUrl || !isSocialUrl(image.externalUrl)
  )
  if (candidates.length === 0) return null

  const seed = `${place.id}:${place.images.length}`
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  return candidates[seed % candidates.length]
}
