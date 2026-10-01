import { MapPin } from "lucide-react"
import { useState } from "react"
import { SpotLink } from "~/components/spot-link"
import { selectPlaceThumbnail } from "~/lib/place-images"
import type { PlaceListItem } from "~/server/places"

export function FeaturedSpot({ place }: { place: PlaceListItem }) {
  const image = selectPlaceThumbnail(place)
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = image && !imageFailed

  return (
    <article className="featured-spot min-w-0 overflow-hidden border border-line bg-ink text-paper">
      {showImage ? (
        <figure>
          <img
            src={image.previewUrl || image.externalUrl}
            alt={image.caption || place.title}
            className="aspect-[16/9] w-full object-cover"
            fetchPriority="high"
            onError={() => setImageFailed(true)}
          />
          <figcaption className="border-b border-paper/20 px-6 py-2 text-xs text-paper/80">
            Photo : {image.creditUrl ? (
              <a href={image.creditUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-sun">
                {image.creditName}
              </a>
            ) : image.creditName}
          </figcaption>
        </figure>
      ) : null}
      <div className="p-6 sm:p-8">
        <h2 className="section-title text-3xl leading-tight text-paper sm:text-4xl">{place.title}</h2>
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-paper/80">
          <MapPin className="mt-0.5 size-4 shrink-0 text-sun" aria-hidden="true" />
          {place.city}, {place.country}
        </p>
        <p className="mt-6 line-clamp-4 text-base leading-7 text-paper/85">
          {place.description}
        </p>
        {place.categories.length > 0 ? (
          <ul aria-label="Ambiances du spot" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-sun">
            {place.categories.slice(0, 3).map((category) => (
              <li key={category.slug}>{category.title}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 border-t border-paper/25 pt-6">
          <SpotLink slug={place.slug} variant="secondary" className="w-full justify-between focus-visible:outline-paper sm:px-5" />
        </div>
      </div>
    </article>
  )
}
