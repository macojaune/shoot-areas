import { Link } from "@tanstack/react-router"
import { Camera, MapPin } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { SpotLink } from "~/components/spot-link"
import { Card } from "~/components/ui/card"
import { selectPlaceThumbnail } from "~/lib/place-images"
import type { PlaceListItem } from "~/server/places"

export function PlaceCard({ place }: { place: PlaceListItem }) {
  const image = selectPlaceThumbnail(place)

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
        <SpotLink slug={place.slug} className="mt-auto w-full justify-between" />
      </div>
    </Card>
  )
}
