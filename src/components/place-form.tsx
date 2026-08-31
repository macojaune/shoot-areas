import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { usePostHog } from "@posthog/react"
import { MapPin, Plus, Trash2, Upload } from "lucide-react"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { createPlace, type CreatePlaceInput } from "~/server/places"
import { createImageUpload } from "~/server/media"
import type { Category } from "~/server/db/schema"
import type { ContributorProfile } from "~/server/contributor"

type ImageDraft = {
  externalUrl: string
  creditName: string
  creditUrl: string
  caption: string
}

const emptyImage: ImageDraft = {
  externalUrl: "",
  creditName: "",
  creditUrl: "",
  caption: "",
}

const territories = [
  "Guadeloupe",
  "Martinique",
  "Guyane française",
  "La Réunion",
  "Mayotte",
  "Saint-Barthélemy",
  "Saint-Martin",
  "France",
  "Autre",
]

function FieldError({ errors }: { errors: unknown[] }) {
  return (
    <p className="min-h-5 text-sm leading-5 font-semibold text-clay" aria-live="polite">
      {errors.map((error) => String(error)).join(", ")}
    </p>
  )
}

export function PlaceForm({
  categories,
  contributorProfile,
}: {
  categories: Category[]
  contributorProfile: ContributorProfile
}) {
  const router = useRouter()
  const posthog = usePostHog()
  const submitPlace = useServerFn(createPlace)
  const requestImageUpload = useServerFn(createImageUpload)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const imageDraft = React.useCallback(
    (): ImageDraft => ({
      ...emptyImage,
      creditName: contributorProfile.creditName,
      creditUrl: contributorProfile.creditUrl,
    }),
    [contributorProfile.creditName, contributorProfile.creditUrl]
  )
  const [images, setImages] = React.useState<ImageDraft[]>(() => [imageDraft()])
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploadingImageIndex, setUploadingImageIndex] = React.useState<number | null>(
    null
  )
  const [locationStatus, setLocationStatus] = React.useState<
    "idle" | "locating" | "success" | "error"
  >("idle")
  const [locationMessage, setLocationMessage] = React.useState("")
  const fileInputs = React.useRef<Record<number, HTMLInputElement | null>>({})

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      country: "Guadeloupe",
      customCountry: "",
      city: "",
      address: "",
      latitude: "",
      longitude: "",
      accessNotes: "",
      bestLight: "",
      bestPeriod: "",
      accessibilityLevel: 3,
      crowdLevel: 3,
      isPublicPlace: true,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)

      const { customCountry, ...placeValues } = value
      const country =
        placeValues.country === "Autre"
          ? customCountry.trim()
          : placeValues.country

      if (country.length < 2) {
        setSubmitError("Indique le territoire du spot.")
        return
      }

      const payload: CreatePlaceInput = {
        ...placeValues,
        country,
        latitude:
          placeValues.latitude === "" ? null : Number(placeValues.latitude),
        longitude:
          placeValues.longitude === "" ? null : Number(placeValues.longitude),
        categorySlugs: selectedCategories,
        images,
      }

      try {
        const place = await submitPlace({ data: payload })
        await router.navigate({ to: "/lieux/$slug", params: { slug: place.slug } })
      } catch (error) {
        posthog.captureException(error)
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Le spot n'a pas pu être créé."
        )
      }
    },
  })

  function toggleCategory(slug: string) {
    setSelectedCategories((current) =>
      current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug]
    )
  }

  function updateImage(index: number, field: keyof ImageDraft, value: string) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image
      )
    )
  }

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("error")
      setLocationMessage("La géolocalisation n'est pas disponible sur cet appareil.")
      return
    }

    setLocationStatus("locating")
    setLocationMessage("Recherche de ta position...")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldValue("latitude", position.coords.latitude.toFixed(6))
        form.setFieldValue("longitude", position.coords.longitude.toFixed(6))
        setLocationStatus("success")
        setLocationMessage("Position ajoutée. Ajuste-la si le spot est un peu plus loin.")
      },
      (error) => {
        setLocationStatus("error")
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Autorise la géolocalisation pour utiliser ta position actuelle."
            : "La position n'a pas pu être récupérée. Tu peux saisir les coordonnées manuellement."
        )
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    )
  }

  async function uploadImage(index: number, file: File) {
    setUploadError(null)
    setUploadingImageIndex(index)

    try {
      const { uploadUrl, publicUrl } = await requestImageUpload({
        data: {
          fileName: file.name,
          contentType: file.type as "image/avif" | "image/jpeg" | "image/png" | "image/webp",
          size: file.size,
        },
      })
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) {
        throw new Error("L'image n'a pas pu être envoyée.")
      }

      updateImage(index, "externalUrl", publicUrl)
      posthog.capture('image_uploaded', {
        image_index: index,
        file_type: file.type,
        file_size_kb: Math.round(file.size / 1024),
      })
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "L'image n'a pas pu être envoyée."
      )
    } finally {
      setUploadingImageIndex(null)
    }
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <Card className="grid gap-5 p-5">
        <form.Field
          name="title"
          validators={{
            onChange: ({ value }) =>
              value.trim().length >= 3 ? undefined : "Nom trop court",
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Nom du spot</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                placeholder="Sous le pont de l'Alliance"
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <div className="grid gap-5 md:grid-cols-2">
          <form.Field name="country">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Pays / territoire</Label>
                <select
                  id={field.name}
                  name={field.name}
                  className="h-12 w-full border border-line bg-surface px-3 text-base outline-none transition focus:ring-2 focus:ring-sun"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  {territories.map((territory) => (
                    <option key={territory} value={territory}>
                      {territory}
                    </option>
                  ))}
                </select>
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
          <form.Field
            name="city"
            validators={{
              onChange: ({ value }) =>
                value.trim().length >= 2 ? undefined : "Ville requise",
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Ville / commune</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Les Abymes"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe selector={(state) => state.values.country === "Autre"}>
          {(isCustomTerritory) =>
            isCustomTerritory ? (
              <form.Field
                name="customCountry"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length >= 2 ? undefined : "Territoire requis",
                }}
              >
                {(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Précise le territoire</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      placeholder="Par exemple : Dominique"
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>

        <form.Field name="address">
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Adresse ou repère</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                placeholder="Entrée après la boîte aux lettres jaune"
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </div>
          )}
        </form.Field>

        <div className="grid gap-4 border-y border-line py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="section-title text-xl">Localisation précise</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Ajoute le point du spot pour qu’il apparaisse sur la carte. Tu peux
                utiliser ta position actuelle ou coller des coordonnées depuis Maps.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={locationStatus === "locating"}
              onClick={useCurrentLocation}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {locationStatus === "locating" ? "Localisation..." : "Utiliser ma position"}
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <form.Field name="latitude">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Latitude</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="-90"
                    max="90"
                    value={field.state.value}
                    placeholder="16.2418"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="longitude">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Longitude</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="-180"
                    max="180"
                    value={field.state.value}
                    placeholder="-61.5329"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>
          <p
            className={
              locationStatus === "error"
                ? "min-h-5 text-sm font-semibold text-clay"
                : locationStatus === "success"
                  ? "min-h-5 text-sm font-semibold text-lagoon"
                  : "min-h-5 text-sm font-semibold text-muted"
            }
            aria-live="polite"
          >
            {locationMessage || "Optionnel, mais utile pour les repérages à proximité."}
          </p>
        </div>

        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) =>
              value.trim().length >= 40
                ? undefined
                : "Ajoute au moins quelques détails utiles",
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Ce qu'on peut y faire</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                placeholder="Décris le rendu possible, l'ambiance, les précautions, les horaires à viser, les choses à éviter..."
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>
      </Card>

      <Card className="grid gap-5 p-5">
        <h2 className="section-title text-2xl">Préparer le shoot</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <form.Field name="accessNotes">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Accès et détails terrain</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  placeholder="Parking, marche, escaliers, fauteuil roulant, animaux, pluie..."
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>
          <div className="grid gap-4">
            <form.Field name="bestLight">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Meilleure lumière</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    placeholder="Golden hour, matin, temps couvert..."
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="bestPeriod">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Meilleure période</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    placeholder="Saison sèche, semaine, hors vacances..."
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <form.Field name="accessibilityLevel">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Accessibilité : {field.state.value}/5</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="range"
                  min="1"
                  max="5"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(Number(event.target.value))
                  }
                />
              </div>
            )}
          </form.Field>
          <form.Field name="crowdLevel">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Affluence : {field.state.value}/5</Label>
                <input
                  id={field.name}
                  name={field.name}
                  type="range"
                  min="1"
                  max="5"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(Number(event.target.value))
                  }
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name="isPublicPlace">
          {(field) => (
            <label className="flex items-center gap-3 font-semibold">
              <input
                type="checkbox"
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.checked)}
              />
              Spot public ou librement accessible
            </label>
          )}
        </form.Field>
      </Card>

      <Card className="grid gap-5 p-5">
        <h2 className="section-title text-2xl">Catégories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = selectedCategories.includes(category.slug)
            return (
              <button
                key={category.slug}
                type="button"
                className={
                  selected
                    ? "border border-line bg-ink px-3 py-2 font-semibold text-paper"
                    : "border border-line bg-surface px-3 py-2 font-semibold"
                }
                onClick={() => toggleCategory(category.slug)}
              >
                {category.title}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="grid gap-5 p-5">
        <h2 className="section-title text-2xl">Images et crédits</h2>
        <p className="text-sm leading-6 text-muted">
          Colle une URL ou importe une image. Le crédit du profil est déjà prérempli.
        </p>
        {uploadError ? <p className="font-semibold text-clay">{uploadError}</p> : null}
        {images.map((image, index) => (
          <div
            key={index}
            className="grid gap-3 border border-line bg-paper p-4 md:grid-cols-2"
          >
            <div className="grid gap-2 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`image-${index}`}>URL image</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={uploadingImageIndex === index}
                  onClick={() => fileInputs.current[index]?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {uploadingImageIndex === index ? "Envoi..." : "Importer une image"}
                </Button>
              </div>
              <Input
                id={`image-${index}`}
                value={image.externalUrl}
                placeholder="https://..."
                onChange={(event) =>
                  updateImage(index, "externalUrl", event.target.value)
                }
              />
              <input
                ref={(element) => {
                  fileInputs.current[index] = element
                }}
                type="file"
                accept="image/avif,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (file) void uploadImage(index, file)
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`credit-${index}`}>Crédit</Label>
              <Input
                id={`credit-${index}`}
                value={image.creditName}
                placeholder="@photographe"
                onChange={(event) =>
                  updateImage(index, "creditName", event.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`credit-url-${index}`}>Lien crédit</Label>
              <Input
                id={`credit-url-${index}`}
                value={image.creditUrl}
                placeholder="https://instagram.com/..."
                onChange={(event) =>
                  updateImage(index, "creditUrl", event.target.value)
                }
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor={`caption-${index}`}>Légende</Label>
              <Input
                id={`caption-${index}`}
                value={image.caption}
                placeholder="Exemple de rendu au coucher du soleil"
                onChange={(event) =>
                  updateImage(index, "caption", event.target.value)
                }
              />
            </div>
            {images.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                className="justify-self-start"
                onClick={() =>
                  setImages((current) =>
                    current.filter((_, imageIndex) => imageIndex !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Retirer
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          onClick={() => setImages((current) => [...current, imageDraft()])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter une autre image
        </Button>
      </Card>

      {submitError ? (
        <p className="border border-clay bg-clay/10 p-4 font-semibold text-clay">
          {submitError}
        </p>
      ) : null}

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {(state) => (
          <Button
            type="submit"
            size="lg"
            disabled={!state.canSubmit || state.isSubmitting}
            className="w-full md:w-auto md:justify-self-end"
          >
            {state.isSubmitting ? "Publication..." : "Publier le spot"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
