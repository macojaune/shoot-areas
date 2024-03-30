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
} from "~/server/db/schemas/place"

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
        .where(eq(categories.slug, input.slug))
    }),
  create: protectedProcedure
    .input(insertPlaceSchema.omit({ id: true }))
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(places).values({
        title: input.title,
        userId: ctx.session.user.id,
      })
    }),
  getRecent: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findMany({
      orderBy: (place, { desc }) => [desc(place.createdAt)],
      limit: 4,
    })
  }),
  getRandom: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findFirst({
      orderBy: sql`RANDOM()`,
    })
  }),
})
