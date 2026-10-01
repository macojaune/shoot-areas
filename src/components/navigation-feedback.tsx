import { useRouterState } from "@tanstack/react-router"

export function NavigationFeedback() {
  const isLoading = useRouterState({ select: (state) => state.isLoading })

  if (!isLoading) return null

  return (
    <div className="navigation-progress" role="progressbar" aria-label="Navigation en cours">
      <span />
    </div>
  )
}
