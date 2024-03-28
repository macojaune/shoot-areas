import { z } from "zod"

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc"

import { places } from "~/server/db/schemas/place"

export const placeRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      }
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await ctx.db.insert(places).values({
        title: input.title,

        userId: ctx.session.user.id,
      })
    }),

  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.places.findFirst({
      orderBy: (places, { desc }) => [desc(places.createdAt)],
    })
  }),
})
