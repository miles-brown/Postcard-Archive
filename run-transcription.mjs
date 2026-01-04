import { processTranscriptions } from './server/transcriptionService.ts';

console.log('Starting transcription process...');

try {
  const result = await processTranscriptions();
  console.log(`\n✓ Transcription completed:`);
  console.log(`  - Processed: ${result.processed}`);
  console.log(`  - Succeeded: ${result.succeeded}`);
  console.log(`  - Failed: ${result.failed}`);
  
  process.exit(0);
} catch (error) {
  console.error('\n✗ Error:', error);
  process.exit(1);
}
