import { scrapeEbayPostcards } from './server/scraperService.ts';
import { processTranscriptions } from './server/transcriptionService.ts';

console.log('Starting scraper to find handwritten postcards...');

try {
  const scrapeResult = await scrapeEbayPostcards();
  console.log(`\n✓ Scraping completed:`);
  console.log(`  - Items found: ${scrapeResult.itemsFound}`);
  console.log(`  - Items added: ${scrapeResult.itemsAdded}`);
  
  if (scrapeResult.itemsAdded > 0) {
    console.log('\nStarting transcription process...');
    const transcribeResult = await processTranscriptions();
    console.log(`\n✓ Transcription completed:`);
    console.log(`  - Processed: ${transcribeResult.processed}`);
    console.log(`  - Succeeded: ${transcribeResult.succeeded}`);
    console.log(`  - Failed: ${transcribeResult.failed}`);
  } else {
    console.log('\nNo new postcards to transcribe.');
  }
  
  process.exit(0);
} catch (error) {
  console.error('\n✗ Error:', error);
  process.exit(1);
}
