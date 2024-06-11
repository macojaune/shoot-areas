import { type Config } from "drizzle-kit"

import { env } from "~/env"

export default {
  schema: "./src/server/db/schemas/*.ts",
  driver: "turso",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.TURSO_TOKEN,
  },
  out: "./drizzle",
} satisfies Config
