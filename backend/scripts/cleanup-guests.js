require('dotenv').config();
const { cleanupStaleGuests } = require('../src/services/cleanup.service');

async function main() {
  const days = parseInt(process.argv[2] || '30', 10);
  const result = await cleanupStaleGuests({ olderThanDays: days });
  console.log('Result:', result);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// node scripts/cleanup-guests.js 0