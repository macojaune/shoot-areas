import { z } from "zod"

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc"

import {
  categories,
  insertUserSchema,
  selectUserSchema,
  users,
} from "~/server/db/schemas"
import { eq, or } from "drizzle-orm"

export const authRouter = createTRPCRouter({
  checkEmail: publicProcedure
    .input(selectUserSchema.pick({ email: true }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      })
      if (user) {
        return user.name !== null
      }
      return false
    }),
  update: protectedProcedure
    .input(insertUserSchema.partial().required({ email: true }))
    .mutation(async ({ ctx, input }) => {
      const { email, ...rest } = input
      return ctx.db
        .update(users)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(users.email, email))
    }),
})
