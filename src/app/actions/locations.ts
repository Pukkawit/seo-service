"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLocation({
  city,
  category,
  areas,
}: {
  city: string;
  category: string;
  areas: string[];
}) {
  if (!city || !category || !areas?.length) {
    return { success: false, error: "All fields are required" };
  }

  const supabase = await createServerSupabaseClient();

  // Insert multiple areas at once
  const { error } = await supabase
    .from("locations")
    .insert(areas.map((name) => ({ city, category, name })));

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/"); // refresh UI cache
  return { success: true };
}
