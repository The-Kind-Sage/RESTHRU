const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const rows = await p['$queryRawUnsafe']("SELECT id, owner_id, name FROM restaurants LIMIT 5");
  console.log(JSON.stringify(rows, null, 2));
  await p['$disconnect']();
}
main().catch(e => { console.error(e.message); process.exit(1); });
