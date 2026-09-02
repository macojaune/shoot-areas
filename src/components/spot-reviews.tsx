import { Show } from "@clerk/tanstack-react-start"
import { Link, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { usePostHog } from "@posthog/react"
import { Plus, Star, Trash2, Upload } from "lucide-react"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"
import { isClerkClientConfigured } from "~/lib/clerk"
import { createImageUpload } from "~/server/media"
import {
  createSpotReview,
  type PlaceReviewWithContributor,
} from "~/server/places"

type Contributor = PlaceReviewWithContributor["contributor"]

const reviewDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

export function ContributorIdentity({
  contributor,
  label,
}: {
  contributor: Contributor
  label: string
}) {
  const initials = contributor.creditName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const identity = (
    <>
      <Avatar contributor={contributor} initials={initials} />
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-normal text-muted">
          {label}
        </span>
        <span className="block truncate text-base font-bold">
          {contributor.creditName}
        </span>
      </span>
    </>
  )

  return (
    <Link
      to="/eclaireurs/$userId"
      params={{ userId: contributor.userId }}
      className="inline-flex max-w-full items-center gap-3 rounded-sm outline-none transition hover:text-clay focus-visible:ring-2 focus-visible:ring-sun"
    >
      {identity}
    </Link>
  )
}

function Avatar({
  contributor,
  initials,
}: {
  contributor: Contributor
  initials: string
}) {
  return contributor.imageUrl ? (
    <img
      src={contributor.imageUrl}
      alt=""
      className="size-12 shrink-0 rounded-full border border-line object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-sun text-sm font-bold"
    >
      {initials || "S"}
    </span>
  )
}

export function SpotReviews({
  placeId,
  reviews,
  averageRating,
  reviewCount,
}: {
  placeId: number
  reviews: PlaceReviewWithContributor[]
  averageRating: number | null
  reviewCount: number
}) {
  return (
    <section className="grid gap-5 border-t border-line pt-8" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-title" className="section-title text-3xl">
            Contributions des spoteur·euses
          </h2>
          <p className="mt-2 text-muted">
            Des observations et images de terrain pour préparer ton passage.
          </p>
        </div>
        <RatingSummary averageRating={averageRating} reviewCount={reviewCount} />
      </div>

      <ReviewComposer placeId={placeId} />

      {reviews.length > 0 ? (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="grid gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <ContributorIdentity
                  contributor={review.contributor}
                  label="Spoteur·euse"
                />
                <Rating rating={review.rating} />
              </div>
              <p className="whitespace-pre-wrap leading-7">{review.content}</p>
              <ContributionObservations review={review} />
              {review.images.length > 0 ? (
                <p className="text-sm font-semibold text-muted">
                  {review.images.length} image{review.images.length > 1 ? "s" : ""} ajoutée
                  {review.images.length > 1 ? "s" : ""} à la galerie.
                </p>
              ) : null}
              <p className="text-sm font-semibold text-muted">
                Publié le {formatReviewDate(review.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-line bg-surface p-5 text-muted">
          Aucune contribution pour le moment. Partage ton repérage après ta visite.
        </div>
      )}
    </section>
  )
}

function ContributionObservations({ review }: { review: PlaceReviewWithContributor }) {
  const observations = [
    review.accessibilityLevel !== null
      ? `Accessibilité ${review.accessibilityLevel}/5`
      : null,
    review.crowdLevel !== null ? `Affluence ${review.crowdLevel}/5` : null,
    review.isPublicPlace !== null
      ? review.isPublicPlace
        ? "Accès public"
        : "Accès à vérifier"
      : null,
    review.bestLight ? `Lumière : ${review.bestLight}` : null,
    review.bestPeriod ? `Période : ${review.bestPeriod}` : null,
  ].filter(Boolean)

  if (observations.length === 0 && !review.accessNotes) return null

  return (
    <div className="grid gap-3 border-t border-line pt-4 text-sm">
      {observations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {observations.map((observation) => (
            <span key={observation} className="border border-line bg-paper px-3 py-1.5 font-semibold">
              {observation}
            </span>
          ))}
        </div>
      ) : null}
      {review.accessNotes ? (
        <p className="whitespace-pre-wrap leading-6 text-muted">{review.accessNotes}</p>
      ) : null}
    </div>
  )
}

export function RatingSummary({
  averageRating,
  reviewCount,
}: {
  averageRating: number | null
  reviewCount: number
}) {
  return (
    <div className="flex items-center gap-2 border border-line bg-sun px-4 py-3">
      <Star className="size-5 fill-ink" aria-hidden="true" />
      <span className="text-lg font-bold">
        {averageRating ? averageRating.toFixed(1).replace(".", ",") : "—"}/5
      </span>
      <span className="text-sm font-semibold text-ink/75">
        {reviewCount === 0 ? "Pas encore d’avis" : `${reviewCount} avis`}
      </span>
    </div>
  )
}

function Rating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-bold" aria-label={`${rating} sur 5`}>
      <Star className="size-4 fill-sun" aria-hidden="true" />
      {rating}/5
    </span>
  )
}

