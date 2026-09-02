import { Link } from "@tanstack/react-router"
import { MapPin } from "lucide-react"
import { InteractiveSpotMap } from "~/components/interactive-map"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import type { PlaceListItem } from "~/server/places"

export function PlaceMap({ places }: { places: PlaceListItem[] }) {
  const mappedPlaces = places.filter(
    (place) => place.latitude !== null && place.longitude !== null
  )

  if (mappedPlaces.length === 0) {
    return (
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <Card className="grid gap-3 bg-surface p-6">
            <Badge className="w-fit bg-sun">
              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              Carte des spots
            </Badge>
            <h2 className="section-title text-3xl">La carte attend ses premiers repères</h2>
            <p className="max-w-2xl leading-7 text-muted">
              Ajoute le point d'un spot sur la carte pendant sa publication pour le
              faire apparaître ici.
            </p>
            <Button asChild className="w-fit">
              <Link to="/nouveau-lieu">Ajouter un spot géolocalisé</Link>
            </Button>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
        <div className="space-y-3">
          <Badge className="w-fit bg-sun">
            <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
            Carte des spots
          </Badge>
          <h2 className="section-title text-4xl">Repère ton prochain passage</h2>
          <p className="max-w-xl leading-7 text-muted">
            Déplace la carte, zoome sur un territoire et ouvre les repères pour
            préparer plusieurs spots dans une même sortie.
          </p>
          <p className="text-sm font-semibold text-muted">
            {mappedPlaces.length} spot{mappedPlaces.length > 1 ? "s" : ""} avec une position précise.
          </p>
        </div>
        <Card className="overflow-hidden">
          <InteractiveSpotMap places={places} />
        </Card>
      </div>
    </section>
  )
}
