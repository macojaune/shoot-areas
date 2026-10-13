import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { migrate } from "drizzle-orm/libsql/migrator"
import { eq } from "drizzle-orm"
import type { CreatePlaceInput, CreateSpotReviewInput } from "../../src/server/places"

// Only external identity and analytics are replaced. Handlers use the actual
// Drizzle queries, migrations, constraints and transactions against temporary SQLite.
let viewerId: string | null = "user_alice"
let clerkUnavailable = false
let clerkUserMissing = false
let analyticsFailure: "capture" | "flush" | null = null
let analyticsCaptureCalls = 0
let analyticsFlushCalls = 0
const clerkAuth = mock(async () => ({ isAuthenticated: Boolean(viewerId), userId: viewerId }))
mock.module("@clerk/tanstack-react-start/server", () => ({
  auth: clerkAuth,
  clerkClient: () => ({
    users: {
      getUser: async (id: string) => {
        if (clerkUserMissing) throw Object.assign(new Error("Clerk user not found"), { status: 404 })
        if (clerkUnavailable) throw new Error("Clerk temporarily unavailable")
        return {
          id,
          username: id.replace("user_", ""),
          firstName: null,
          lastName: null,
          imageUrl: "https://images.example/avatar.jpg",
          publicMetadata: {},
          privateMetadata: { confidential: "must not be exposed" },
          emailAddresses: [{ emailAddress: "private@example.com" }],
        }
      },
    },
  }),
}))
mock.module("../../src/utils/posthog-server", () => ({
  getPostHogClient: () => analyticsFailure ? {
    capture: () => {
      analyticsCaptureCalls += 1
      if (analyticsFailure === "capture") throw new Error("PostHog capture failed")
    },
    flush: async () => {
      analyticsFlushCalls += 1
      if (analyticsFailure === "flush") throw new Error("PostHog network failure")
    },
  } : null,
}))

const directory = await mkdtemp(join(tmpdir(), "shootareas-server-tests-"))
const previousDatabaseUrl = process.env.DATABASE_URL
const previousPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY
const previousSecretKey = process.env.CLERK_SECRET_KEY
process.env.DATABASE_URL = `file:${join(directory, "test.db")}`
process.env.VITE_CLERK_PUBLISHABLE_KEY = `pk_test_${"a".repeat(32)}`
process.env.CLERK_SECRET_KEY = `sk_test_${"a".repeat(32)}`

const { db } = await import("../../src/server/db/client")
const schema = await import("../../src/server/db/schema")
const handlers = await import("../../src/server/places.server")
const contributors = await import("../../src/server/contributor.server")
const { createPlaceInputSchema, createSpotReviewInputSchema } = await import("../../src/server/places")

function placeInput(overrides: Partial<CreatePlaceInput> = {}): CreatePlaceInput {
  return {
    title: "Repérage de recette",
    description: "Lieu fictif de recette avec un accès dégagé et une lumière douce le matin.",
    country: "Guadeloupe",
    city: "Le Gosier",
    latitude: 16.21,
    longitude: -61.49,
    accessNotes: "Accès de test",
    bestLight: "Matin",
    bestPeriod: "Semaine",
    accessibilityLevel: 3,
    crowdLevel: 2,
    isPublicPlace: true,
    categorySlugs: [],
    images: [],
    ...overrides,
  }
}

function reviewInput(placeId: number, overrides: Partial<CreateSpotReviewInput> = {}): CreateSpotReviewInput {
  return {
    placeId,
    rating: 4,
    content: "Retour fictif : le passage est accessible tôt le matin.",
    accessNotes: "Escalier glissant",
    bestLight: "Avant 9 h",
    bestPeriod: "Hors week-end",
    accessibilityLevel: 2,
    crowdLevel: 1,
    isPublicPlace: false,
    images: [],
    ...overrides,
  }
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname })
})

beforeEach(async () => {
  viewerId = "user_alice"
  clerkUnavailable = false
  clerkUserMissing = false
  analyticsFailure = null
  analyticsCaptureCalls = 0
  analyticsFlushCalls = 0
  clerkAuth.mockClear()
  process.env.VITE_CLERK_PUBLISHABLE_KEY = `pk_test_${"a".repeat(32)}`
  process.env.CLERK_SECRET_KEY = `sk_test_${"a".repeat(32)}`
  await db.$client.executeMultiple(`
    DROP TRIGGER IF EXISTS reject_place_image;
    DROP TRIGGER IF EXISTS reject_review_image;
    DELETE FROM place_review_images;
    DELETE FROM place_reviews;
    DELETE FROM place_favorites;
    DELETE FROM place_images;
    DELETE FROM categories_to_places;
    DELETE FROM places;
    DELETE FROM categories;
    DELETE FROM contributor_profiles;
  `)
})