function ReviewComposer({ placeId }: { placeId: number }) {
  const clerkConfigured = isClerkClientConfigured()

  if (!clerkConfigured) {
    return (
      <p className="border border-line bg-surface p-5 text-muted">
        La connexion est nécessaire pour publier un avis.
      </p>
    )
  }

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="flex flex-wrap items-center justify-between gap-4 border border-line bg-surface p-5">
          <p className="text-muted">Tu connais ce spot ? Ajoute ton observation et tes images.</p>
          <Button asChild variant="secondary">
            <Link to="/sign-in/$" params={{ _splat: "" }}>
              Se connecter pour contribuer
            </Link>
          </Button>
        </div>
      }
    >
      <ReviewForm placeId={placeId} />
    </Show>
  )
}

function ReviewForm({ placeId }: { placeId: number }) {
  const router = useRouter()
  const posthog = usePostHog()
  const submitReview = useServerFn(createSpotReview)
  const requestImageUpload = useServerFn(createImageUpload)
  const [rating, setRating] = React.useState(5)
  const [content, setContent] = React.useState("")
  const [accessNotes, setAccessNotes] = React.useState("")
  const [bestLight, setBestLight] = React.useState("")
  const [bestPeriod, setBestPeriod] = React.useState("")
  const [accessibilityLevel, setAccessibilityLevel] = React.useState<number | null>(null)
  const [crowdLevel, setCrowdLevel] = React.useState<number | null>(null)
  const [isPublicPlace, setIsPublicPlace] = React.useState<boolean | null>(null)
  const [images, setImages] = React.useState([{ externalUrl: "", caption: "" }])
  const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null)
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  )
  const [message, setMessage] = React.useState("")

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index)
    setMessage("")

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
      if (!response.ok) throw new Error("L'image n'a pas pu être envoyée.")
      setImages((current) =>
        current.map((image, imageIndex) =>
          imageIndex === index ? { ...image, externalUrl: publicUrl } : image
        )
      )
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error ? error.message : "L'image n'a pas pu être envoyée."
      )
    } finally {
      setUploadingIndex(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setMessage("")

    try {
      await submitReview({
        data: {
          placeId,
          rating,
          content,
          accessNotes,
          bestLight,
          bestPeriod,
          accessibilityLevel,
          crowdLevel,
          isPublicPlace,
          images,
        },
      })
      setContent("")
      setAccessNotes("")
      setBestLight("")
      setBestPeriod("")
      setAccessibilityLevel(null)
      setCrowdLevel(null)
      setIsPublicPlace(null)
      setImages([{ externalUrl: "", caption: "" }])
      setStatus("success")
      setMessage("Ta contribution est publiée.")
      await router.invalidate()
    } catch (error) {
      posthog.captureException(error)
      setStatus("error")
      setMessage(
        error instanceof Error ? error.message : "La contribution n'a pas pu être publiée."
      )
    }
  }

  return (
    <Card className="grid gap-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title text-2xl">Ajouter ton passage</h3>
          <p className="mt-1 text-sm text-muted">Partage ce que tu as réellement trouvé sur place.</p>
        </div>
        <fieldset className="flex items-center gap-1" aria-label="Ta note">
          <legend className="sr-only">Ta note</legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} sur 5`}
              aria-pressed={rating === value}
              className={cn(
                "grid size-9 place-items-center rounded-sm outline-none transition hover:bg-paper focus-visible:ring-2 focus-visible:ring-sun",
                value <= rating ? "text-ink" : "text-muted"
              )}
              onClick={() => setRating(value)}
            >
              <Star className={cn("size-5", value <= rating && "fill-sun")} aria-hidden="true" />
            </button>
          ))}
        </fieldset>
      </div>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Textarea
          aria-label="Ton retour de terrain"
          value={content}
          minLength={12}
          maxLength={1000}
          placeholder="Ce qui t'a aidé, ce qui a changé, les précautions utiles..."
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="grid gap-4 border-y border-line py-5 md:grid-cols-3">
          <ObservationSelect
            label="Accessibilité"
            value={accessibilityLevel}
            onChange={setAccessibilityLevel}
          />
          <ObservationSelect label="Affluence" value={crowdLevel} onChange={setCrowdLevel} />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-bold">Type d'accès</legend>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isPublicPlace === true ? "primary" : "outline"}
                size="sm"
                onClick={() => setIsPublicPlace(true)}
              >
                Public
              </Button>
              <Button
                type="button"
                variant={isPublicPlace === false ? "primary" : "outline"}
                size="sm"
                onClick={() => setIsPublicPlace(false)}
              >
                À vérifier
              </Button>
            </div>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor="review-best-light">Lumière</Label>
            <Input
              id="review-best-light"
              value={bestLight}
              placeholder="Matin, golden hour..."
              onChange={(event) => setBestLight(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-best-period">Meilleure période</Label>
            <Input
              id="review-best-period"
              value={bestPeriod}
              placeholder="Saison sèche, semaine..."
              onChange={(event) => setBestPeriod(event.target.value)}
            />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="review-access-notes">Accès et précautions</Label>
            <Textarea
              id="review-access-notes"
              value={accessNotes}
              placeholder="Ce qui a changé depuis le premier repérage, accès, sécurité..."
              onChange={(event) => setAccessNotes(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold">Images de ton passage</h4>
              <p className="text-sm text-muted">Elles rejoignent la galerie du spot avec ton profil.</p>
            </div>
            {images.length < 8 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImages((current) => [...current, { externalUrl: "", caption: "" }])}
              >
                <Plus className="size-4" aria-hidden="true" />
                Ajouter une image
              </Button>
            ) : null}
          </div>
          {images.map((image, index) => (
            <div key={index} className="grid gap-3 border border-line bg-paper p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label htmlFor={`review-image-url-${index}`}>Lien image ou post</Label>
                <Input
                  id={`review-image-url-${index}`}
                  type="url"
                  value={image.externalUrl}
                  placeholder="https://..."
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((currentImage, imageIndex) =>
                        imageIndex === index
                          ? { ...currentImage, externalUrl: event.target.value }
                          : currentImage
                      )
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`review-image-caption-${index}`}>Légende</Label>
                <Input
                  id={`review-image-caption-${index}`}
                  value={image.caption}
                  placeholder="Rendu, ambiance, précision..."
                  onChange={(event) =>
                    setImages((current) =>
                      current.map((currentImage, imageIndex) =>
                        imageIndex === index
                          ? { ...currentImage, caption: event.target.value }
                          : currentImage
                      )
                    )
                  }
                />
              </div>
              <div className="flex gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-line bg-surface px-3 text-sm font-bold transition hover:bg-sun">
                  <Upload className="size-4" aria-hidden="true" />
                  {uploadingIndex === index ? "Envoi..." : "Importer"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/avif,image/jpeg,image/png,image/webp"
                    disabled={uploadingIndex !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void uploadImage(index, file)
                      event.target.value = ""
                    }}
                  />
                </label>
                {images.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer cette image"
                    onClick={() =>
                      setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              "min-h-5 text-sm font-semibold",
              status === "error" && "text-clay",
              status === "success" && "text-lagoon"
            )}
            aria-live="polite"
          >
            {message}
          </p>
          <Button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Publication..." : "Publier la contribution"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ObservationSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  const id = `review-${label.toLowerCase()}`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="h-10 border border-line bg-surface px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sun"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">Non observé</option>
        {[1, 2, 3, 4, 5].map((option) => (
          <option key={option} value={option}>
            {option}/5
          </option>
        ))}
      </select>
    </div>
  )
}

function formatReviewDate(value: string) {
  return reviewDateFormatter.format(new Date(`${value.replace(" ", "T")}Z`))
}
