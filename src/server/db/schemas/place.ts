import { InferInsertModel, InferSelectModel, relations, sql } from "drizzle-orm"
import { index, int, numeric, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { users } from "~/server/db/schemas/auth"
import { shoots } from "~/server/db/schemas/shoot"
import { InferResultType } from "~/server/db/types"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
// export const createTable = sqliteTableCreator((name) => `shootareas_${name}`);

//Place
export const places = sqliteTable(
  "place",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    userId: text("createdById")
      .notNull()
      .references(() => users.id),
    position: text("position", { mode: "json" }).$type<[number, number]>(),
    country: text("country"),
    address: text("address"),
    zipcode: text("zipcode"),
    city: text("city"),
    description: text("description"),
    isPublic: int("isPublic", { mode: "boolean" }),
    //average of all shoots
    mark: numeric("mark").default("0"),
    accessibility: numeric("accessibility").default("0"),
    traffic: numeric("traffic").default("0"),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: int("updatedAt", { mode: "timestamp" }),
  },
  (example) => ({
    userIdIdx: index("userId_idx").on(example.userId),
    titleIndex: index("title_idx").on(example.title),
  })
)
export const categories = sqliteTable("category", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
})
export const categoriesToPlaces = sqliteTable("category_to_place", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  categoryId: int("categoryId")
    .notNull()
    .references(() => categories.id),
  placeId: int("placeId")
    .notNull()
    .references(() => places.id),
})
export const categoriesRelations = relations(categories, ({ many }) => ({
  categoriesToPlaces: many(categoriesToPlaces),
}))
export const placesRelations = relations(places, ({ one, many }) => ({
  user: one(users, { fields: [places.userId], references: [users.id] }),
  shoots: many(shoots),
  categories: many(categoriesToPlaces),
}))
export const categoriesToPlacesRelations = relations(
  categoriesToPlaces,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoriesToPlaces.categoryId],
      references: [categories.id],
    }),
    place: one(places, {
      fields: [categoriesToPlaces.placeId],
      references: [places.id],
    }),
  })
)

export type Place = InferResultType<"places", { user: true; categories: true }>
export const selectPlaceSchema = createSelectSchema(places)
export const insertPlaceSchema = createInsertSchema(places)

export type Category = InferResultType<"categories">
export const selectCategorySchema = createSelectSchema(categories)
