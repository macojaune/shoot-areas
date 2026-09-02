import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import { inArray, sql } from "drizzle-orm"
import { z } from "zod"
import {
  type ContributorProfile,
  type ContributorUser,
  type SocialLink,
  socialLinkSchema,
} from "~/server/contributor"
import { db } from "~/server/db/client"
import { contributorProfiles, type ContributorProfileRecord } from "~/server/db/schema"

type LegacyContributorMetadata = {
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
  return user.username ? `@${user.username}` : fullName || "Spoteur·euse"
}

function parseSocialLinks(value: string | null | undefined): SocialLink[] {
  if (!value) return []

  try {
    return z.array(socialLinkSchema).parse(JSON.parse(value))
  } catch {
    return []
  }
}

function contributorProfileFromUser(
  user: ContributorUser,
  record?: ContributorProfileRecord
): ContributorProfile {
  const legacy = (user.publicMetadata as LegacyContributorMetadata).shootareas
  const socialLinks = parseSocialLinks(record?.socialLinks)
  const legacyCreditUrl =
    typeof legacy?.creditUrl === "string" ? legacy.creditUrl.trim() : ""

  return {
    userId: user.id,
    creditName:
      typeof legacy?.creditName === "string" && legacy.creditName.trim().length >= 2
        ? legacy.creditName.trim()
        : defaultCreditName(user),
    creditUrl: socialLinks[0]?.url || legacyCreditUrl,
    imageUrl: user.imageUrl || null,
    bio: record?.bio || "",
    socialLinks,
  }
}

async function currentUserId() {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour gérer le profil.")
  }
  return userId
}

async function getProfileRecords(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, ContributorProfileRecord>()

  const records = await db
    .select()
    .from(contributorProfiles)
    .where(inArray(contributorProfiles.clerkUserId, userIds))

  return new Map(records.map((record) => [record.clerkUserId, record]))
}

export async function getContributorProfileForUser(userId: string) {
  const [user, records] = await Promise.all([
    clerkClient().users.getUser(userId),
    getProfileRecords([userId]),
  ])

  return contributorProfileFromUser(user, records.get(userId))
}

export async function getContributorProfilesForUsers(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)]
  const records = await getProfileRecords(uniqueUserIds)
  const profiles = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const user = await clerkClient().users.getUser(userId)
        return contributorProfileFromUser(user, records.get(userId))
      } catch {
        const record = records.get(userId)
        return {
          userId,
          creditName: "Spoteur·euse",
          creditUrl: parseSocialLinks(record?.socialLinks)[0]?.url || "",
          imageUrl: null,
          bio: record?.bio || "",
          socialLinks: parseSocialLinks(record?.socialLinks),
        } satisfies ContributorProfile
      }
    })
  )

  return new Map(profiles.map((profile) => [profile.userId, profile]))
}

export async function getCurrentContributorProfileHandler() {
  return getContributorProfileForUser(await currentUserId())
}

export async function updateCurrentContributorProfileHandler(data: {
  bio: string
  socialLinks: SocialLink[]
}) {
  const userId = await currentUserId()
  const socialLinks = data.socialLinks.map((link) => ({
    platform: link.platform,
    url: link.url.trim(),
  }))

  await db
    .insert(contributorProfiles)
    .values({
      clerkUserId: userId,
      bio: data.bio,
      socialLinks: JSON.stringify(socialLinks),
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: contributorProfiles.clerkUserId,
      set: {
        bio: data.bio,
        socialLinks: JSON.stringify(socialLinks),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })

  return getContributorProfileForUser(userId)
}

export async function getContributorProfileByUserIdHandler(userId: string) {
  return getContributorProfileForUser(userId)
}
