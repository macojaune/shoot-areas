import { describe, expect, test } from "bun:test"
import { validateContributorProfile } from "../src/server/contributor"

describe("profile validation messages", () => {
  test.each([
    {
      name: "duplicate social network",
      input: {
        bio: "Ma présentation",
        socialLinks: [
          { platform: "instagram", url: "https://instagram.com/alice" },
          { platform: "instagram", url: "https://instagram.com/bob" },
        ],
      },
      message: "Ajoute un seul lien par réseau.",
    },
    {
      name: "invalid URL",
      input: { bio: "", socialLinks: [{ platform: "website", url: "pas-un-lien" }] },
      message: "Le lien du réseau est invalide",
    },
    {
      name: "overlong presentation",
      input: { bio: "a".repeat(321), socialLinks: [] },
      message: "La présentation ne peut pas dépasser 320 caractères.",
    },
  ])("$name returns only its readable message and preserves the draft", ({ input, message }) => {
    const draft = structuredClone(input)
    let failure: unknown
    try {
      validateContributorProfile(input)
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(Error)
    // A substring assertion would also accept the raw Zod JSON shown by the bug.
    expect((failure as Error).message).toBe(message)
    expect(input).toEqual(draft)
  })

  test("valid profiles still trim their fields and retain distinct networks", () => {
    expect(validateContributorProfile({
      bio: "  Ma présentation  ",
      socialLinks: [
        { platform: "instagram", url: "  https://instagram.com/alice  " },
        { platform: "website", url: "https://alice.example" },
      ],
    })).toEqual({
      bio: "Ma présentation",
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/alice" },
        { platform: "website", url: "https://alice.example" },
      ],
    })
  })
})
