import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  const token =
    process.env.POSTHOG_PROJECT_TOKEN ||
    import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN

  if (!token) {
    if (import.meta.env.DEV) {
      console.warn(
        "POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured"
      )
    }
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(token, {
      host:
        process.env.POSTHOG_HOST ||
        import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
        "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}
