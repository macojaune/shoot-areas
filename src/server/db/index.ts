import { drizzle } from "drizzle-orm/libsql"

import { env } from "~/env"
import * as schema from "./schemas"
import { createClient } from "@libsql/client"

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.NODE_ENV !== "production" ? undefined : env.TURSO_TOKEN,
})

export const db = drizzle(client, { schema })
