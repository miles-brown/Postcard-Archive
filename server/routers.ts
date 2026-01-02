import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { scrapeEbayPostcards } from "./scraperService";
import { processTranscriptions, transcribePostcardById } from "./transcriptionService";

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
