"use server";

import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function addCategory(data: {
  name: string;
  nameNp?: string;
  emoji?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  const supabase = supabaseServer();
  const payload = {
    restaurant_id: session.restaurantId,
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
  if (!session?.restaurantId) return { error: "Not authenticated" };

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
  if (!session?.restaurantId) return { error: "Not authenticated" };

  const supabase = supabaseServer();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleCategoryActive(id: string, active: boolean) {
  const session = await getSession();
  if (!session?.restaurantId) return { error: "Not authenticated" };

  const supabase = supabaseServer();
  const { error } = await supabase.from("categories").update({ is_active: active }).eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
