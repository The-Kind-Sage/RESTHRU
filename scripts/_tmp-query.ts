import prisma from "../lib/prisma";

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, isActive: true },
  });
  console.log("Restaurants:", restaurants);

  for (const r of restaurants) {
    const tables = await prisma.restaurantTable.findMany({ where: { restaurantId: r.id }, select: { id: true, tableNumber: true, status: true } });
    const items = await prisma.menuItem.findMany({ where: { restaurantId: r.id, isAvailable: true }, select: { id: true, name: true, price: true }, take: 3 });
    console.log(r.name, r.id, "tables:", tables.length, "menuItems available:", items.length);
    console.log("  sample tables:", tables.slice(0, 3));
    console.log("  sample items:", items);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
