const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const users = await p['$queryRawUnsafe']("SELECT id, email FROM auth.users LIMIT 5");
  console.log('Users:', JSON.stringify(users, null, 2));
  const restaurants = await p['$queryRawUnsafe']("SELECT id, owner_id, name FROM restaurants LIMIT 5");
  console.log('Restaurants:', JSON.stringify(restaurants, null, 2));
  await p['$disconnect']();
}
main().catch(e => { console.error(e.message); process.exit(1); });
