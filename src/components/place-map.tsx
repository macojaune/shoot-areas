import { Link } from "@tanstack/react-router"
import { ExternalLink, MapPin, Navigation } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import type { PlaceListItem } from "~/server/places"

const TILE_SIZE = 256
const GRID_TILES = 3
const GRID_PIXELS = TILE_SIZE * GRID_TILES
const MIN_ZOOM = 5
const MAX_ZOOM = 13

type MappedPlace = PlaceListItem & {
  latitude: number
  longitude: number
}

function isMappedPlace(place: PlaceListItem): place is MappedPlace {
  return place.latitude !== null && place.longitude !== null
}

function longitudeToWorldX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * TILE_SIZE * 2 ** zoom
}

function latitudeToWorldY(latitude: number, zoom: number) {
  const sinLatitude = Math.sin((latitude * Math.PI) / 180)
  const y =
    0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)
  return y * TILE_SIZE * 2 ** zoom
}

function getTileUrl(x: number, y: number, zoom: number) {
  const tileCount = 2 ** zoom
  const wrappedX = ((x % tileCount) + tileCount) % tileCount
  const clampedY = Math.min(Math.max(y, 0), tileCount - 1)
  return `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${clampedY}.png`
}

function getMapState(places: MappedPlace[]) {
  const latitudes = places.map((place) => place.latitude)
  const longitudes = places.map((place) => place.longitude)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const centerLatitude = (minLatitude + maxLatitude) / 2
  const centerLongitude = (minLongitude + maxLongitude) / 2

  let zoom = MAX_ZOOM
  for (let candidate = MAX_ZOOM; candidate >= MIN_ZOOM; candidate -= 1) {
    const left = longitudeToWorldX(minLongitude, candidate)
    const right = longitudeToWorldX(maxLongitude, candidate)
    const top = latitudeToWorldY(maxLatitude, candidate)
    const bottom = latitudeToWorldY(minLatitude, candidate)
    const fitsWidth = Math.abs(right - left) <= GRID_PIXELS * 0.68
    const fitsHeight = Math.abs(bottom - top) <= GRID_PIXELS * 0.55

    if (places.length === 1 || (fitsWidth && fitsHeight)) {
      zoom = candidate
      break
    }
  }

  const centerX = longitudeToWorldX(centerLongitude, zoom)
  const centerY = latitudeToWorldY(centerLatitude, zoom)
  const topLeftX = centerX - GRID_PIXELS / 2
  const topLeftY = centerY - GRID_PIXELS / 2
  const startTileX = Math.floor(topLeftX / TILE_SIZE)
  const startTileY = Math.floor(topLeftY / TILE_SIZE)

  return {
    zoom,
    topLeftX,
    topLeftY,
    startTileX,
    startTileY,
  }
}

export function PlaceMap({ places }: { places: PlaceListItem[] }) {
  const mappedPlaces = places.filter(isMappedPlace)

  if (mappedPlaces.length === 0) {
    const hasPlaces = places.length > 0

    return (
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <Card className="grid gap-3 bg-surface p-6">
            <Badge className="w-fit bg-sun">
              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              Carte des spots
            </Badge>
            <h2 className="section-title text-3xl">Coordonnées à compléter</h2>
            <p className="max-w-2xl leading-7 text-muted">
              {hasPlaces
                ? "Les premiers spots existent, mais aucun n'a encore de latitude et longitude exploitables. Ajoute les coordonnées sur les prochains spots pour les faire apparaître ici."
                : "La carte est prête pour les premiers spots. Ajoute un spot avec ses coordonnées pour commencer à construire une vraie vue terrain."}
            </p>
            <Button asChild className="w-fit">
              <Link to="/nouveau-lieu">Ajouter un spot géolocalisé</Link>
            </Button>
          </Card>
        </div>
      </section>
    )
  }

  const mapState = getMapState(mappedPlaces)
  const tiles = Array.from({ length: GRID_TILES * GRID_TILES }, (_, index) => {
    const column = index % GRID_TILES
    const row = Math.floor(index / GRID_TILES)
    return {
      src: getTileUrl(
        mapState.startTileX + column,
        mapState.startTileY + row,
        mapState.zoom
      ),
      column,
      row,
    }
  })

  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3">
          <Badge className="w-fit bg-sun">
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Carte des spots
          </Badge>
          <h2 className="section-title text-4xl">Voir les spots d'un coup</h2>
          <p className="max-w-3xl leading-7 text-muted">
            Une vue rapide des spots déjà géolocalisés, utile pour repérer les
            distances, grouper une sortie et ouvrir directement la fiche du spot.
          </p>
          <Card className="relative aspect-[4/3] overflow-hidden bg-lagoon/10 sm:aspect-[16/9]">
            <div
              className="absolute inset-0 grid opacity-95"
              style={{
                gridTemplateColumns: `repeat(${GRID_TILES}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_TILES}, 1fr)`,
              }}
              aria-hidden="true"
            >
              {tiles.map((tile) => (
                <img
                  key={`${tile.column}-${tile.row}`}
                  src={tile.src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,0.12)_1px,transparent_1px),linear-gradient(180deg,rgba(23,23,23,0.12)_1px,transparent_1px)] bg-[size:64px_64px]" />
            {mappedPlaces.map((place, index) => {
              const worldX = longitudeToWorldX(place.longitude, mapState.zoom)
              const worldY = latitudeToWorldY(place.latitude, mapState.zoom)
              const left = ((worldX - mapState.topLeftX) / GRID_PIXELS) * 100
              const top = ((worldY - mapState.topLeftY) / GRID_PIXELS) * 100

              return (
                <Link
                  key={place.id}
                  to="/lieux/$slug"
                  params={{ slug: place.slug }}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  aria-label={`Voir ${place.title}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-ink bg-clay text-sm font-black text-paper shadow-[4px_4px_0_#171717] transition-transform group-hover:-translate-y-1">
                    {index + 1}
                  </span>
                </Link>
              )
            })}
            <p className="absolute bottom-2 right-2 bg-surface px-2 py-1 text-xs font-semibold text-muted">
              © OpenStreetMap
            </p>
          </Card>
        </div>

        <div className="grid content-start gap-3">
          {mappedPlaces.slice(0, 6).map((place, index) => (
            <Link
              key={place.id}
              to="/lieux/$slug"
              params={{ slug: place.slug }}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border border-line bg-surface p-4 transition-colors hover:bg-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-line bg-clay font-black text-paper">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{place.title}</span>
                <span className="mt-1 flex items-center gap-2 text-sm text-muted">
                  <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {place.city}, {place.country}
                </span>
              </span>
            </Link>
          ))}
          {mappedPlaces.length > 6 ? (
            <p className="text-sm font-semibold text-muted">
              + {mappedPlaces.length - 6} autres spots visibles sur la carte.
            </p>
          ) : null}
          <Button asChild variant="outline" className="mt-1 w-full">
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir OpenStreetMap
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
