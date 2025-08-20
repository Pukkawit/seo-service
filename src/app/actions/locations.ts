"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLocations(formData: FormData) {
  const city = formData.get("city")?.toString().trim();
  const areasString = formData.get("areas")?.toString().trim();
  // Expecting areas as JSON string: '["Area 1","Area 2"]'
  const category = formData.get("category")?.toString().trim();

  if (!city || !areasString || !category) {
    return { success: false, error: "All fields are required" };
  }

  let areas: string[] = [];
  try {
    areas = JSON.parse(areasString);
  } catch (err) {
    console.log(err);
    return { success: false, error: "Invalid areas format" };
  }

  const supabase = await createServerSupabaseClient();

  // Prepare multiple rows for insertion
  const rows = areas.map((name) => ({
    city,
    name,
    category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("locations").insert(rows);

  if (error) {
    console.error(error);
    return { success: false, error: error.message };
  }

  revalidatePath("/"); // optional: refresh UI cache
  return { success: true };
}
