import type { LayerGroup, Map as LeafletMap, Marker, Popup } from "leaflet"
import "leaflet/dist/leaflet.css"
import * as React from "react"
import { createPortal } from "react-dom"
import { Link } from "@tanstack/react-router"
import type { PlaceListItem } from "~/server/places"

const DEFAULT_CENTER: [number, number] = [16.265, -61.55]

type LeafletModule = typeof import("leaflet")
export type ExistingMapPlace = Pick<PlaceListItem,
  "id" | "title" | "slug" | "city" | "country" | "latitude" | "longitude"
>

function markerIcon(leaflet: LeafletModule, label?: string) {
  return leaflet.divIcon({
    className: "shootareas-map-marker",
    html: `<span>${label ?? "●"}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function addTiles(leaflet: LeafletModule, map: LeafletMap) {
  leaflet
    .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    })
    .addTo(map)
}

export function LocationPicker({
  latitude,
  longitude,
  center,
  existingPlaces,
  onChange,
}: {
  latitude: number | null
  longitude: number | null
  center?: { latitude: number; longitude: number; name: string } | null
  existingPlaces: ExistingMapPlace[]
  onChange: (coordinates: { latitude: number; longitude: number }) => void
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<LeafletMap | null>(null)
  const markerRef = React.useRef<Marker | null>(null)
  const leafletRef = React.useRef<LeafletModule | null>(null)
  const onChangeRef = React.useRef(onChange)
  const initialCoordinatesRef = React.useRef({ latitude, longitude })
  const [isReady, setIsReady] = React.useState(false)
  const [existingPopup, setExistingPopup] = React.useState<{
    place: ExistingMapPlace
    container: HTMLDivElement
    popup: Popup
  } | null>(null)
  const mappedPlaces = React.useMemo(() => existingPlaces.filter(
    (place): place is ExistingMapPlace & { latitude: number; longitude: number } =>
      validCoordinates(place.latitude, place.longitude)
  ), [existingPlaces])

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  React.useEffect(() => {
    let disposed = false

    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !containerRef.current || mapRef.current) return

        leafletRef.current = leaflet
        const { latitude: initialLatitude, longitude: initialLongitude } =
          initialCoordinatesRef.current
        const initialPosition: [number, number] =
          initialLatitude !== null && initialLongitude !== null && validCoordinates(initialLatitude, initialLongitude)
            ? [initialLatitude, initialLongitude]
            : DEFAULT_CENTER
        const map = leaflet.map(containerRef.current, {
          scrollWheelZoom: true,
          zoomControl: true,
        })
        map.setView(initialPosition, validCoordinates(initialLatitude, initialLongitude) ? 15 : 10)
        addTiles(leaflet, map)
        map.on("click", (event) => {
          onChangeRef.current({
            latitude: Number(event.latlng.lat.toFixed(6)),
            longitude: Number(event.latlng.lng.toFixed(6)),
          })
        })
        mapRef.current = map
        setIsReady(true)
      })
      .catch(() => {
        // Keep manual coordinate fields usable if the map cannot be loaded.
      })

    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      leafletRef.current = null
      setIsReady(false)
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!map || !leaflet) return
    if (latitude === null || longitude === null || !validCoordinates(latitude, longitude)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    const position: [number, number] = [latitude, longitude]
    if (markerRef.current) {
      markerRef.current.setLatLng(position)
    } else {
      markerRef.current = leaflet.marker(position, { icon: markerIcon(leaflet) }).addTo(map)
    }
    map.setView(position, Math.max(map.getZoom(), 15), { animate: true })
  }, [isReady, latitude, longitude])

  React.useEffect(() => {
    if (!center || !validCoordinates(center.latitude, center.longitude)) return
    // A commune only changes the viewport. Exact coordinates stay under the
    // contributor's control and no marker is created by this effect.
    mapRef.current?.setView([center.latitude, center.longitude], 12, { animate: true })
  }, [isReady, center])

  React.useEffect(() => {
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!isReady || !map || !leaflet) return

    const markers = leaflet.layerGroup().addTo(map)
    mappedPlaces.forEach((place, index) => {
      const container = document.createElement("div")
      const marker = leaflet.marker([place.latitude, place.longitude], {
        icon: markerIcon(leaflet, String(index + 1)),
        title: `Spot existant : ${place.title}`,
        alt: `Spot existant : ${place.title}`,
        keyboard: true,
        // Opening a known spot must never select its coordinates for the draft.
        bubblingMouseEvents: false,
      }).addTo(markers)
      marker.bindPopup(container)
      marker.on("popupopen", () => {
        const popup = marker.getPopup()
        if (popup) setExistingPopup({ place, container, popup })
      })
      marker.on("popupclose", () => {
        setExistingPopup((current) => current?.place.id === place.id ? null : current)
      })
    })

    return () => { markers.remove() }
  }, [isReady, mappedPlaces])

  React.useEffect(() => {
    // Leaflet first opens an empty container, then React renders its safe content.
    existingPopup?.popup.update()
  }, [existingPopup])

  return (
    <div className="overflow-hidden border border-line bg-lagoon/10">
      <div ref={containerRef} className="h-72 w-full" aria-label="Choisir la position du spot" />
      {existingPopup && createPortal(
        <div className="grid gap-2">
          <strong>{existingPopup.place.title}</strong>
          <span>{existingPopup.place.city}, {existingPopup.place.country}</span>
          <Link
            to="/lieux/$slug"
            params={{ slug: existingPopup.place.slug }}
            className="font-semibold underline"
          >
            Voir ce spot existant
          </Link>
        </div>,
        existingPopup.container
      )}
      <p className="border-t border-line bg-surface px-4 py-3 text-sm font-semibold text-muted">
        {center ? `Vue centrée sur ${center.name}. ` : ""}
        {mappedPlaces.length > 0 ? "Les repères numérotés sont des spots déjà partagés. " : ""}
        Déplace la carte et clique pour poser le repère exact du spot.
      </p>
    </div>
  )
}

function validCoordinates(latitude: number | null, longitude: number | null): boolean {
  return latitude !== null && longitude !== null && Number.isFinite(latitude) &&
    Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function InteractiveSpotMap({ places }: { places: PlaceListItem[] }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<LeafletMap | null>(null)
  const markersRef = React.useRef<LayerGroup | null>(null)
  const leafletRef = React.useRef<LeafletModule | null>(null)
  const [isReady, setIsReady] = React.useState(false)
  const mappedPlaces = React.useMemo(
    () =>
      places.filter(
        (place): place is PlaceListItem & { latitude: number; longitude: number } =>
          validCoordinates(place.latitude, place.longitude)
      ),
    [places]
  )

  React.useEffect(() => {
    let disposed = false

    void import("leaflet")
      .then((leaflet) => {
        if (disposed || !containerRef.current || mapRef.current) return

        leafletRef.current = leaflet
        const map = leaflet.map(containerRef.current, { scrollWheelZoom: true })
        map.setView(DEFAULT_CENTER, 9)
        addTiles(leaflet, map)
        mapRef.current = map
        setIsReady(true)
      })
      .catch(() => {
        // The page keeps its regular spot list when map tiles are unavailable.
      })

    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = null
      leafletRef.current = null
      setIsReady(false)
    }
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!map || !leaflet) return

    markersRef.current?.remove()
    markersRef.current = null
    if (mappedPlaces.length === 0) return

    const markers = leaflet.layerGroup().addTo(map)
    mappedPlaces.forEach((place, index) => {
      const marker = leaflet
        .marker([place.latitude, place.longitude], { icon: markerIcon(leaflet, String(index + 1)) })
        .addTo(markers)
      marker.bindPopup(
        `<strong>${escapeHtml(place.title)}</strong><br>${escapeHtml(place.city)}, ${escapeHtml(place.country)}<br><a href="/lieux/${encodeURIComponent(place.slug)}">Voir le spot</a>`
      )
    })
    markersRef.current = markers

    if (mappedPlaces.length === 1) {
      const [place] = mappedPlaces
      if (place) map.setView([place.latitude, place.longitude], 14)
    } else {
      map.fitBounds(mappedPlaces.map((place) => [place.latitude, place.longitude]), {
        padding: [36, 36],
        maxZoom: 13,
      })
    }

    return () => {
      markers.remove()
      if (markersRef.current === markers) markersRef.current = null
    }
  }, [isReady, mappedPlaces])

  return <div ref={containerRef} className="h-[30rem] w-full" aria-label="Carte interactive des spots" />
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[character]!
  })
}
