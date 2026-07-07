"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

async function resolveRestaurantId(session: { id: string; email: string }): Promise<string | null> {
  // First try the user's restaurantId
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { restaurantId: true },
  });
  if (user?.restaurantId) return user.restaurantId;

  // Fallback: look up by Supabase auth owner_id using the user's email
  const supabase = supabaseServer();
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.email === session.email);
  if (authUser) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: authUser.id },
      select: { id: true },
    });
    if (restaurant?.id) return restaurant.id;
  }

  return null;
}

export async function addCategory(data: {
  name: string;
  nameNp?: string;
  emoji?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const restaurantId = await resolveRestaurantId(session);
  if (!restaurantId) return { error: "No restaurant found for your account" };

  const supabase = supabaseServer();
  const payload = {
    restaurant_id: restaurantId,
    name: data.name,
    name_np: data.nameNp || null,
    icon: data.emoji || "📂",
    sort_order: data.sortOrder || 0,
    is_active: data.active ?? true,
  };

  const { data: result, error } = await supabase
    .from("categories")
    .insert([payload])
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { data: { id: result.id } };
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    nameNp?: string;
    emoji?: string;
    sortOrder?: number;
    active?: boolean;
  }
) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const restaurantId = await resolveRestaurantId(session);
  if (!restaurantId) return { error: "No restaurant found for your account" };

  const supabase = supabaseServer();
  const payload = {
    name: data.name,
    name_np: data.nameNp || null,
    icon: data.emoji || "📂",
    sort_order: data.sortOrder || 0,
    is_active: data.active ?? true,
  };

  const { error } = await supabase.from("categories").update(payload).eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const restaurantId = await resolveRestaurantId(session);
  if (!restaurantId) return { error: "No restaurant found for your account" };

  const supabase = supabaseServer();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const restaurantId = await resolveRestaurantId(session);
  if (!restaurantId) return { error: "No restaurant found for your account" };

  const supabase = supabaseServer();
  const { error } = await supabase.from("categories").update({ is_active: active }).eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
