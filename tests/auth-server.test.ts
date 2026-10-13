import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"

const clerkAuth = mock(async (): Promise<{ isAuthenticated: boolean; userId: string | null }> => ({
  isAuthenticated: true,
  userId: "user_fixture",
}))

mock.module("@clerk/tanstack-react-start/server", () => ({ auth: clerkAuth }))

const { getOptionalAuth, isClerkServerConfigured } = await import("../src/server/auth.server")
const originalPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
const originalSecretKey = process.env.CLERK_SECRET_KEY

beforeEach(() => {
  process.env.VITE_CLERK_PUBLISHABLE_KEY = `pk_test_${"fixture".repeat(4)}`
  process.env.CLERK_SECRET_KEY = `sk_test_${"fixture".repeat(4)}`
  clerkAuth.mockClear()
  clerkAuth.mockImplementation(async () => ({ isAuthenticated: true, userId: "user_fixture" }))
})

afterEach(() => {
  if (originalPublishableKey === undefined) delete process.env.VITE_CLERK_PUBLISHABLE_KEY
  else process.env.VITE_CLERK_PUBLISHABLE_KEY = originalPublishableKey
  if (originalSecretKey === undefined) delete process.env.CLERK_SECRET_KEY
  else process.env.CLERK_SECRET_KEY = originalSecretKey
})

describe("authentification serveur facultative", () => {
  test("les pages publiques restent accessibles sans configuration Clerk", async () => {
    delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
    expect(isClerkServerConfigured()).toBe(false)
    expect(await getOptionalAuth()).toEqual({ isAuthenticated: false, userId: null })
    expect(clerkAuth).not.toHaveBeenCalled()
  })

  test.each(["VITE_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"])(
    "une configuration partielle (%s absent) ne donne jamais accès à un compte",
    async (key) => {
      delete process.env[key]
      expect(await getOptionalAuth()).toEqual({ isAuthenticated: false, userId: null })
      expect(clerkAuth).not.toHaveBeenCalled()
    }
  )

  test("la session réelle du SDK détermine l'identité", async () => {
    expect(await getOptionalAuth()).toEqual({ isAuthenticated: true, userId: "user_fixture" })
    expect(clerkAuth).toHaveBeenCalledTimes(1)
  })

  test("une session non authentifiée ne conserve pas d'identifiant", async () => {
    clerkAuth.mockImplementation(async () => ({ isAuthenticated: false, userId: "user_pending" }))
    expect(await getOptionalAuth()).toEqual({ isAuthenticated: false, userId: null })
  })

  test("une erreur d'authentification configurée n'est jamais masquée par un accès invité", async () => {
    clerkAuth.mockImplementation(async () => { throw new Error("fixture: verification unavailable") })
    await expect(getOptionalAuth()).rejects.toThrow("fixture: verification unavailable")
  })
})
