import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin@123", 12);
  const superAdminPassword = await bcrypt.hash("password@123", 12);
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

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@drillthru.tech" },
    update: {},
    create: {
      username: "drillthru admin",
      email: "admin@drillthru.tech",
      passwordHash: superAdminPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("Super admin user created:", superAdmin.email);

  // Seed default plans
  const defaultPlans = [
    {
      id: "plan-free",
      type: "FREE",
      name: "Free",
      description: "For the single-room place still finding its feet.",
      monthlyPrice: 0,
      annualPrice: 0,
      currency: "NPR",
      maxRestaurants: 1,
      maxTables: 5,
      maxStaff: 3,
      maxMenuItems: 10,
      features: [
        "Up to 5 tables",
        "Basic QR ordering",
        "Manual billing",
        "Email support",
      ],
      displayOrder: 0,
      isPopular: false,
      colorHex: "#6b7280",
      isActive: true,
    },
    {
      id: "plan-basic",
      type: "BASIC",
      name: "Growth",
      description: "For when one QR code is no longer enough.",
      monthlyPrice: 999,
      annualPrice: 9990,
      currency: "NPR",
      maxRestaurants: 1,
      maxTables: 20,
      maxStaff: 10,
      maxMenuItems: 50,
      features: [
        "Up to 20 tables",
        "Full QR ordering",
        "Automated billing",
        "Inventory tracking",
        "Priority support",
      ],
      displayOrder: 1,
      isPopular: true,
      colorHex: "#4f46e5",
      isActive: true,
    },
    {
      id: "plan-pro",
      type: "PRO",
      name: "Enterprise",
      description: "For chains juggling more than one kitchen.",
      monthlyPrice: 2999,
      annualPrice: 29990,
      currency: "NPR",
      maxRestaurants: 3,
      maxTables: 50,
      maxStaff: 50,
      maxMenuItems: 200,
      features: [
        "Unlimited tables",
        "All Growth features",
        "Advanced analytics",
        "Multi-location (up to 3)",
        "API access",
        "Dedicated support",
      ],
      displayOrder: 2,
      isPopular: false,
      colorHex: "#059669",
      isActive: true,
    },
    {
      id: "plan-enterprise",
      type: "ENTERPRISE",
      name: "Enterprise Plus",
      description: "Custom solutions for large-scale operations.",
      monthlyPrice: 9999,
      annualPrice: 99990,
      currency: "NPR",
      maxRestaurants: 999,
      maxTables: 9999,
      maxStaff: 999,
      maxMenuItems: 9999,
      features: [
        "Unlimited tables",
        "All Pro features",
        "Custom integrations",
        "Unlimited branches",
        "White-label options",
        "24/7 dedicated support",
      ],
      displayOrder: 3,
      isPopular: false,
      colorHex: "#d97706",
      isActive: true,
    },
  ];

  for (const plan of defaultPlans) {
    await prisma.plan.upsert({
      where: { type: plan.type },
      update: plan,
      create: plan,
    });
    console.log(`Plan seeded: ${plan.name} (${plan.type})`);
  }

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