afterAll(async () => {
  db.$client.close()
  await rm(directory, { recursive: true, force: true })
  for (const [key, value] of [
    ["DATABASE_URL", previousDatabaseUrl],
    ["VITE_CLERK_PUBLISHABLE_KEY", previousPublishableKey],
    ["CLERK_SECRET_KEY", previousSecretKey],
  ] as const) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("authentication and member isolation", () => {
  test("guests cannot publish, favorite, read a personal dashboard or update a profile", async () => {
    viewerId = null
    await expect(handlers.createPlaceHandler(placeInput())).rejects.toThrow("Connexion requise")
    await expect(handlers.createSpotReviewHandler(reviewInput(1))).rejects.toThrow("Connexion requise")
    await expect(handlers.togglePlaceFavoriteHandler({ placeId: 1 })).rejects.toThrow("Connexion requise")
    await expect(handlers.getProfileDashboardHandler()).rejects.toThrow("Connexion requise")
    await expect(contributors.getCurrentContributorProfileHandler()).rejects.toThrow("Connexion requise")
    await expect(contributors.updateCurrentContributorProfileHandler({ bio: "Intrusion", socialLinks: [] })).rejects.toThrow("Connexion requise")
    expect(await db.select().from(schema.places)).toHaveLength(0)
    expect(await db.select().from(schema.placeReviews)).toHaveLength(0)
    expect(await db.select().from(schema.placeFavorites)).toHaveLength(0)
    expect(await db.select().from(schema.contributorProfiles)).toHaveLength(0)
  })

  test("profile writes use the session identity and public data excludes Clerk private fields", async () => {
    await contributors.updateCurrentContributorProfileHandler({ bio: "Alice", socialLinks: [] })
    viewerId = "user_bob"
    await contributors.updateCurrentContributorProfileHandler({
      bio: "Bob",
      socialLinks: [{ platform: "website", url: "https://bob.example" }],
      clerkUserId: "user_alice",
    } as Parameters<typeof contributors.updateCurrentContributorProfileHandler>[0])
    const records = await db.select().from(schema.contributorProfiles)
    expect(records.find((record) => record.clerkUserId === "user_alice")?.bio).toBe("Alice")
    expect(records.find((record) => record.clerkUserId === "user_bob")?.bio).toBe("Bob")
    const publicProfile = await contributors.getContributorProfileByUserIdHandler("user_bob")
    expect(Object.keys(publicProfile).sort()).toEqual(["bio", "creditName", "creditUrl", "imageUrl", "socialLinks", "userId"])
    expect(JSON.stringify(publicProfile)).not.toContain("private@example.com")
    expect(JSON.stringify(publicProfile)).not.toContain("confidential")
  })

  test("favorites persist independently for two members and can only be removed by their owner", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    expect(await handlers.togglePlaceFavoriteHandler({ placeId: place.id })).toEqual({ isFavorite: true })
    expect((await handlers.getProfileDashboardHandler()).favorites.map((entry) => entry.id)).toEqual([place.id])
    viewerId = "user_bob"
    expect((await handlers.getProfileDashboardHandler()).favorites).toHaveLength(0)
    expect((await handlers.getProfileDashboardHandler()).spots).toHaveLength(0)
    await handlers.togglePlaceFavoriteHandler({ placeId: place.id })
    viewerId = "user_alice"
    expect(await handlers.togglePlaceFavoriteHandler({ placeId: place.id })).toEqual({ isFavorite: false })
    expect((await handlers.getProfileDashboardHandler()).favorites).toHaveLength(0)
    viewerId = "user_bob"
    expect((await handlers.getProfileDashboardHandler()).favorites.map((entry) => entry.id)).toEqual([place.id])
    viewerId = null
    await expect(handlers.togglePlaceFavoriteHandler({ placeId: place.id })).rejects.toThrow("Connexion requise")
    viewerId = "user_bob"
    expect((await handlers.getProfileDashboardHandler()).stats.favoriteCount).toBe(1)
  })

  test("a public spot remains readable without Clerk configuration and private actions stay refused", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
    clerkAuth.mockClear()
    clerkUnavailable = true
    const detail = await handlers.getPlaceBySlugHandler({ slug: place.slug })
    expect(detail?.id).toBe(place.id)
    expect(detail?.isFavoritedByViewer).toBe(false)
    expect(detail?.creator.creditName).toBe("Spoteur·euse")
    await expect(handlers.createPlaceHandler(placeInput())).rejects.toThrow("Connexion requise")
    expect(clerkAuth).not.toHaveBeenCalled()
  })

  test("public contributor profiles without Clerk require a persisted profile, place or review", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    viewerId = "user_bob"
    await handlers.createSpotReviewHandler(reviewInput(place.id))
    viewerId = "user_carol"
    await contributors.updateCurrentContributorProfileHandler({ bio: "Profil local de recette", socialLinks: [] })
    delete process.env.VITE_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY
    clerkUnavailable = true
    for (const userId of ["user_alice", "user_bob", "user_carol"]) {
      const dashboard = await handlers.getPublicContributorDashboardHandler({ userId })
      expect(dashboard?.profile.userId).toBe(userId)
      expect(dashboard?.profile.creditName).toBe("Spoteur·euse")
    }
    expect((await handlers.getPublicContributorDashboardHandler({ userId: "user_carol" }))?.profile.bio).toBe("Profil local de recette")
    expect(await handlers.getPublicContributorDashboardHandler({ userId: "user_unknown" })).toBeNull()
    expect(await contributors.getContributorProfileByUserIdHandler("user_unknown")).toBeNull()
    await expect(contributors.updateCurrentContributorProfileHandler({ bio: "Mutation refusée", socialLinks: [] })).rejects.toThrow("Connexion requise")
  })

  test("a Clerk 404 returns a missing public profile but other Clerk failures remain errors", async () => {
    await handlers.createPlaceHandler(placeInput())
    clerkUserMissing = true
    expect(await handlers.getPublicContributorDashboardHandler({ userId: "user_alice" })).toBeNull()
    expect(await contributors.getContributorProfileByUserIdHandler("user_unknown")).toBeNull()
    await expect(contributors.getCurrentContributorProfileHandler()).rejects.toThrow("Clerk user not found")
    clerkUserMissing = false
    clerkUnavailable = true
    await expect(handlers.getPublicContributorDashboardHandler({ userId: "user_alice" })).rejects.toThrow("Clerk temporarily unavailable")
  })
})

