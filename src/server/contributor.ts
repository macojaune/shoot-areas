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
  creditName: string
  creditUrl: string
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

export function contributorProfileFromUser(user: {
  username: string | null
  firstName: string | null
  lastName: string | null
  publicMetadata: unknown
}): ContributorProfile {
  const metadata = user.publicMetadata as ClerkContributorMetadata
  const profile = metadata.shootareas

  return {
    creditName:
      typeof profile?.creditName === "string" && profile.creditName.trim().length >= 2
        ? profile.creditName.trim()
        : defaultCreditName(user),
    creditUrl:
      typeof profile?.creditUrl === "string" ? profile.creditUrl.trim() : "",
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
