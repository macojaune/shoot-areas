import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
  type Category,
  type Place,
  type PlaceReview,
  type PlaceReviewImage,
} from "~/server/db/schema"
import type { ContributorProfile } from "~/server/contributor"

const imageInputSchema = z.object({
  externalUrl: z.string().url("L'URL de l'image est invalide").optional().or(z.literal("")),
  creditName: z.string().trim().optional(),
  creditUrl: z.string().url("L'URL du crédit est invalide").optional().or(z.literal("")),
  caption: z.string().trim().optional(),
})

const contributionImageInputSchema = z.object({
  externalUrl: z.string().url("L'URL de l'image est invalide").optional().or(z.literal("")),
  caption: z.string().trim().max(240).optional(),
})

export const createPlaceInputSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(40),
  country: z.string().trim().min(2),
  city: z.string().trim().min(2),
  address: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  accessNotes: z.string().trim().optional(),
  bestLight: z.string().trim().optional(),
  bestPeriod: z.string().trim().optional(),
  accessibilityLevel: z.number().int().min(1).max(5),
  crowdLevel: z.number().int().min(1).max(5),
  isPublicPlace: z.boolean(),
  categorySlugs: z.array(z.string()).default([]),
  images: z.array(imageInputSchema).default([]),
})

export type CreatePlaceInput = z.infer<typeof createPlaceInputSchema>

export type SpotImage = {
  id: string
  placeId: number
  externalUrl: string
  previewUrl: string | null
  creditName: string
  creditUrl: string | null
  caption: string | null
  sortOrder: number
  contributorId: string
}

export type PlaceListItem = Place & {
  images: SpotImage[]
  categories: Category[]
}

export const listPlacesFilterSchema = z.object({
  category: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  query: z.string().trim().min(1).optional(),
  sort: z.enum(["recent", "rating", "images"]).optional(),
})

export type ListPlacesFilter = z.infer<typeof listPlacesFilterSchema>

export type PlaceReviewWithContributor = PlaceReview & {
  contributor: ContributorProfile
  images: PlaceReviewImage[]
}

export type PlaceDetail = PlaceListItem & {
  creator: ContributorProfile
  reviews: PlaceReviewWithContributor[]
  averageRating: number | null
  reviewCount: number
  isFavoritedByViewer: boolean
}

export const createSpotReviewInputSchema = z.object({
  placeId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  content: z
    .string()
    .trim()
    .min(12, "Partage au moins quelques détails utiles.")
    .max(1000, "L'avis ne peut pas dépasser 1 000 caractères."),
  accessNotes: z.string().trim().max(1000).optional(),
  bestLight: z.string().trim().max(120).optional(),
  bestPeriod: z.string().trim().max(120).optional(),
  accessibilityLevel: z.number().int().min(1).max(5).nullable(),
  crowdLevel: z.number().int().min(1).max(5).nullable(),
  isPublicPlace: z.boolean().nullable(),
  images: z.array(contributionImageInputSchema).max(8).default([]),
})

export type CreateSpotReviewInput = z.infer<typeof createSpotReviewInputSchema>

const favoriteInputSchema = z.object({
  placeId: z.number().int().positive(),
})

export type ProfileDashboard = {
  spots: PlaceListItem[]
  favorites: PlaceListItem[]
  stats: {
    spotCount: number
    favoriteCount: number
    reviewCount: number
  }
}

export const listPlaces = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => listPlacesFilterSchema.parse(input))
  .handler(async ({ data }) => {
    const { listPlacesHandler } = await import("~/server/places.server")
    return listPlacesHandler(data)
  })

export const listCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const { listCategoriesHandler } = await import("~/server/places.server")
    return listCategoriesHandler()
  }
)

export const getPlaceBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { getPlaceBySlugHandler } = await import("~/server/places.server")
    return getPlaceBySlugHandler(data)
  })

export const createPlace = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createPlaceInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPlaceHandler } = await import("~/server/places.server")
    return createPlaceHandler(data)
  })

export const createSpotReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createSpotReviewInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createSpotReviewHandler } = await import("~/server/places.server")
    return createSpotReviewHandler(data)
  })

export const togglePlaceFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => favoriteInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { togglePlaceFavoriteHandler } = await import("~/server/places.server")
    return togglePlaceFavoriteHandler(data)
  })

export const getProfileDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getProfileDashboardHandler } = await import("~/server/places.server")
    return getProfileDashboardHandler()
  }
)

export const getPublicContributorDashboard = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ userId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { getPublicContributorDashboardHandler } = await import(
      "~/server/places.server"
    )
    return getPublicContributorDashboardHandler(data)
  })
