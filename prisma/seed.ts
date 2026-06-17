import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin@123", 12);
  const restaurantPassword = await bcrypt.hash("java@123", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@resthru.com",
      passwordHash: adminPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("Admin user created:", admin.username);

  const restaurant = await prisma.restaurant.upsert({
    where: { id: "demo-restaurant" },
    update: {},
    create: {
      id: "demo-restaurant",
      name: "Himalayan Java",
      type: "CASUAL_DINING",
      email: "info@himalayanjava.com",
      phoneNumber: "+977-1-4XXXXXX",
      street: "Durbar Marg",
      city: "Kathmandu",
      state: "Bagmati",
      country: "Nepal",
      timezone: "Asia/Kathmandu",
      currency: "NPR",
      totalTables: 10,
      totalStaff: 5,
      isActive: true,
    },
  });
  console.log("Restaurant created:", restaurant.name);

  const owner = await prisma.user.upsert({
    where: { username: "himalayan java" },
    update: {},
    create: {
      username: "himalayan java",
      email: "owner@himalayanjava.com",
      passwordHash: restaurantPassword,
      firstName: "Himalayan",
      lastName: "Java Owner",
      role: "OWNER",
      restaurantId: restaurant.id,
      isActive: true,
    },
  });
  console.log("Restaurant owner created:", owner.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
