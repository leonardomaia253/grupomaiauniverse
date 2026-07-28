import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";

/** Server-side Supabase client with cookie-based auth (for Server Components & Route Handlers) */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    getPublicSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in Server Components (read-only).
            // This is fine — the middleware handles cookie refresh.
          }
        },
      },
    }
  );
}
