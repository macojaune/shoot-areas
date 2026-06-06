import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:shootareas.db",
    authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_TOKEN,
  },
})
