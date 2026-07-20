"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "./logs";

export async function searchCustomers(query: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId: session.restaurantId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      },
      orderBy: { name: "asc" },
      take: 20,
    });
    return { data: customers };
  } catch (err: any) {
    return { error: err?.message || "Failed to search customers" };
  }
}

export async function getCustomerByPhone(phone: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customer = await prisma.customer.findUnique({
      where: { restaurantId_phone: { restaurantId: session.restaurantId, phone } },
    });
    return { data: customer };
  } catch (err: any) {
    return { error: err?.message || "Failed to find customer" };
  }
}

export async function getCustomerProfile(phone: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customer = await prisma.customer.findUnique({
      where: { restaurantId_phone: { restaurantId: session.restaurantId, phone } },
    });
    if (!customer) return { data: null };

    // Get recent orders for this customer
    const recentOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.restaurantId,
        customerPhone: phone,
        status: { in: ["SERVED", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderId: true,
        totalAmount: true,
        createdAt: true,
        items: { select: { menuItemName: true, quantity: true } },
      },
    });

    // Get reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: session.restaurantId,
        customerPhone: phone,
      },
      orderBy: { reservedFor: "desc" },
      take: 10,
    });

    // Get bills
    const bills = await prisma.bill.findMany({
      where: {
        restaurantId: session.restaurantId,
        order: { customerPhone: phone },
      },
      orderBy: { billDate: "desc" },
      take: 10,
      select: {
        id: true,
        billNumber: true,
        totalAmount: true,
        billDate: true,
        status: true,
      },
    });

    return {
      data: {
        ...customer,
        recentOrders,
        reservations,
        bills,
        // Computed insights
        favoriteItems: getFavoriteItems(recentOrders),
        avgSpend: recentOrders.length > 0
          ? recentOrders.reduce((sum, o) => sum + o.totalAmount, 0) / recentOrders.length
          : 0,
        lastVisit: recentOrders[0]?.createdAt || customer.lastVisitAt,
      },
    };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch customer profile" };
  }
}

function getFavoriteItems(orders: any[]): string[] {
  const itemCounts: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      itemCounts[item.menuItemName] = (itemCounts[item.menuItemName] || 0) + item.quantity;
    }
  }
  return Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
  dietaryNotes?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customer = await prisma.customer.create({
      data: {
        restaurantId: session.restaurantId,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        dietaryNotes: data.dietaryNotes || null,
        loyaltyPoints: 0,
      },
    });
    await logActivity(session, {
      actionType: "CUSTOMER_CREATE",
      entityType: "Customer",
      entityId: customer.id,
      description: `Customer "${customer.name || customer.phone}" created`,
    });
    return { data: customer };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: "Customer with this phone already exists" };
    }
    return { error: err?.message || "Failed to create customer" };
  }
}

export async function getCustomers(limit = 50) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customers = await prisma.customer.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return { data: customers };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch customers" };
  }
}

export async function addLoyaltyPoints(customerId: string, points: number) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, restaurantId: session.restaurantId },
    });
    if (!customer) return { error: "Customer not found" };

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    });
    await logActivity(session, {
      actionType: "LOYALTY_POINTS_ADD",
      entityType: "Customer",
      entityId: customerId,
      description: `${points} loyalty points added`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to add loyalty points" };
  }
}

export async function redeemLoyaltyPoints(customerId: string, points: number) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, restaurantId: session.restaurantId },
    });
    if (!customer) return { error: "Customer not found" };
    if (customer.loyaltyPoints < points) {
      return { error: "Insufficient loyalty points" };
    }

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: points } },
    });
    await logActivity(session, {
      actionType: "LOYALTY_POINTS_REDEEM",
      entityType: "Customer",
      entityId: customerId,
      description: `${points} loyalty points redeemed`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to redeem loyalty points" };
  }
}

export async function getCoupons() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const coupons = await prisma.coupon.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return { data: coupons };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch coupons" };
  }
}

export async function createCoupon(data: {
  code: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const coupon = await prisma.coupon.create({
      data: {
        restaurantId: session.restaurantId,
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit || null,
        usageCount: 0,
        isActive: true,
      },
    });
    await logActivity(session, {
      actionType: "COUPON_CREATE",
      entityType: "Coupon",
      entityId: coupon.id,
      description: `Coupon "${coupon.code}" created (${coupon.discountType} ${coupon.discountValue})`,
    });
    return { data: coupon };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { error: "Coupon code already exists" };
    }
    return { error: err?.message || "Failed to create coupon" };
  }
}

export async function validateCoupon(code: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { restaurantId_code: { restaurantId: session.restaurantId, code: code.toUpperCase() } },
    });
    if (!coupon) return { error: "Coupon not found" };
    if (!coupon.isActive) return { error: "Coupon is inactive" };

    const now = new Date();
    if (now < coupon.validFrom) return { error: "Coupon is not yet valid" };
    if (now > coupon.validUntil) return { error: "Coupon has expired" };

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { error: "Coupon usage limit reached" };
    }

    return { data: coupon };
  } catch (err: any) {
    return { error: err?.message || "Failed to validate coupon" };
  }
}

export async function toggleCoupon(couponId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const coupon = await prisma.coupon.findFirst({
      where: { id: couponId, restaurantId: session.restaurantId },
    });
    if (!coupon) return { error: "Coupon not found" };

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: !coupon.isActive },
    });
    await logActivity(session, {
      actionType: "COUPON_TOGGLE",
      entityType: "Coupon",
      entityId: couponId,
      description: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to toggle coupon" };
  }
}

export async function getCorporateAccounts() {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const accounts = await prisma.corporateAccount.findMany({
      where: { restaurantId: session.restaurantId },
      orderBy: { companyName: "asc" },
    });
    return { data: accounts };
  } catch (err: any) {
    return { error: err?.message || "Failed to fetch corporate accounts" };
  }
}

export async function createCorporateAccount(data: {
  companyName: string;
  contactName?: string;
  contactPhone?: string;
  billingAddress?: string;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const account = await prisma.corporateAccount.create({
      data: {
        restaurantId: session.restaurantId,
        companyName: data.companyName,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        billingAddress: data.billingAddress || null,
        isActive: true,
      },
    });
    await logActivity(session, {
      actionType: "CORPORATE_ACCOUNT_CREATE",
      entityType: "CorporateAccount",
      entityId: account.id,
      description: `Corporate account "${account.companyName}" created`,
    });
    return { data: account };
  } catch (err: any) {
    return { error: err?.message || "Failed to create corporate account" };
  }
}

export async function toggleCorporateAccount(accountId: string) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  try {
    const account = await prisma.corporateAccount.findFirst({
      where: { id: accountId, restaurantId: session.restaurantId },
    });
    if (!account) return { error: "Corporate account not found" };

    const updated = await prisma.corporateAccount.update({
      where: { id: accountId },
      data: { isActive: !account.isActive },
    });
    await logActivity(session, {
      actionType: "CORPORATE_ACCOUNT_TOGGLE",
      entityType: "CorporateAccount",
      entityId: accountId,
      description: `Corporate account ${account.isActive ? "activated" : "deactivated"}`,
    });
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to toggle corporate account" };
  }
}
