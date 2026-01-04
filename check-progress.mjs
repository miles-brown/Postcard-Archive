import { getAllPostcards } from './server/db.ts';

const postcards = await getAllPostcards({});
console.log(`\nTotal postcards collected: ${postcards.length}`);

const byPeriod = {
  WWI: postcards.filter(p => p.warPeriod === 'WWI').length,
  WWII: postcards.filter(p => p.warPeriod === 'WWII').length,
  Holocaust: postcards.filter(p => p.warPeriod === 'Holocaust').length
};

console.log('\nBy war period:');
console.log(`  WWI: ${byPeriod.WWI}`);
console.log(`  WWII: ${byPeriod.WWII}`);
console.log(`  Holocaust: ${byPeriod.Holocaust}`);

const byStatus = {
  pending: postcards.filter(p => p.transcriptionStatus === 'pending').length,
  processing: postcards.filter(p => p.transcriptionStatus === 'processing').length,
  completed: postcards.filter(p => p.transcriptionStatus === 'completed').length,
  failed: postcards.filter(p => p.transcriptionStatus === 'failed').length
};

console.log('\nTranscription status:');
console.log(`  Pending: ${byStatus.pending}`);
console.log(`  Processing: ${byStatus.processing}`);
console.log(`  Completed: ${byStatus.completed}`);
console.log(`  Failed: ${byStatus.failed}`);

process.exit(0);
