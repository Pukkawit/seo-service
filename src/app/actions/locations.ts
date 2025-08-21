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

  // Check if city + category exists
  const { data: existing, error: fetchError } = await supabase
    .from("locations")
    .select("id, name")
    .eq("city", city)
    .eq("category", category)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 = no rows found, ignore
    return { success: false, error: fetchError.message };
  }

  if (existing) {
    // merge new areas with old ones
    const updatedAreas = Array.from(new Set([...existing.name, ...areas]));
    const { error: updateError } = await supabase
      .from("locations")
      .update({ name: updatedAreas, updated_at: new Date() })
      .eq("id", existing.id);

    if (updateError) return { success: false, error: updateError.message };
  } else {
    // insert new
    const { error: insertError } = await supabase
      .from("locations")
      .insert([
        {
          city,
          category,
          name: areas,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    if (insertError) return { success: false, error: insertError.message };
  }

  revalidatePath("/"); // refresh UI
  return { success: true };
}
