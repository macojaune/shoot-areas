import { auth } from "@clerk/tanstack-react-start/server"
import { isClerkConfigured } from "~/lib/clerk"

export function isClerkServerConfigured() {
  return isClerkConfigured(
    process.env.VITE_CLERK_PUBLISHABLE_KEY,
    process.env.CLERK_SECRET_KEY
  )
}

/** Public reads work without Clerk; configured authentication errors still propagate. */
export async function getOptionalAuth() {
  if (!isClerkServerConfigured()) {
    return { isAuthenticated: false, userId: null } as const
  }

  const { isAuthenticated, userId } = await auth()
  return { isAuthenticated, userId: isAuthenticated ? userId : null }
}
