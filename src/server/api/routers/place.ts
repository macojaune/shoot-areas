import { eq } from "drizzle-orm"

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
} from "~/server/db/schemas/place"

export const placeRouter = createTRPCRouter({
  byCategory: publicProcedure
    .input(selectCategorySchema.pick({ id: true }))
    .query(({ ctx, input }) => {
      return ctx.db.query.places.findMany({
        with: {
          categoriesToPlaces: {
            where: eq(categoriesToPlaces.categoryId, input.id),
          },
        },
      })
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
})
