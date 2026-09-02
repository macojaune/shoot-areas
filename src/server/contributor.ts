import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

export const socialPlatforms = ["instagram", "tiktok", "x", "facebook", "website"] as const

export const socialLinkSchema = z.object({
  platform: z.enum(socialPlatforms),
  url: z.string().trim().url("Le lien du réseau est invalide"),
})

export const contributorProfileSchema = z.object({
  bio: z.string().trim().max(320, "La présentation ne peut pas dépasser 320 caractères."),
  socialLinks: z
    .array(socialLinkSchema)
    .max(5, "Ajoute au maximum cinq liens.")
    .superRefine((links, context) => {
      const platforms = new Set<string>()
      links.forEach((link, index) => {
        if (platforms.has(link.platform)) {
          context.addIssue({
            code: "custom",
            message: "Ajoute un seul lien par réseau.",
            path: [index, "platform"],
          })
        }
        platforms.add(link.platform)
      })
    }),
})

export type SocialPlatform = (typeof socialPlatforms)[number]
export type SocialLink = z.infer<typeof socialLinkSchema>

export type ContributorProfile = {
  userId: string
  creditName: string
  creditUrl: string
  imageUrl: string | null
  bio: string
  socialLinks: SocialLink[]
}

export type ContributorUser = {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string
  publicMetadata: unknown
}

export const getCurrentContributorProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCurrentContributorProfileHandler } = await import("~/server/contributor.server")
    return getCurrentContributorProfileHandler()
  }
)

export const updateCurrentContributorProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contributorProfileSchema.parse(input))
  .handler(async ({ data }) => {
    const { updateCurrentContributorProfileHandler } = await import(
      "~/server/contributor.server"
    )
    return updateCurrentContributorProfileHandler(data)
  })

export const getContributorProfileByUserId = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { getContributorProfileByUserIdHandler } = await import(
      "~/server/contributor.server"
    )
    return getContributorProfileByUserIdHandler(data.userId)
  })