describe("complete discovery", () => {
  test("older spots remain searchable, sortable, categorized and available to the map after 24 newer entries", async () => {
    const [category] = await db.insert(schema.categories).values({ title: "Mer", slug: "mer" }).returning()
    const old = await handlers.createPlaceHandler(placeInput({ title: "Ancien phare", categorySlugs: [category!.slug] }))
    await db.update(schema.places).set({ createdAt: "2020-01-01 00:00:00" }).where(eq(schema.places.id, old.id))
    await db.insert(schema.places).values(Array.from({ length: 25 }, (_, index) => ({
      title: `Lieu récent ${index}`,
      slug: `lieu-recent-${index}`,
      description: "Un autre lieu fictif pour la recette.",
      country: "Martinique",
      city: "Fort-de-France",
      createdByClerkId: "user_bob",
      createdAt: "2026-10-01 00:00:00",
    })))
    await handlers.createSpotReviewHandler(reviewInput(old.id, {
      rating: 5,
      images: [{ externalUrl: "https://images.example/phare.jpg" }],
    }))
    const all = await handlers.listPlacesHandler()
    expect(all).toHaveLength(26)
    expect(all.filter((place) => place.latitude !== null && place.longitude !== null).map((place) => place.id)).toContain(old.id)
    for (const filters of [
      { query: "phare" },
      { country: "Guadeloupe", city: "Le Gosier" },
      { category: "mer" },
    ]) {
      expect((await handlers.listPlacesHandler(filters)).map((place) => place.id)).toEqual([old.id])
    }
    expect((await handlers.listPlacesHandler({ sort: "rating" }))[0]?.id).toBe(old.id)
    expect((await handlers.listPlacesHandler({ sort: "images" }))[0]?.id).toBe(old.id)
    expect(await handlers.listPlacesHandler({ query: "inexistant" })).toHaveLength(0)
  })
})

