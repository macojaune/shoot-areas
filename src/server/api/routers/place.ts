import { eq, sql } from "drizzle-orm"

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc"
import {
  places,
  selectCategorySchema,
  insertPlaceSchema,
  categoriesToPlaces,
  categories,
  selectPlaceSchema,
  cities,
  countries,
} from "~/server/db/schemas/place"
import slugify from "slugify"

export const placeRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findMany()
  }),
  bySlug: publicProcedure
    .input(selectPlaceSchema.pick({ slug: true }))
    .query(({ ctx, input }) => {
      return ctx.db.query.places.findFirst({
        where: eq(places.slug, input.slug),
        with: {
          categories: { with: { category: true } },
          country: true,
          city: true,
          user: true,
        },
      })
    }),
  byCategory: publicProcedure
    .input(selectCategorySchema.pick({ slug: true }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(places)
        .leftJoin(categoriesToPlaces, eq(categoriesToPlaces.placeId, places.id))
        .leftJoin(categories, eq(categories.id, categoriesToPlaces.categoryId))
        .innerJoin(cities, eq(cities.id, places.cityId))
        .innerJoin(countries, eq(countries.id, places.countryId))
        .where(eq(categories.slug, input.slug))
    }),
  create: protectedProcedure
    .input(
      insertPlaceSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        userId: true,
        position: true, //todo
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(places).values({
        ...input,
        slug: slugify(input.title, { lower: true, locale: "fr", strict: true }),
        userId: ctx.session.user.id,
      })
    }),
  getRecent: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findMany({
      orderBy: (place, { desc }) => [desc(place.createdAt)],
      with: { country: true, city: true },
      limit: 4,
    })
  }),
  getRandom: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findFirst({
      with: { country: true, city: true },
      orderBy: sql`RANDOM()`,
    })
  }),
})
