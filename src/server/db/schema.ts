import { relations, sql } from "drizzle-orm"
import {
  index,
  int,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const places = sqliteTable(
  "places",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    country: text("country").notNull(),
    city: text("city").notNull(),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    accessNotes: text("access_notes"),
    bestLight: text("best_light"),
    bestPeriod: text("best_period"),
    accessibilityLevel: int("accessibility_level").notNull().default(3),
    crowdLevel: int("crowd_level").notNull().default(3),
    isPublicPlace: int("is_public_place", { mode: "boolean" }).notNull().default(true),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugIdx: uniqueIndex("places_slug_idx").on(table.slug),
    cityIdx: index("places_city_idx").on(table.city),
    createdAtIdx: index("places_created_at_idx").on(table.createdAt),
  })
)

export const categories = sqliteTable(
  "categories",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
  },
  (table) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
  })
)

export const categoriesToPlaces = sqliteTable(
  "categories_to_places",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    categoryId: int("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    placeId: int("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePlaceCategory: uniqueIndex("categories_to_places_unique_idx").on(
      table.categoryId,
      table.placeId
    ),
  })
)

export const placeImages = sqliteTable(
  "place_images",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    placeId: int("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    externalUrl: text("external_url").notNull(),
    previewUrl: text("preview_url"),
    creditName: text("credit_name").notNull(),
    creditUrl: text("credit_url"),
    caption: text("caption"),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => ({
    placeIdx: index("place_images_place_idx").on(table.placeId),
  })
)

export const placeReviews = sqliteTable(
  "place_reviews",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    placeId: int("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    rating: int("rating").notNull(),
    content: text("content").notNull(),
    accessNotes: text("access_notes"),
    bestLight: text("best_light"),
    bestPeriod: text("best_period"),
    accessibilityLevel: int("accessibility_level"),
    crowdLevel: int("crowd_level"),
    isPublicPlace: int("is_public_place", { mode: "boolean" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    placeIdx: index("place_reviews_place_idx").on(table.placeId),
    uniqueUserReview: uniqueIndex("place_reviews_unique_user_idx").on(
      table.placeId,
      table.createdByClerkId
    ),
  })
)

export const placeReviewImages = sqliteTable(
  "place_review_images",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    reviewId: int("review_id")
      .notNull()
      .references(() => placeReviews.id, { onDelete: "cascade" }),
    externalUrl: text("external_url").notNull(),
    previewUrl: text("preview_url"),
    creditName: text("credit_name").notNull(),
    creditUrl: text("credit_url"),
    caption: text("caption"),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (table) => ({
    reviewIdx: index("place_review_images_review_idx").on(table.reviewId),
  })
)

export const contributorProfiles = sqliteTable(
  "contributor_profiles",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    clerkUserId: text("clerk_user_id").notNull(),
    bio: text("bio").notNull().default(""),
    socialLinks: text("social_links").notNull().default("[]"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    clerkUserIdx: uniqueIndex("contributor_profiles_clerk_user_idx").on(
      table.clerkUserId
    ),
  })
)

export const placeFavorites = sqliteTable(
  "place_favorites",
  {
    id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    placeId: int("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    placeIdx: index("place_favorites_place_idx").on(table.placeId),
    userIdx: index("place_favorites_user_idx").on(table.createdByClerkId),
    uniqueUserFavorite: uniqueIndex("place_favorites_unique_user_idx").on(
      table.placeId,
      table.createdByClerkId
    ),
  })
)

export const placesRelations = relations(places, ({ many }) => ({
  categories: many(categoriesToPlaces),
  images: many(placeImages),
  reviews: many(placeReviews),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  places: many(categoriesToPlaces),
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

export const placeImagesRelations = relations(placeImages, ({ one }) => ({
  place: one(places, {
    fields: [placeImages.placeId],
    references: [places.id],
  }),
}))

export const placeReviewsRelations = relations(placeReviews, ({ one }) => ({
  place: one(places, {
    fields: [placeReviews.placeId],
    references: [places.id],
  }),
}))

export const placeReviewImagesRelations = relations(placeReviewImages, ({ one }) => ({
  review: one(placeReviews, {
    fields: [placeReviewImages.reviewId],
    references: [placeReviews.id],
  }),
}))

export type Place = typeof places.$inferSelect
export type PlaceImage = typeof placeImages.$inferSelect
export type PlaceReview = typeof placeReviews.$inferSelect
export type PlaceReviewImage = typeof placeReviewImages.$inferSelect
export type Category = typeof categories.$inferSelect
export type ContributorProfileRecord = typeof contributorProfiles.$inferSelect
export type PlaceFavorite = typeof placeFavorites.$inferSelect
