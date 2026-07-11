"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    return { data: updated };
  } catch (err: any) {
    return { error: err?.message || "Failed to toggle corporate account" };
  }
}
