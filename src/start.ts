import { clerkMiddleware } from "@clerk/tanstack-react-start/server"
import { createStart } from "@tanstack/react-start"
import { isClerkConfigured } from "~/lib/clerk"

export const startInstance = createStart(() => {
  return {
    requestMiddleware: isClerkConfigured(
      process.env.VITE_CLERK_PUBLISHABLE_KEY,
      process.env.CLERK_SECRET_KEY
    )
      ? [clerkMiddleware({ signInUrl: "/sign-in", signUpUrl: "/sign-up" })]
      : [],
  }
})
