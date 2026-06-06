import { auth } from "@clerk/tanstack-react-start/server"
import { desc, eq, inArray, sql } from "drizzle-orm"
import { slugify } from "~/lib/utils"
import { db } from "~/server/db/client"
import {
  categories,
  categoriesToPlaces,
  placeImages,
  places,
  type Category,
  type Place,
  type PlaceImage,
} from "~/server/db/schema"
import type { CreatePlaceInput, PlaceListItem } from "~/server/places"

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

export async function listPlacesHandler() {
  const rows = await db
    .select()
    .from(places)
    .orderBy(desc(places.createdAt))
    .limit(24)

  return hydratePlaces(rows)
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
  return place ?? null
}

export async function createPlaceHandler(data: CreatePlaceInput) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour ajouter un spot.")
  }

  const cleanImages = data.images
    .filter((image) => image.externalUrl && image.creditName)
    .map((image, index) => ({
      externalUrl: image.externalUrl as string,
      creditName: image.creditName as string,
      creditUrl: image.creditUrl || null,
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

  return insertedPlace
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
