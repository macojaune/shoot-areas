import { isSocialUrl } from "~/components/spot-media"
import type { PlaceListItem } from "~/server/places"

export function selectPlaceThumbnail(place: PlaceListItem) {
  const candidates = place.images.filter(
    (image) => image.previewUrl || !isSocialUrl(image.externalUrl)
  )
  if (candidates.length === 0) return null

  const seed = `${place.id}:${place.images.length}`
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  return candidates[seed % candidates.length] ?? null
}
