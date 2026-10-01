import { Link, useRouterState } from "@tanstack/react-router"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button, type ButtonProps } from "~/components/ui/button"

export function SpotLink({
  slug,
  className,
  variant = "outline",
}: {
  slug: string
  className?: string
  variant?: ButtonProps["variant"]
}) {
  const isOpening = useRouterState({
    select: (state) => state.isLoading && state.location.pathname === `/lieux/${slug}`,
  })

  return (
    <Button asChild variant={variant} className={className}>
      <Link to="/lieux/$slug" params={{ slug }} aria-busy={isOpening}>
        <span aria-live="polite" aria-atomic="true">
          {isOpening ? "Ouverture…" : "Voir le spot"}
        </span>
        {isOpening ? (
          <LoaderCircle className="feedback-spinner size-4 shrink-0" aria-hidden="true" />
        ) : (
          <ArrowRight className="button-arrow size-4 shrink-0" aria-hidden="true" />
        )}
      </Link>
    </Button>
  )
}
