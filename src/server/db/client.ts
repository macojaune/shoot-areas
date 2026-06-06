import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"

const url = process.env.DATABASE_URL ?? "file:shootareas.db"
const authToken = process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_TOKEN

const client = createClient({
  url,
  authToken: authToken || undefined,
})

export const db = drizzle(client, { schema })
