import { auth } from "@clerk/tanstack-react-start/server"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

function isClerkServerConfigured() {
  return (
    /^pk_(test|live)_[A-Za-z0-9_-]{20,}/.test(
      process.env.VITE_CLERK_PUBLISHABLE_KEY ?? ""
    ) &&
    /^sk_(test|live)_[A-Za-z0-9_-]{20,}/.test(
      process.env.CLERK_SECRET_KEY ?? ""
    )
  )
}

export const requireUser = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!isClerkServerConfigured()) {
      throw redirect({
        to: "/sign-in/$",
      })
    }

    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      throw redirect({
        to: "/sign-in/$",
      })
    }

    return { userId }
  }
)
