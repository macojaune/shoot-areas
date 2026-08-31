import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const contributorProfileSchema = z.object({
  creditName: z.string().trim().min(2, "Indique le nom à afficher").max(80),
  creditUrl: z
    .string()
    .trim()
    .url("Le lien du crédit est invalide")
    .optional()
    .or(z.literal("")),
})

export type ContributorProfile = {
  userId: string
  creditName: string
  creditUrl: string
  imageUrl: string | null
}

export type ContributorUser = {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  imageUrl: string
  publicMetadata: unknown
}

type ClerkContributorMetadata = {
  shootareas?: {
    creditName?: unknown
    creditUrl?: unknown
  }
}

function defaultCreditName(user: {
  username: string | null
  firstName: string | null
  lastName: string | null
}) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
  return user.username ? `@${user.username}` : fullName || "Contributeur·ice"
}

export function contributorProfileFromUser(user: ContributorUser): ContributorProfile {
  const metadata = user.publicMetadata as ClerkContributorMetadata
  const profile = metadata.shootareas

  return {
    userId: user.id,
    creditName:
      typeof profile?.creditName === "string" && profile.creditName.trim().length >= 2
        ? profile.creditName.trim()
        : defaultCreditName(user),
    creditUrl:
      typeof profile?.creditUrl === "string" ? profile.creditUrl.trim() : "",
    imageUrl: user.imageUrl || null,
  }
}

async function currentUserId() {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour gérer le profil.")
  }
  return userId
}

export async function getContributorProfileForUser(userId: string) {
  const user = await clerkClient().users.getUser(userId)
  return contributorProfileFromUser(user)
}

export async function getContributorProfilesForUsers(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)]
  const profiles = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        return await getContributorProfileForUser(userId)
      } catch {
        return {
          userId,
          creditName: "Spoteur·euse",
          creditUrl: "",
          imageUrl: null,
        } satisfies ContributorProfile
      }
    })
  )

  return new Map(profiles.map((profile) => [profile.userId, profile]))
}

export const getCurrentContributorProfile = createServerFn({ method: "GET" }).handler(
  async () => getContributorProfileForUser(await currentUserId())
)

export const updateCurrentContributorProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contributorProfileSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await currentUserId()
    const user = await clerkClient().users.updateUserMetadata(userId, {
      publicMetadata: {
        shootareas: {
          creditName: data.creditName,
          creditUrl: data.creditUrl || null,
        },
      },
    })

    return contributorProfileFromUser(user)
  })
