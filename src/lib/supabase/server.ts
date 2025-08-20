import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Extend the type so TS knows about "set"
interface MutableCookies {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  console.log(
    "🔍 [createServerSupabaseClient] Incoming cookies:",
    cookieStore.getAll()
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = cookieStore.getAll();
          console.log("📦 [Supabase getAll] Cookies passed:", all);
          return all;
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            // Narrow the type instead of casting to any
            const maybeMutable =
              cookieStore as unknown as Partial<MutableCookies>;

            if (typeof maybeMutable.set === "function") {
              cookiesToSet.forEach(({ name, value, options }) =>
                maybeMutable.set!(name, value, options)
              );
              console.log("✅ [setAll] Cookies merged:", cookiesToSet);
            }
          } catch (err) {
            console.warn("⚠️ [setAll] Skipped (immutable context)", err);
          }
        },
      },
    }
  );
}
