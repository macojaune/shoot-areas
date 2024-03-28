//Shoot
import { index, int, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { places } from "~/server/db/schemas/place"
import { relations, sql } from "drizzle-orm"
import { users } from "~/server/db/schemas/auth"

export const shoots = sqliteTable(
  "shoot",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    placeId: int("placeId")
      .notNull()
      .references(() => places.id),
    userId: text("createdById")
      .notNull()
      .references(() => users.id),
    date: int("title", { mode: "timestamp" }),
    description: text("description"),
    mark: numeric("mark").default("0"),
    accessibility: numeric("accessibility").default("0"),
    traffic: numeric("traffic").default("0"),
    byNight: int("byNight", { mode: "boolean" }).default(false),
    isSpotter: int("isSpotter", { mode: "boolean" }).default(false),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: int("updatedAt", { mode: "timestamp" }),
  },
  (example) => ({
    userIdIdx: index("userId_idx").on(example.userId),
  })
)

export const shootLinks = sqliteTable("shoot_link", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  shootId: int("shootId")
    .notNull()
    .references(() => shoots.id),
  url: text("url"),
})

export const shootRelations = relations(shoots, ({ one, many }) => ({
  user: one(users, { fields: [shoots.userId], references: [users.id] }),
  place: one(places, { fields: [shoots.placeId], references: [places.id] }),
  links: many(shootLinks),
}))
export const linksRelations = relations(shootLinks, ({ one }) => ({
  shoot: one(shoots),
}))
