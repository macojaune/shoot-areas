import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { createPlace, type CreatePlaceInput } from "~/server/places"
import type { Category } from "~/server/db/schema"

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

function FieldError({ errors }: { errors: unknown[] }) {
  if (errors.length === 0) return null
  return (
    <p className="text-sm font-semibold text-clay">
      {errors.map((error) => String(error)).join(", ")}
    </p>
  )
}

export function PlaceForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const submitPlace = useServerFn(createPlace)
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [images, setImages] = React.useState<ImageDraft[]>([{ ...emptyImage }])
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      country: "Guadeloupe",
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

      const payload: CreatePlaceInput = {
        ...value,
        latitude: value.latitude === "" ? null : Number(value.latitude),
        longitude: value.longitude === "" ? null : Number(value.longitude),
        categorySlugs: selectedCategories,
        images,
      }

      try {
        const place = await submitPlace({ data: payload })
        await router.navigate({ to: "/lieux/$slug", params: { slug: place.slug } })
      } catch (error) {
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
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title text-2xl">Images et crédits</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => setImages((current) => [...current, { ...emptyImage }])}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Image
          </Button>
        </div>
        {images.map((image, index) => (
          <div
            key={index}
            className="grid gap-3 border border-line bg-paper p-4 md:grid-cols-2"
          >
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor={`image-${index}`}>URL image</Label>
              <Input
                id={`image-${index}`}
                value={image.externalUrl}
                placeholder="https://..."
                onChange={(event) =>
                  updateImage(index, "externalUrl", event.target.value)
                }
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