describe("publication integrity", () => {
  test.each(["capture", "flush"] as const)("a PostHog %s failure does not reject committed publications or hide business errors", async (failure) => {
    analyticsFailure = failure
    const place = await handlers.createPlaceHandler(placeInput())
    expect(place.id).toBeGreaterThan(0)
    expect(await db.select().from(schema.places)).toHaveLength(1)
    const review = await handlers.createSpotReviewHandler(reviewInput(place.id))
    expect(review.id).toBeGreaterThan(0)
    expect(await db.select().from(schema.placeReviews)).toHaveLength(1)
    expect(analyticsCaptureCalls).toBe(2)
    expect(analyticsFlushCalls).toBe(failure === "flush" ? 2 : 0)
    await expect(handlers.createSpotReviewHandler(reviewInput(place.id))).rejects.toThrow("déjà publié")
    await expect(handlers.createSpotReviewHandler(reviewInput(999_999))).rejects.toThrow("n'existe plus")
    expect(analyticsCaptureCalls).toBe(2)
  })

  test("invalid coordinates and invalid reviews fail input validation", () => {
    expect(createPlaceInputSchema.safeParse(placeInput({ latitude: 91 })).success).toBe(false)
    expect(createPlaceInputSchema.safeParse(placeInput({ longitude: -181 })).success).toBe(false)
    expect(createSpotReviewInputSchema.safeParse(reviewInput(1, { rating: 6 })).success).toBe(false)
    expect(createSpotReviewInputSchema.safeParse(reviewInput(1, { content: "court" })).success).toBe(false)
    expect(createSpotReviewInputSchema.safeParse(reviewInput(1, { images: [{ externalUrl: "pas une URL" }] })).success).toBe(false)
  })

  test("a review persists its field observations and author credit, then rejects duplicates", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    viewerId = "user_bob"
    const input = reviewInput(place.id, { images: [{ externalUrl: "https://images.example/review.jpg", caption: "Image fictive" }] })
    await handlers.createSpotReviewHandler(input)
    const detail = await handlers.getPlaceBySlugHandler({ slug: place.slug })
    expect(detail?.reviewCount).toBe(1)
    expect(detail?.reviews[0]).toMatchObject({
      createdByClerkId: "user_bob",
      accessNotes: input.accessNotes,
      bestLight: input.bestLight,
      bestPeriod: input.bestPeriod,
      accessibilityLevel: 2,
      crowdLevel: 1,
      isPublicPlace: false,
    })
    expect(detail?.images[0]).toMatchObject({ creditName: "@bob", contributorId: "user_bob", caption: "Image fictive" })
    await expect(handlers.createSpotReviewHandler(input)).rejects.toThrow("déjà publié")
    expect(await db.select().from(schema.placeReviews)).toHaveLength(1)
  })

  test("a Clerk lookup failure leaves no partial review and a later retry succeeds", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    viewerId = "user_bob"
    clerkUnavailable = true
    await expect(handlers.createSpotReviewHandler(reviewInput(place.id))).rejects.toThrow("Clerk temporarily unavailable")
    expect(await db.select().from(schema.placeReviews)).toHaveLength(0)
    clerkUnavailable = false
    await handlers.createSpotReviewHandler(reviewInput(place.id))
    expect(await db.select().from(schema.placeReviews)).toHaveLength(1)
  })

  test("a database image failure rolls back the entire new place and leaves its slug reusable", async () => {
    await db.$client.executeMultiple(`CREATE TRIGGER reject_place_image BEFORE INSERT ON place_images BEGIN SELECT RAISE(ABORT, 'test image write failed'); END;`)
    await expect(handlers.createPlaceHandler(placeInput({ images: [{ externalUrl: "https://images.example/rollback.jpg" }] }))).rejects.toThrow()
    expect(await db.select().from(schema.places)).toHaveLength(0)
    expect(await db.select().from(schema.placeImages)).toHaveLength(0)
    await db.$client.execute("DROP TRIGGER reject_place_image")
    expect((await handlers.createPlaceHandler(placeInput())).slug).toBe("reperage-de-recette")
  })

  test("a database image failure rolls back the entire review and permits retry", async () => {
    const place = await handlers.createPlaceHandler(placeInput())
    await db.$client.executeMultiple(`CREATE TRIGGER reject_review_image BEFORE INSERT ON place_review_images BEGIN SELECT RAISE(ABORT, 'test review image write failed'); END;`)
    const input = reviewInput(place.id, { images: [{ externalUrl: "https://images.example/rollback.jpg" }] })
    await expect(handlers.createSpotReviewHandler(input)).rejects.toThrow()
    expect(await db.select().from(schema.placeReviews)).toHaveLength(0)
    expect(await db.select().from(schema.placeReviewImages)).toHaveLength(0)
    await db.$client.execute("DROP TRIGGER reject_review_image")
    await handlers.createSpotReviewHandler(input)
    expect(await db.select().from(schema.placeReviews)).toHaveLength(1)
    expect(await db.select().from(schema.placeReviewImages)).toHaveLength(1)
  })
})
