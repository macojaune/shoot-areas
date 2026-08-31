import { auth } from "@clerk/tanstack-react-start/server"
import { desc, eq, inArray, sql } from "drizzle-orm"
import { getPostHogClient } from "~/utils/posthog-server"
import { slugify } from "~/lib/utils"
import {
  getContributorProfileForUser,
  getContributorProfilesForUsers,
} from "~/server/contributor"
import { db } from "~/server/db/client"
import {
  categories,
  categoriesToPlaces,
  placeImages,
  placeReviews,
  places,
  type Category,
  type Place,
  type PlaceImage,
} from "~/server/db/schema"
import type {
  CreatePlaceInput,
  CreateSpotReviewInput,
  ListPlacesFilter,
  PlaceDetail,
  PlaceListItem,
} from "~/server/places"

async function getUniqueSlug(title: string) {
  const base = slugify(title) || "spot"
  let candidate = base
  let suffix = 2

  while (true) {
    const existing = await db
      .select({ id: places.id })
      .from(places)
      .where(eq(places.slug, candidate))
      .limit(1)

    if (existing.length === 0) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

async function hydratePlaces(rows: Place[]): Promise<PlaceListItem[]> {
  if (rows.length === 0) return []
  const placeIds = rows.map((place) => place.id)

  const [images, categoryLinks] = await Promise.all([
    db
      .select()
      .from(placeImages)
      .where(inArray(placeImages.placeId, placeIds))
      .orderBy(placeImages.sortOrder),
    db
      .select({
        placeId: categoriesToPlaces.placeId,
        category: categories,
      })
      .from(categoriesToPlaces)
      .innerJoin(categories, eq(categories.id, categoriesToPlaces.categoryId))
      .where(inArray(categoriesToPlaces.placeId, placeIds)),
  ])

  return rows.map((place) => ({
    ...place,
    images: images.filter((image) => image.placeId === place.id),
    categories: categoryLinks
      .filter((link) => link.placeId === place.id)
      .map((link) => link.category),
  }))
}

export async function listPlacesHandler(filters: ListPlacesFilter = {}) {
  const rows = await db
    .select()
    .from(places)
    .orderBy(desc(places.createdAt))
    .limit(24)

  const hydratedPlaces = await hydratePlaces(rows)

  return hydratedPlaces.filter((place) => {
    const matchesCategory =
      !filters.category ||
      place.categories.some((category) => category.slug === filters.category)
    const matchesCountry = !filters.country || place.country === filters.country
    const matchesCity = !filters.city || place.city === filters.city

    return matchesCategory && matchesCountry && matchesCity
  })
}

export async function listCategoriesHandler(): Promise<Category[]> {
  return db.select().from(categories).orderBy(categories.title)
}

export async function getPlaceBySlugHandler(data: { slug: string }) {
  const rows = await db
    .select()
    .from(places)
    .where(eq(places.slug, data.slug))
    .limit(1)

  const [place] = await hydratePlaces(rows)
  if (!place) return null

  const reviews = await db
    .select()
    .from(placeReviews)
    .where(eq(placeReviews.placeId, place.id))
    .orderBy(desc(placeReviews.createdAt))
  const contributors = await getContributorProfilesForUsers([
    place.createdByClerkId,
    ...reviews.map((review) => review.createdByClerkId),
  ])
  const creator = contributors.get(place.createdByClerkId)

  if (!creator) throw new Error("Le profil de l'éclaireur·euse est introuvable.")

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviewCount
      : null

  return {
    ...place,
    creator,
    reviews: reviews.map((review) => ({
      ...review,
      contributor: contributors.get(review.createdByClerkId) ?? creator,
    })),
    averageRating,
    reviewCount,
  } satisfies PlaceDetail
}

export async function createPlaceHandler(data: CreatePlaceInput) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour ajouter un spot.")
  }

  const contributorProfile = await getContributorProfileForUser(userId)
  const cleanImages = data.images
    .filter((image) => image.externalUrl)
    .map((image, index) => ({
      externalUrl: image.externalUrl as string,
      creditName: image.creditName?.trim() || contributorProfile.creditName,
      creditUrl: image.creditUrl || contributorProfile.creditUrl || null,
      caption: image.caption || null,
      sortOrder: index,
    }))

  const slug = await getUniqueSlug(data.title)

  const insertedPlaces = await db
    .insert(places)
    .values({
      title: data.title,
      slug,
      description: data.description,
      country: data.country,
      city: data.city,
      address: data.address || null,
      latitude: data.latitude,
      longitude: data.longitude,
      accessNotes: data.accessNotes || null,
      bestLight: data.bestLight || null,
      bestPeriod: data.bestPeriod || null,
      accessibilityLevel: data.accessibilityLevel,
      crowdLevel: data.crowdLevel,
      isPublicPlace: data.isPublicPlace,
      createdByClerkId: userId,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .returning()

  const insertedPlace = insertedPlaces[0]
  if (!insertedPlace) throw new Error("Le spot n'a pas pu être créé.")

  if (cleanImages.length > 0) {
    await db.insert(placeImages).values(
      cleanImages.map((image) => ({
        ...image,
        placeId: insertedPlace.id,
      }))
    )
  }

  if (data.categorySlugs.length > 0) {
    const selectedCategories = await db
      .select()
      .from(categories)
      .where(inArray(categories.slug, data.categorySlugs))

    if (selectedCategories.length > 0) {
      await db.insert(categoriesToPlaces).values(
        selectedCategories.map((category) => ({
          categoryId: category.id,
          placeId: insertedPlace.id,
        }))
      )
    }
  }

  const posthog = getPostHogClient()
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event: 'spot_created_server',
      properties: {
        spot_slug: insertedPlace.slug,
        spot_country: data.country,
        spot_city: data.city,
        category_count: data.categorySlugs.length,
        image_count: cleanImages.length,
        has_location: data.latitude !== null,
        accessibility_level: data.accessibilityLevel,
        crowd_level: data.crowdLevel,
        is_public_place: data.isPublicPlace,
      },
    })
    await posthog.flush()
  }

  return insertedPlace
}

export async function createSpotReviewHandler(data: CreateSpotReviewInput) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour publier un avis.")
  }

  const [place] = await db
    .select({ id: places.id })
    .from(places)
    .where(eq(places.id, data.placeId))
    .limit(1)

  if (!place) throw new Error("Ce spot n'existe plus.")

  const [existingReview] = await db
    .select({ id: placeReviews.id })
    .from(placeReviews)
    .where(
      sql`${placeReviews.placeId} = ${data.placeId} and ${placeReviews.createdByClerkId} = ${userId}`
    )
    .limit(1)

  if (existingReview) {
    throw new Error("Tu as déjà publié un avis pour ce spot.")
  }

  const [review] = await db
    .insert(placeReviews)
    .values({
      placeId: data.placeId,
      createdByClerkId: userId,
      rating: data.rating,
      content: data.content,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .returning()

  if (!review) throw new Error("L'avis n'a pas pu être publié.")

  const posthog = getPostHogClient()
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event: 'review_submitted_server',
      properties: {
        place_id: data.placeId,
        rating: data.rating,
        content_length: data.content.length,
      },
    })
    await posthog.flush()
  }

  return review
}

export async function seedCategoryIfMissing(category: {
  title: string
  slug: string
  description?: string
}) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, category.slug))
    .limit(1)

  if (existing.length > 0) return
  await db.insert(categories).values(category)
}
