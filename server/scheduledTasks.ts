/**
 * Scheduled tasks for automated scraping and transcription
 * 
 * This file contains the logic for automated background tasks.
 * To schedule these tasks, use the Manus schedule tool or set up cron jobs.
 */

import { scrapeEbayPostcards } from "./scraperService";
import { processTranscriptions } from "./transcriptionService";

/**
 * Main scheduled task: Scrape eBay and process transcriptions
 * 
 * This should be scheduled to run multiple times daily (e.g., every 6 hours)
 */
export async function runScheduledScrapeAndTranscribe() {
  console.log("[Scheduled Task] Starting automated scrape and transcribe");
  
  try {
    // Step 1: Scrape eBay for new postcards
    console.log("[Scheduled Task] Running scraper...");
    const scrapeResult = await scrapeEbayPostcards();
    console.log(`[Scheduled Task] Scraper completed: ${scrapeResult.itemsAdded} new postcards added`);
    
    // Step 2: Process pending transcriptions
    console.log("[Scheduled Task] Processing transcriptions...");
    const transcribeResult = await processTranscriptions();
    console.log(`[Scheduled Task] Transcription completed: ${transcribeResult.succeeded} succeeded, ${transcribeResult.failed} failed`);
    
    console.log("[Scheduled Task] Completed successfully");
    
    return {
      success: true,
      scrapeResult,
      transcribeResult
    };
  } catch (error) {
    console.error("[Scheduled Task] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Scrape-only scheduled task
 * Can be scheduled separately if needed
 */
export async function runScheduledScrape() {
  console.log("[Scheduled Task] Starting automated scrape");
  
  try {
    const result = await scrapeEbayPostcards();
    console.log(`[Scheduled Task] Scraper completed: ${result.itemsAdded} new postcards added`);
    return { success: true, result };
  } catch (error) {
    console.error("[Scheduled Task] Scraper error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Transcription-only scheduled task
 * Can be scheduled separately if needed
 */
export async function runScheduledTranscription() {
  console.log("[Scheduled Task] Starting automated transcription");
  
  try {
    const result = await processTranscriptions();
    console.log(`[Scheduled Task] Transcription completed: ${result.succeeded} succeeded, ${result.failed} failed`);
    return { success: true, result };
  } catch (error) {
    console.error("[Scheduled Task] Transcription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
