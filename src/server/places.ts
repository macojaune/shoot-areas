import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
  type Category,
  type Place,
  type PlaceImage,
} from "~/server/db/schema"

const imageInputSchema = z.object({
  externalUrl: z.string().url("L'URL de l'image est invalide").optional().or(z.literal("")),
  creditName: z.string().trim().optional(),
  creditUrl: z.string().url("L'URL du crédit est invalide").optional().or(z.literal("")),
  caption: z.string().trim().optional(),
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

export type PlaceListItem = Place & {
  images: PlaceImage[]
  categories: Category[]
}

export const listPlaces = createServerFn({ method: "GET" }).handler(async () => {
  const { listPlacesHandler } = await import("~/server/places.server")
  return listPlacesHandler()
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
