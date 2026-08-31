import { Show } from "@clerk/tanstack-react-start"
import { Link, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { usePostHog } from "@posthog/react"
import { Star } from "lucide-react"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Textarea } from "~/components/ui/textarea"
import { cn } from "~/lib/utils"
import { isClerkClientConfigured } from "~/lib/clerk"
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
            Avis des spoteur·euses
          </h2>
          <p className="mt-2 text-muted">
            Les retours du terrain pour préparer ton passage.
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
              <p className="text-sm font-semibold text-muted">
                Publié le {formatReviewDate(review.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-line bg-surface p-5 text-muted">
          Aucun avis pour le moment. Partage ton repérage après ta visite.
        </div>
      )}
    </section>
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
          <p className="text-muted">Tu connais ce spot ? Partage ton expérience.</p>
          <Button asChild variant="secondary">
            <Link to="/sign-in/$" params={{ _splat: "" }}>
              Se connecter pour donner un avis
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
  const [rating, setRating] = React.useState(5)
  const [content, setContent] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  )
  const [message, setMessage] = React.useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setMessage("")

    try {
      await submitReview({ data: { placeId, rating, content } })
      setContent("")
      setStatus("success")
      setMessage("Ton avis est publié.")
      await router.invalidate()
    } catch (error) {
      posthog.captureException(error)
      setStatus("error")
      setMessage(
        error instanceof Error ? error.message : "L'avis n'a pas pu être publié."
      )
    }
  }

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="section-title text-xl">Ajouter ton avis</h3>
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
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Textarea
          aria-label="Ton avis"
          value={content}
          minLength={12}
          maxLength={1000}
          placeholder="Ce qui t'a aidé, ce qui a changé, les précautions utiles..."
          onChange={(event) => setContent(event.target.value)}
        />
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
            {status === "submitting" ? "Publication..." : "Publier l’avis"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function formatReviewDate(value: string) {
  return reviewDateFormatter.format(new Date(`${value.replace(" ", "T")}Z`))
}
