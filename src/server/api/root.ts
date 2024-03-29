import { placeRouter } from "~/server/api/routers/place"
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc"
import { categoryRouter } from "~/server/api/routers/category"

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  place: placeRouter,
  category: categoryRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
