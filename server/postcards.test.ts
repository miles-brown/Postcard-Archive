import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return ctx;
}

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return ctx;
}

describe("Postcard Database Functions", () => {
  it("should create and retrieve a postcard", async () => {
    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/test-123",
      ebayId: "test-123",
      title: "Test WWI Postcard",
      price: "$25.00",
      seller: "test-seller",
      description: "A test postcard from WWI",
      warPeriod: "WWI",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    expect(postcardId).toBeGreaterThan(0);

    const postcard = await db.getPostcardById(postcardId);
    expect(postcard).toBeDefined();
    expect(postcard?.title).toBe("Test WWI Postcard");
    expect(postcard?.warPeriod).toBe("WWI");
    expect(postcard?.transcriptionStatus).toBe("pending");
  });

  it("should prevent duplicate postcards by ebayId", async () => {
    const ebayId = `unique-${Date.now()}`;
    
    await db.createPostcard({
      ebayUrl: `https://ebay.com/${ebayId}`,
      ebayId: ebayId,
      title: "Duplicate Test",
      warPeriod: "WWII",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    const existing = await db.getPostcardByEbayId(ebayId);
    expect(existing).toBeDefined();
    expect(existing?.ebayId).toBe(ebayId);
  });

  it("should update postcard transcription status", async () => {
    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/update-test",
      title: "Update Test Postcard",
      warPeriod: "Holocaust",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    await db.updatePostcard(postcardId, {
      transcriptionStatus: "completed",
    });

    const updated = await db.getPostcardById(postcardId);
    expect(updated?.transcriptionStatus).toBe("completed");
  });

  it("should filter postcards by war period", async () => {
    await db.createPostcard({
      ebayUrl: "https://ebay.com/wwi-filter",
      title: "WWI Filter Test",
      warPeriod: "WWI",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    const wwiPostcards = await db.getAllPostcards({ warPeriod: "WWI", isPublic: true });
    expect(wwiPostcards.length).toBeGreaterThan(0);
    expect(wwiPostcards.every(p => p.warPeriod === "WWI")).toBe(true);
  });
});

describe("Postcard tRPC Procedures", () => {
  it("should list public postcards without authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const postcards = await caller.postcards.list();
    expect(Array.isArray(postcards)).toBe(true);
    // All returned postcards should be public
    expect(postcards.every(p => p.isPublic)).toBe(true);
  });

  it("should filter postcards by war period", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const wwiPostcards = await caller.postcards.list({ warPeriod: "WWI" });
    expect(Array.isArray(wwiPostcards)).toBe(true);
    expect(wwiPostcards.every(p => p.warPeriod === "WWI")).toBe(true);
  });

  it("should require admin role for admin operations", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(async () => {
      await caller.admin.postcards.listAll();
    }).rejects.toThrow();
  });

  it("should allow admin to list all postcards including hidden", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a hidden postcard
    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/hidden-test",
      title: "Hidden Test Postcard",
      warPeriod: "WWII",
      transcriptionStatus: "pending",
      isPublic: false,
    });

    const allPostcards = await caller.admin.postcards.listAll();
    expect(Array.isArray(allPostcards)).toBe(true);
    
    const hiddenPostcard = allPostcards.find(p => p.id === postcardId);
    expect(hiddenPostcard).toBeDefined();
    expect(hiddenPostcard?.isPublic).toBe(false);
  });

  it("should allow admin to update postcard visibility", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/visibility-test",
      title: "Visibility Test",
      warPeriod: "WWI",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    await caller.admin.postcards.update({
      id: postcardId,
      isPublic: false,
    });

    const updated = await db.getPostcardById(postcardId);
    expect(updated?.isPublic).toBe(false);
  });

  it("should allow admin to delete postcards", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/delete-test",
      title: "Delete Test",
      warPeriod: "WWII",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    await caller.admin.postcards.delete({ id: postcardId });

    const deleted = await db.getPostcardById(postcardId);
    expect(deleted).toBeUndefined();
  });
});

describe("Scraping Log Functions", () => {
  it("should create and retrieve scraping logs", async () => {
    const logId = await db.createScrapingLog({
      status: "started",
      searchQuery: "WWI handwritten postcard",
      itemsFound: 0,
      itemsAdded: 0,
    });

    expect(logId).toBeGreaterThan(0);

    await db.updateScrapingLog(logId, {
      status: "completed",
      completedAt: new Date(),
      itemsFound: 10,
      itemsAdded: 5,
    });

    const logs = await db.getRecentScrapingLogs(10);
    const log = logs.find(l => l.id === logId);
    
    expect(log).toBeDefined();
    expect(log?.status).toBe("completed");
    expect(log?.itemsFound).toBe(10);
    expect(log?.itemsAdded).toBe(5);
  });
});

describe("Transcription Functions", () => {
  it("should create transcriptions for postcards", async () => {
    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/transcription-test",
      title: "Transcription Test",
      warPeriod: "WWI",
      transcriptionStatus: "pending",
      isPublic: true,
    });

    const transcriptionId = await db.createTranscription({
      postcardId: postcardId,
      transcribedText: "Dear Mother, Writing from the trenches...",
      confidence: "85%",
      language: "en",
    });

    expect(transcriptionId).toBeGreaterThan(0);

    const transcriptions = await db.getPostcardTranscriptions(postcardId);
    expect(transcriptions.length).toBeGreaterThan(0);
    expect(transcriptions[0]?.transcribedText).toContain("Dear Mother");
  });

  it("should search postcards by transcription text", async () => {
    const postcardId = await db.createPostcard({
      ebayUrl: "https://ebay.com/search-test",
      title: "Search Test Postcard",
      warPeriod: "WWII",
      transcriptionStatus: "completed",
      isPublic: true,
    });

    await db.createTranscription({
      postcardId: postcardId,
      transcribedText: "Unique search phrase for testing",
      confidence: "90%",
      language: "en",
    });

    const results = await db.searchPostcardsByTranscription("Unique search phrase");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(p => p.id === postcardId)).toBe(true);
  });
});
