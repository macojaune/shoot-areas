import { clerkMiddleware } from "@clerk/tanstack-react-start/server"
import { createStart } from "@tanstack/react-start"

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

export const startInstance = createStart(() => {
  return {
    requestMiddleware: isClerkServerConfigured() ? [clerkMiddleware()] : [],
  }
})
