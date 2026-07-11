"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getInventoryItems(restaurantId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const items = await prisma.inventoryItem.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return { data: items };
  } catch (err: any) {
    return { error: err?.message || "Failed to load inventory" };
  }
}

export async function addInventoryItem(data: {
  restaurantId: string;
  name: string;
  category?: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.category || null,
        currentQuantity: data.currentStock,
        unit: data.unit,
        reorderLevel: data.minThreshold,
      },
    });
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to add item" };
  }
}

// ─── Stock movements — backed by the (previously unused) InventoryHistory
// table. Every quantity change goes through here so `historyEntries` stays a
// real audit trail instead of the page fabricating "Recent Movements".
async function recordMovement(
  inventoryItemId: string,
  movementType: "ADD" | "USAGE" | "ADJUSTMENT",
  quantity: number,
  recordedBy: string,
  reason?: string | null
) {
  await prisma.inventoryHistory.create({
    data: { inventoryItemId, movementType, quantity, reason: reason || null, recordedBy },
  });
}

// Directly set the stock level to an exact value — used by the inline
// EditableStockCell on the inventory table. Previously this cell discarded
// the typed value with no server call at all (real data-loss bug).
export async function updateInventoryStock(id: string, newQuantity: number, reason?: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };
  if (newQuantity < 0) return { error: "Stock cannot be negative" };

  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { id }, select: { currentQuantity: true } });
    if (!existing) return { error: "Item not found" };

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { currentQuantity: newQuantity, lastRestockDate: newQuantity > existing.currentQuantity ? new Date() : undefined },
    });

    const delta = newQuantity - existing.currentQuantity;
    if (delta !== 0) {
      await recordMovement(id, "ADJUSTMENT", delta, session.id, reason || "Manual stock edit");
    }
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to update stock" };
  }
}

// Add stock (delivery/restock) — StockHistoryDialog's "Add Stock" action.
export async function addStock(id: string, quantity: number, notes?: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };
  if (!quantity || quantity <= 0) return { error: "Enter a quantity greater than 0" };

  try {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { currentQuantity: { increment: quantity }, lastRestockDate: new Date() },
    });
    await recordMovement(id, "ADD", quantity, session.id, notes);
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to add stock" };
  }
}

// Record usage (consumption/waste) — StockHistoryDialog's "Record Usage" action.
export async function recordUsage(id: string, quantity: number, notes?: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };
  if (!quantity || quantity <= 0) return { error: "Enter a quantity greater than 0" };

  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { id }, select: { currentQuantity: true } });
    if (!existing) return { error: "Item not found" };
    const clamped = Math.min(quantity, existing.currentQuantity);

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { currentQuantity: { decrement: clamped } },
    });
    await recordMovement(id, "USAGE", clamped, session.id, notes);
    return { data: item };
  } catch (err: any) {
    return { error: err?.message || "Failed to record usage" };
  }
}

// Recent movements + a derived stock-trend series for StockHistoryDialog.
export async function getInventoryHistory(inventoryItemId: string, limit = 20) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  try {
    const [entries, item] = await Promise.all([
      prisma.inventoryHistory.findMany({
        where: { inventoryItemId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.inventoryItem.findUnique({ where: { id: inventoryItemId }, select: { currentQuantity: true } }),
    ]);

    // Reconstruct an approximate stock trajectory by walking the fetched
    // window backward from the current known quantity — real data derived
    // from the actual movement ledger, not a fabricated series.
    const chronological = [...entries].reverse();
    let running = item?.currentQuantity ?? 0;
    const trend: { day: string; stock: number }[] = [];
    for (let i = chronological.length - 1; i >= 0; i--) {
      const e = chronological[i];
      const signedDelta = e.movementType === "USAGE" ? -e.quantity : e.quantity;
      trend.unshift({ day: e.createdAt.toISOString().split("T")[0], stock: running });
      running -= signedDelta;
    }
    trend.unshift({ day: "start", stock: running });

    return { data: { entries, trend } };
  } catch (err: any) {
    return { error: err?.message || "Failed to load stock history" };
  }
}
