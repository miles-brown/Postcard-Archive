import { createScrapingLog, updateScrapingLog, createPostcard, getPostcardByEbayId, createPostcardImage } from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

/**
 * Search queries for different war periods
 */
const SEARCH_QUERIES = {
  WWI: [
    "WWI handwritten postcard",
    "World War 1 handwritten postcard",
    "WW1 soldier postcard handwritten",
    "WWI field postcard handwritten",
    "Great War soldier letter postcard",
    "1914-1918 handwritten postcard",
  ],
  WWII: [
    "WWII handwritten postcard",
    "World War 2 handwritten postcard",
    "WW2 soldier postcard handwritten",
    "WWII military postcard handwritten",
    "1939-1945 soldier postcard",
    "World War II field post handwritten",
  ],
  Holocaust: [
    "Holocaust postcard handwritten",
    "concentration camp postcard",
    "ghetto postcard handwritten",
    "Jewish persecution postcard",
    "Holocaust survivor postcard",
  ]
};

interface EbayListing {
  title: string;
  price?: string;
  url: string;
  ebayId?: string;
  seller?: string;
  description?: string;
  imageUrls: string[];
}

/**
 * Execute Firecrawl MCP command to scrape eBay
 */
async function executeFirecrawlMCP(command: string, args: Record<string, any>): Promise<any> {
  const { execSync } = await import("child_process");
  
  try {
    const argsJson = JSON.stringify(args).replace(/'/g, "'\\''");
    const result = execSync(
      `manus-mcp-cli tool call ${command} --server firecrawl --input '${argsJson}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );
    
    // Parse the output - MCP CLI saves to file and prints result
    const lines = result.split('\n');
    let jsonStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '{' || lines[i].trim().startsWith('{')) {
        jsonStartIndex = i;
        break;
      }
    }
    
    if (jsonStartIndex === -1) {
      throw new Error("No JSON found in MCP output");
    }
    
    const jsonStr = lines.slice(jsonStartIndex).join('\n');
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("[Firecrawl MCP] Error:", error.message);
    throw error;
  }
}

/**
 * Parse eBay search results from markdown content
 */
function parseEbayResults(markdown: string): EbayListing[] {
  const listings: EbayListing[] = [];
  
  // Extract eBay item URLs - pattern: /itm/{item-name}/{item-id}
  const itemUrlPattern = /https:\/\/www\.ebay\.com\/itm\/[^\s\)]+/g;
  const urls = markdown.match(itemUrlPattern) || [];
  
  // Extract unique eBay IDs from URLs
  const seenIds = new Set<string>();
  
  urls.forEach(url => {
    try {
      // Clean up URL (remove markdown artifacts)
      const cleanUrl = url.replace(/[)\]]+$/, '');
      
      // Extract eBay ID from URL (typically the last numeric segment)
      const idMatch = cleanUrl.match(/\/(\d{12,})/);
      const ebayId = idMatch ? idMatch[1] : undefined;
      
      if (ebayId && !seenIds.has(ebayId)) {
        seenIds.add(ebayId);
        
        listings.push({
          title: `eBay Listing ${ebayId}`,
          url: cleanUrl,
          ebayId: ebayId,
          imageUrls: []
        });
      }
    } catch (error) {
      console.error("[Parser] Error parsing URL:", url, error);
    }
  });
  
  return listings;
}

/**
 * Scrape detailed information from a single eBay listing page
 */
async function scrapeListingDetails(url: string): Promise<Partial<EbayListing> | null> {
  try {
    const data = await executeFirecrawlMCP("firecrawl_scrape", {
      url: url,
      formats: ["markdown", "html"],
      onlyMainContent: true
    });
    
    if (!data.markdown && !data.html) {
      return null;
    }
    
    const markdown = data.markdown || "";
    const html = data.html || "";
    
    // Extract title (usually in h1 or first heading)
    const titleMatch = markdown.match(/^#\s+(.+)$/m) || html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    
    // Extract price
    const priceMatch = markdown.match(/\$[\d,]+\.?\d*/g) || html.match(/\$[\d,]+\.?\d*/g);
    const price = priceMatch ? priceMatch[0] : undefined;
    
    // Extract seller
    const sellerMatch = html.match(/seller[^>]*>([^<]+)</i);
    const seller = sellerMatch ? sellerMatch[1].trim() : undefined;
    
    // Extract description (first 2000 chars)
    const description = markdown.substring(0, 2000);
    
    // Extract image URLs and convert to high quality
    const imagePattern = /https:\/\/i\.ebayimg\.com\/images\/[^\s)"']+/g;
    const matchedImages = html.match(imagePattern) || [];
    
    // Convert to high quality URLs by replacing size parameters
    const hqImageUrls = matchedImages.map((url: string) => {
      // Remove size parameters like s-l140, s-l500 and replace with s-l1600 (highest quality)
      return url.replace(/\/s-l\d+\./g, '/s-l1600.')
                .replace(/\/s-l\d+$/g, '/s-l1600');
    });
    
    const imageUrls = Array.from(new Set(hqImageUrls.slice(0, 10))) as string[];
    
    return {
      title,
      price,
      seller,
      description,
      imageUrls
    };
  } catch (error) {
    console.error("[Scraper] Error scraping listing details:", url, error);
    return null;
  }
}

/**
 * Download image from URL and upload to S3
 */
async function downloadAndUploadImage(imageUrl: string, postcardId: number): Promise<{ s3Key: string; s3Url: string } | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine content type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Generate unique S3 key
    const extension = contentType.split("/")[1] || "jpg";
    const s3Key = `postcards/${postcardId}/${nanoid()}.${extension}`;
    
    // Upload to S3
    const { url } = await storagePut(s3Key, buffer, contentType);
    
    return { s3Key, s3Url: url };
  } catch (error) {
    console.error("[Scraper] Error downloading/uploading image:", imageUrl, error);
    return null;
  }
}

/**
 * Main scraping function
 */
export async function scrapeEbayPostcards(warPeriod?: "WWI" | "WWII" | "Holocaust"): Promise<{
  itemsFound: number;
  itemsAdded: number;
}> {
  const periodsToScrape = warPeriod ? [warPeriod] : ["WWI", "WWII", "Holocaust"] as const;
  
  let totalItemsFound = 0;
  let totalItemsAdded = 0;
  
  for (const period of periodsToScrape) {
    const queries = SEARCH_QUERIES[period];
    
    for (const query of queries) {
      const logId = await createScrapingLog({
        status: "started",
        searchQuery: query,
        itemsFound: 0,
        itemsAdded: 0,
      });
      
      try {
        console.log(`[Scraper] Searching eBay for: ${query}`);
        
        // Search eBay using Firecrawl
        const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sop=10`; // Sort by newly listed
        
        const data = await executeFirecrawlMCP("firecrawl_scrape", {
          url: searchUrl,
          formats: ["markdown", "html"],
          onlyMainContent: true
        });
        
        if (!data.markdown && !data.html) {
          await updateScrapingLog(logId, {
            status: "completed",
            completedAt: new Date(),
            itemsFound: 0,
            itemsAdded: 0
          });
          continue;
        }
        
        const markdown = data.markdown || data.html || "";
        const listings = parseEbayResults(markdown);
        
        console.log(`[Scraper] Found ${listings.length} potential listings for query: ${query}`);
        
        let itemsAdded = 0;
        
        // Limit to first 15 listings per query to avoid overwhelming the system
        const limitedListings = listings.slice(0, 15);
        
        for (const listing of limitedListings) {
          try {
            // Check if already exists
            if (listing.ebayId) {
              const existing = await getPostcardByEbayId(listing.ebayId);
              if (existing) {
                console.log(`[Scraper] Skipping duplicate: ${listing.ebayId}`);
                continue;
              }
            }
            
            // Scrape detailed information
            const details = await scrapeListingDetails(listing.url);
            if (!details) continue;
            
            // Merge listing data with details
            const finalData = { ...listing, ...details };
            
            // Create postcard record
            const postcardId = await createPostcard({
              ebayUrl: finalData.url,
              ebayId: finalData.ebayId || null,
              title: finalData.title || "Untitled Postcard",
              price: finalData.price || null,
              seller: finalData.seller || null,
              description: finalData.description || null,
              warPeriod: period,
              transcriptionStatus: "pending",
              isPublic: true,
            });
            
            // Download and store images
            if (finalData.imageUrls && finalData.imageUrls.length > 0) {
              for (let i = 0; i < Math.min(finalData.imageUrls.length, 5); i++) {
                const imageUrl = finalData.imageUrls[i];
                const uploadResult = await downloadAndUploadImage(imageUrl, postcardId);
                
                if (uploadResult) {
                  await createPostcardImage({
                    postcardId: postcardId,
                    s3Key: uploadResult.s3Key,
                    s3Url: uploadResult.s3Url,
                    originalUrl: imageUrl,
                    isPrimary: i === 0, // First image is primary
                  });
                }
              }
            }
            
            itemsAdded++;
            console.log(`[Scraper] Added postcard: ${finalData.title}`);
            
            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 3000));
            
          } catch (error) {
            console.error("[Scraper] Error processing listing:", listing.url, error);
          }
        }
        
        totalItemsFound += listings.length;
        totalItemsAdded += itemsAdded;
        
        await updateScrapingLog(logId, {
          status: "completed",
          completedAt: new Date(),
          itemsFound: listings.length,
          itemsAdded: itemsAdded
        });
        
      } catch (error: any) {
        console.error(`[Scraper] Error scraping query "${query}":`, error);
        await updateScrapingLog(logId, {
          status: "failed",
          completedAt: new Date(),
          errorMessage: error.message
        });
      }
    }
  }
  
  return {
    itemsFound: totalItemsFound,
    itemsAdded: totalItemsAdded
  };
}
