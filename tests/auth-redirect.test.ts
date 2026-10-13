import { describe, expect, test } from "bun:test"
import { getSafeAuthRedirect, validateAuthSearch } from "../src/lib/auth-redirect"

describe("destinations après authentification", () => {
  test.each([
    "/nouveau-lieu",
    "/profil",
    "/lieux/plage?vue=photos#avis",
    "/?q=plage%20du%20bourg",
  ])("conserve la destination locale %s", (path) => {
    expect(getSafeAuthRedirect(path)).toBe(path)
  })

  test.each([
    undefined,
    null,
    42,
    "",
    "https://example.com/profil",
    "javascript:alert(1)",
    "//example.com",
    "/\\example.com",
    "/%5cexample.com",
    "/%2fexample.com",
    "/\texample.com",
    "/%0aexample.com",
    "/profil\n",
    "/%zz",
    "/sign-in",
    "/sign-in/factor-one?redirect_url=/sign-in",
    "/sign-up/verify-email-address",
    "/SIGN-IN",
    "/%73ign-in",
    "/profil/../sign-in",
  ])("refuse une destination dangereuse ou une boucle : %s", (path) => {
    expect(getSafeAuthRedirect(path)).toBe("/")
  })

  test("valide les paramètres d'une page auth sans imposer de recherche aux liens", () => {
    expect(getSafeAuthRedirect(["/profil"])).toBe("/")
    expect(validateAuthSearch({})).toEqual({})
    expect(validateAuthSearch({ redirect_url: "/profil" })).toEqual({ redirect_url: "/profil" })
    expect(validateAuthSearch({ redirect_url: "//example.com" })).toEqual({ redirect_url: "/" })
  })
})
