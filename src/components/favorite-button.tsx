import { Show } from "@clerk/tanstack-react-start"
import { Link, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { Heart } from "lucide-react"
import * as React from "react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { isClerkClientConfigured } from "~/lib/clerk"
import { togglePlaceFavorite } from "~/server/places"

export function FavoriteButton({
  placeId,
  initialValue,
  className,
}: {
  placeId: number
  initialValue: boolean
  className?: string
}) {
  if (!isClerkClientConfigured()) return null

  return (
    <Show
      when="signed-in"
      fallback={
        <Button asChild variant="outline" className={className}>
          <Link to="/sign-in/$" params={{ _splat: "" }}>
            <Heart className="size-4" aria-hidden="true" />
            Enregistrer
          </Link>
        </Button>
      }
    >
      <FavoriteButtonInner
        placeId={placeId}
        initialValue={initialValue}
        className={className}
      />
    </Show>
  )
}

function FavoriteButtonInner({
  placeId,
  initialValue,
  className,
}: {
  placeId: number
  initialValue: boolean
  className?: string
}) {
  const router = useRouter()
  const toggleFavorite = useServerFn(togglePlaceFavorite)
  const [isFavorite, setIsFavorite] = React.useState(initialValue)
  const [isPending, setIsPending] = React.useState(false)

  async function handleClick() {
    setIsPending(true)
    try {
      const result = await toggleFavorite({ data: { placeId } })
      setIsFavorite(result.isFavorite)
      await router.invalidate()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isPending}
      aria-pressed={isFavorite}
      onClick={handleClick}
    >
      <Heart
        className={cn("size-4", isFavorite && "fill-clay text-clay")}
        aria-hidden="true"
      />
      {isFavorite ? "Enregistré" : "Enregistrer"}
    </Button>
  )
}
