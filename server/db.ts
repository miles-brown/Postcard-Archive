import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  postcards, 
  InsertPostcard, 
  postcardImages, 
  InsertPostcardImage, 
  transcriptions, 
  InsertTranscription, 
  scrapingLogs, 
  InsertScrapingLog 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= User Functions =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Postcard Functions =============

export async function createPostcard(postcard: InsertPostcard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(postcards).values(postcard);
  return result[0].insertId;
}

export async function getPostcardByEbayId(ebayId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(postcards).where(eq(postcards.ebayId, ebayId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPostcards(filters?: {
  warPeriod?: string;
  searchQuery?: string;
  isPublic?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(postcards);
  
  const conditions = [];
  
  if (filters?.isPublic !== undefined) {
    conditions.push(eq(postcards.isPublic, filters.isPublic));
  }
  
  if (filters?.warPeriod) {
    conditions.push(eq(postcards.warPeriod, filters.warPeriod as any));
  }
  
  if (filters?.searchQuery) {
    conditions.push(
      or(
        like(postcards.title, `%${filters.searchQuery}%`),
        like(postcards.description, `%${filters.searchQuery}%`)
      )
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(postcards.dateFound));
}

export async function getPostcardById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(postcards).where(eq(postcards.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePostcard(id: number, updates: Partial<InsertPostcard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(postcards).set(updates).where(eq(postcards.id, id));
}

export async function deletePostcard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(postcards).where(eq(postcards.id, id));
}

// ============= Postcard Image Functions =============

export async function createPostcardImage(image: InsertPostcardImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(postcardImages).values(image);
  return result[0].insertId;
}

export async function getPostcardImages(postcardId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(postcardImages).where(eq(postcardImages.postcardId, postcardId));
}

export async function getPrimaryImage(postcardId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(postcardImages)
    .where(and(eq(postcardImages.postcardId, postcardId), eq(postcardImages.isPrimary, true)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// ============= Transcription Functions =============

export async function createTranscription(transcription: InsertTranscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transcriptions).values(transcription);
  return result[0].insertId;
}

export async function getPostcardTranscriptions(postcardId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transcriptions).where(eq(transcriptions.postcardId, postcardId));
}

export async function searchPostcardsByTranscription(searchQuery: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Join postcards with transcriptions and search in transcribed text
  const result = await db
    .select({
      postcard: postcards,
      transcription: transcriptions,
    })
    .from(postcards)
    .innerJoin(transcriptions, eq(postcards.id, transcriptions.postcardId))
    .where(
      and(
        eq(postcards.isPublic, true),
        like(transcriptions.transcribedText, `%${searchQuery}%`)
      )
    )
    .orderBy(desc(postcards.dateFound));
  
  // Return unique postcards
  const uniquePostcards = new Map();
  result.forEach(({ postcard }) => {
    if (!uniquePostcards.has(postcard.id)) {
      uniquePostcards.set(postcard.id, postcard);
    }
  });
  
  return Array.from(uniquePostcards.values());
}

// ============= Scraping Log Functions =============

export async function createScrapingLog(log: InsertScrapingLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scrapingLogs).values(log);
  return result[0].insertId;
}

export async function updateScrapingLog(id: number, updates: Partial<InsertScrapingLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(scrapingLogs).set(updates).where(eq(scrapingLogs.id, id));
}

export async function getRecentScrapingLogs(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scrapingLogs).orderBy(desc(scrapingLogs.startedAt)).limit(limit);
}

export async function getPostcardsNeedingTranscription() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(postcards)
    .where(eq(postcards.transcriptionStatus, "pending"))
    .orderBy(postcards.dateFound)
    .limit(10);
}
