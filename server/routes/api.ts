import { Router } from "express";
import { getDb } from "../db";
import { postcards, postcardImages, transcriptions } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

const apiRouter = Router();

// Retrieve a paginated list of postcards
apiRouter.get("/postcards", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database not available" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const cards = await db.query.postcards.findMany({
      limit,
      offset,
      orderBy: [desc(postcards.dateFound)],
      where: eq(postcards.isPublic, true),
      with: {
        images: true,
        transcriptions: true,
      },
    });

    const totalCountQuery = await db
      .select({ count: sql<number>\`count(*)\` })
      .from(postcards)
      .where(eq(postcards.isPublic, true));
      
    const totalCount = totalCountQuery[0].count;

    res.json({
      data: cards,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("API Error capturing postcards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Retrieve a single postcard by ID
apiRouter.get("/postcards/:id", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database not available" });

    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ID parameter" });

    const card = await db.query.postcards.findFirst({
      where: eq(postcards.id, id),
      with: {
        images: true,
        transcriptions: true,
      },
    });

    if (!card || !card.isPublic) {
      return res.status(404).json({ error: "Postcard not found" });
    }

    res.json({ data: card });
  } catch (error) {
    console.error("API Error capturing postcard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export { apiRouter };
