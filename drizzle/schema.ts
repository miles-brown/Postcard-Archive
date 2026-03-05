import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    openId: text("openId").notNull().unique(),
    name: text("name"),
    email: text("email"),
    loginMethod: text("loginMethod"),
    role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }), // default managed in app code
    updatedAt: integer("updatedAt", { mode: 'timestamp' }), // default managed in app code
    lastSignedIn: integer("lastSignedIn", { mode: 'timestamp' }), // default managed in app code
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Postcard listings scraped from eBay
 */
export const postcards = sqliteTable("postcards", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ebayUrl: text("ebayUrl").notNull(),
    ebayId: text("ebayId"),
    title: text("title").notNull(),
    price: text("price"),
    seller: text("seller"),
    description: text("description"),
    warPeriod: text("warPeriod", { enum: ["WWI", "WWII", "Holocaust"] }).notNull(),
    dateFound: integer("dateFound", { mode: 'timestamp' }),
    transcriptionStatus: text("transcriptionStatus", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
    isPublic: integer("isPublic", { mode: 'boolean' }).default(true).notNull(),
    uploadedBy: integer("uploadedBy"), // Populated if a user manually uploaded
    createdAt: integer("createdAt", { mode: 'timestamp' }),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }),
});

export type Postcard = typeof postcards.$inferSelect;
export type InsertPostcard = typeof postcards.$inferInsert;

/**
 * Saved postcard collections mapping users to postcards
 */
export const userCollections = sqliteTable("userCollections", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    postcardId: integer("postcardId").notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }),
});

export type UserCollection = typeof userCollections.$inferSelect;
export type InsertUserCollection = typeof userCollections.$inferInsert;

/**
 * Community transcription suggestions
 */
export const transcriptionSuggestions = sqliteTable("transcriptionSuggestions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postcardId: integer("postcardId").notNull(),
    userId: integer("userId").notNull(),
    suggestedText: text("suggestedText").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }),
});

export type TranscriptionSuggestion = typeof transcriptionSuggestions.$inferSelect;
export type InsertTranscriptionSuggestion = typeof transcriptionSuggestions.$inferInsert;

/**
 * Images associated with postcards (stored in S3)
 */
export const postcardImages = sqliteTable("postcardImages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postcardId: integer("postcardId").notNull(),
    s3Key: text("s3Key").notNull(),
    s3Url: text("s3Url").notNull(),
    originalUrl: text("originalUrl"),
    isPrimary: integer("isPrimary", { mode: 'boolean' }).default(false).notNull(),
    width: integer("width"),
    height: integer("height"),
    createdAt: integer("createdAt", { mode: 'timestamp' }),
});

export type PostcardImage = typeof postcardImages.$inferSelect;
export type InsertPostcardImage = typeof postcardImages.$inferInsert;

/**
 * OCR transcriptions of handwritten text from postcard images
 */
export const transcriptions = sqliteTable("transcriptions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postcardId: integer("postcardId").notNull(),
    imageId: integer("imageId"),
    transcribedText: text("transcribedText").notNull(),
    confidence: text("confidence"),
    language: text("language"),
    createdAt: integer("createdAt", { mode: 'timestamp' }),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }),
});

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;

/**
 * Scraping activity logs for monitoring
 */
export const scrapingLogs = sqliteTable("scrapingLogs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    status: text("status", { enum: ["started", "completed", "failed"] }).notNull(),
    searchQuery: text("searchQuery"),
    itemsFound: integer("itemsFound").default(0),
    itemsAdded: integer("itemsAdded").default(0),
    errorMessage: text("errorMessage"),
    startedAt: integer("startedAt", { mode: 'timestamp' }),
    completedAt: integer("completedAt", { mode: 'timestamp' }),
});

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type InsertScrapingLog = typeof scrapingLogs.$inferInsert;
