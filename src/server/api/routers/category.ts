import { z } from "zod"

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc"

import { categories } from "~/server/db/schemas"

export const categoryRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ offset: z.number().optional().default(0) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.categories.findMany({
        limit: 4,
        offset: input.offset,
      })
    }),
  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(categories).values({
        title: input.title,
        userId: ctx.session.user.id,
      })
    }),
})
