import { createServerFn } from "@tanstack/react-start"
import { communeSearchInputSchema } from "~/lib/communes"

// POST because a successful lookup also refreshes the official commune cache.
export const searchCommunes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => communeSearchInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { searchCommunesForUser } = await import("./communes.server")
    return searchCommunesForUser(data)
  })
