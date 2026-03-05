import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Postcard listings scraped from eBay
 */
export const postcards = mysqlTable("postcards", {
  id: int("id").autoincrement().primaryKey(),
  ebayUrl: text("ebayUrl").notNull(),
  ebayId: varchar("ebayId", { length: 255 }),
  title: text("title").notNull(),
  price: varchar("price", { length: 50 }),
  seller: varchar("seller", { length: 255 }),
  description: text("description"),
  warPeriod: mysqlEnum("warPeriod", ["WWI", "WWII", "Holocaust"]).notNull(),
  dateFound: timestamp("dateFound").defaultNow().notNull(),
  transcriptionStatus: mysqlEnum("transcriptionStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  uploadedBy: int("uploadedBy"), // Populated if a user manually uploaded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ebayIdIdx: index("ebayId_idx").on(table.ebayId),
  warPeriodIdx: index("warPeriod_idx").on(table.warPeriod),
  transcriptionStatusIdx: index("transcriptionStatus_idx").on(table.transcriptionStatus),
}));

export type Postcard = typeof postcards.$inferSelect;
export type InsertPostcard = typeof postcards.$inferInsert;

/**
 * Saved postcard collections mapping users to postcards
 */
export const userCollections = mysqlTable("userCollections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postcardId: int("postcardId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  postcardIdIdx: index("postcardId_idx").on(table.postcardId),
}));

export type UserCollection = typeof userCollections.$inferSelect;
export type InsertUserCollection = typeof userCollections.$inferInsert;

/**
 * Community transcription suggestions
 */
export const transcriptionSuggestions = mysqlTable("transcriptionSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  postcardId: int("postcardId").notNull(),
  userId: int("userId").notNull(),
  suggestedText: text("suggestedText").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postcardIdIdx: index("postcardId_idx").on(table.postcardId),
  statusIdx: index("status_idx").on(table.status),
}));

export type TranscriptionSuggestion = typeof transcriptionSuggestions.$inferSelect;
export type InsertTranscriptionSuggestion = typeof transcriptionSuggestions.$inferInsert;

/**
 * Images associated with postcards (stored in S3)
 */
export const postcardImages = mysqlTable("postcardImages", {
  id: int("id").autoincrement().primaryKey(),
  postcardId: int("postcardId").notNull(),
  s3Key: text("s3Key").notNull(),
  s3Url: text("s3Url").notNull(),
  originalUrl: text("originalUrl"),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  width: int("width"),
  height: int("height"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postcardIdIdx: index("postcardId_idx").on(table.postcardId),
}));

export type PostcardImage = typeof postcardImages.$inferSelect;
export type InsertPostcardImage = typeof postcardImages.$inferInsert;

/**
 * OCR transcriptions of handwritten text from postcard images
 */
export const transcriptions = mysqlTable("transcriptions", {
  id: int("id").autoincrement().primaryKey(),
  postcardId: int("postcardId").notNull(),
  imageId: int("imageId"),
  transcribedText: text("transcribedText").notNull(),
  confidence: varchar("confidence", { length: 50 }),
  language: varchar("language", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  postcardIdIdx: index("postcardId_idx").on(table.postcardId),
}));

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;

/**
 * Scraping activity logs for monitoring
 */
export const scrapingLogs = mysqlTable("scrapingLogs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["started", "completed", "failed"]).notNull(),
  searchQuery: text("searchQuery"),
  itemsFound: int("itemsFound").default(0),
  itemsAdded: int("itemsAdded").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  startedAtIdx: index("startedAt_idx").on(table.startedAt),
}));

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type InsertScrapingLog = typeof scrapingLogs.$inferInsert;
