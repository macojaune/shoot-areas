import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getSafeAuthRedirect } from "~/lib/auth-redirect"

export const getAuthState = createServerFn({ method: "GET" }).handler(async () => {
  const { getOptionalAuth, isClerkServerConfigured } = await import("./auth.server")
  const { userId } = await getOptionalAuth()
  return { configured: isClerkServerConfigured(), userId }
})

export const requireUser = createServerFn({ method: "GET" })
  .inputValidator((input: { returnTo?: string }) => ({
    returnTo: getSafeAuthRedirect(input?.returnTo),
  }))
  .handler(async ({ data }) => {
    const { getOptionalAuth } = await import("./auth.server")
    const { isAuthenticated, userId } = await getOptionalAuth()

    if (!isAuthenticated || !userId) {
      throw redirect({
        to: "/sign-in/$",
        params: { _splat: "" },
        search: { redirect_url: data.returnTo },
      })
    }

    return { userId }
  })
