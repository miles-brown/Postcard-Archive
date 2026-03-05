import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { scrapeEbayPostcards } from "./scraperService";
import { processTranscriptions, transcribePostcardById } from "./transcriptionService";
import { userCollections, transcriptionSuggestions, postcards } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    loginLocalAdmin: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (input.username !== 'admin' || input.password !== 'admin.123') {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        // Ensure the admin user exists in the DB
        await db.upsertUser({
          openId: 'local-admin',
          name: 'Administrator',
          email: 'admin@postcard-archive.com',
          loginMethod: 'local',
          lastSignedIn: new Date(),
          role: 'admin'
        });

        // Set the JWT session token
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken('local-admin', { name: "Administrator" });

        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

        return { success: true };
      })
  }),

  users: router({
    getSavedCollections: protectedProcedure.query(async ({ ctx }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No DB' });

      const collections = await dbInstance
        .select({
          postcard: postcards
        })
        .from(userCollections)
        .innerJoin(postcards, eq(userCollections.postcardId, postcards.id))
        .where(eq(userCollections.userId, ctx.user.id));

      const postcardsWithImages = await Promise.all(
        collections.map(async ({ postcard }) => {
          const primaryImage = await db.getPrimaryImage(postcard.id);
          return {
            ...postcard,
            primaryImage
          };
        })
      );

      return postcardsWithImages;
    }),

    isPostcardSaved: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return false;
        const res = await dbInstance.select()
          .from(userCollections)
          .where(
            and(
              eq(userCollections.userId, ctx.user.id),
              eq(userCollections.postcardId, input)
            )
          ).limit(1);
        return res.length > 0;
      }),

    toggleSavePostcard: protectedProcedure
      .input(z.object({ postcardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No DB' });

        const existing = await dbInstance.select().from(userCollections).where(
          and(
            eq(userCollections.userId, ctx.user.id),
            eq(userCollections.postcardId, input.postcardId)
          )
        ).limit(1);

        if (existing.length > 0) {
          // Unsave
          await dbInstance.delete(userCollections).where(
            and(
              eq(userCollections.userId, ctx.user.id),
              eq(userCollections.postcardId, input.postcardId)
            )
          );
          return { saved: false };
        } else {
          // Save
          await dbInstance.insert(userCollections).values({
            userId: ctx.user.id,
            postcardId: input.postcardId
          });
          return { saved: true };
        }
      }),

    submitTranscriptionSuggestion: protectedProcedure
      .input(z.object({ postcardId: z.number(), suggestedText: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No DB' });

        await dbInstance.insert(transcriptionSuggestions).values({
          userId: ctx.user.id,
          postcardId: input.postcardId,
          suggestedText: input.suggestedText,
          status: "pending"
        });

        return { success: true };
      }),

    uploadPostcard: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string(),
        warPeriod: z.enum(["WWI", "WWII", "Holocaust"]),
        frontImageBase64: z.string(),
        backImageBase64: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No DB' });

        // Storage Proxy import
        const { storagePut } = await import("./storage");

        const uploadImage = async (base64: string, prefix: string) => {
          const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
          const extension = base64.substring("data:image/".length, base64.indexOf(";base64"));
          const relKey = `postcards/uploads/${Date.now()}_${prefix}.${extension || "jpg"}`;
          const result = await storagePut(relKey, buffer, `image/${extension || "jpeg"}`);
          return { url: result.url, key: relKey };
        };

        const [front, back] = await Promise.all([
          uploadImage(input.frontImageBase64, "front"),
          input.backImageBase64 ? uploadImage(input.backImageBase64, "back") : Promise.resolve(null)
        ]);

        const postcardId = await db.createPostcard({
          title: input.title,
          description: input.description,
          warPeriod: input.warPeriod,
          ebayUrl: "user_upload",
          dateFound: new Date(),
          isPublic: false,
          transcriptionStatus: "pending",
          uploadedBy: ctx.user.id
        });

        await db.createPostcardImage({
          postcardId,
          s3Key: front.key,
          s3Url: front.url,
          isPrimary: true
        });

        if (back) {
          await db.createPostcardImage({
            postcardId,
            s3Key: back.key,
            s3Url: back.url,
            isPrimary: false
          });
        }

        // Kickoff background transcription
        const { transcribePostcardById } = await import("./transcriptionService");
        transcribePostcardById(postcardId).catch(console.error);

        return { success: true, postcardId };
      })
  }),

  // Public postcard viewing
  postcards: router({
    list: publicProcedure
      .input(z.object({
        warPeriod: z.enum(["WWI", "WWII", "Holocaust"]).optional(),
        searchQuery: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const postcards = await db.getAllPostcards({
          ...input,
          isPublic: true
        });

        // Get primary images for each postcard
        const postcardsWithImages = await Promise.all(
          postcards.map(async (postcard) => {
            const primaryImage = await db.getPrimaryImage(postcard.id);
            return {
              ...postcard,
              primaryImage
            };
          })
        );

        return postcardsWithImages;
      }),

    getById: publicProcedure
      .input(z.object({
        id: z.number()
      }))
      .query(async ({ input }) => {
        const postcard = await db.getPostcardById(input.id);

        if (!postcard) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Postcard not found' });
        }

        if (!postcard.isPublic) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'This postcard is not public' });
        }

        const images = await db.getPostcardImages(input.id);
        const transcriptions = await db.getPostcardTranscriptions(input.id);

        return {
          ...postcard,
          images,
          transcriptions
        };
      }),

    searchByTranscription: publicProcedure
      .input(z.object({
        query: z.string().min(1)
      }))
      .query(async ({ input }) => {
        const postcards = await db.searchPostcardsByTranscription(input.query);

        // Get primary images
        const postcardsWithImages = await Promise.all(
          postcards.map(async (postcard) => {
            const primaryImage = await db.getPrimaryImage(postcard.id);
            return {
              ...postcard,
              primaryImage
            };
          })
        );

        return postcardsWithImages;
      }),
  }),

  // Admin operations
  admin: router({
    // Scraper operations
    scraper: router({
      run: adminProcedure
        .input(z.object({
          warPeriod: z.enum(["WWI", "WWII", "Holocaust"]).optional()
        }).optional())
        .mutation(async ({ input }) => {
          const result = await scrapeEbayPostcards(input?.warPeriod);
          return result;
        }),

      logs: adminProcedure
        .input(z.object({
          limit: z.number().default(50)
        }).optional())
        .query(async ({ input }) => {
          return await db.getRecentScrapingLogs(input?.limit || 50);
        }),
    }),

    // Transcription operations
    transcription: router({
      processAll: adminProcedure
        .mutation(async () => {
          return await processTranscriptions();
        }),

      processOne: adminProcedure
        .input(z.object({
          postcardId: z.number()
        }))
        .mutation(async ({ input }) => {
          const success = await transcribePostcardById(input.postcardId);
          return { success };
        }),
    }),

    // Postcard management
    postcards: router({
      listAll: adminProcedure
        .input(z.object({
          warPeriod: z.enum(["WWI", "WWII", "Holocaust"]).optional(),
          searchQuery: z.string().optional(),
        }).optional())
        .query(async ({ input }) => {
          const postcards = await db.getAllPostcards(input);

          const postcardsWithImages = await Promise.all(
            postcards.map(async (postcard) => {
              const primaryImage = await db.getPrimaryImage(postcard.id);
              return {
                ...postcard,
                primaryImage
              };
            })
          );

          return postcardsWithImages;
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          isPublic: z.boolean().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          warPeriod: z.enum(["WWI", "WWII", "Holocaust"]).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, ...updates } = input;
          await db.updatePostcard(id, updates);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({
          id: z.number()
        }))
        .mutation(async ({ input }) => {
          await db.deletePostcard(input.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
