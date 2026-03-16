import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import SignInButton from "./sign-in-button";

export const metadata: Metadata = {
  title: "Shop - Maia Universe",
  description: "Customize your planet in Maia Universe with effects, structures and more",
};

const ACCENT = "#c8e64a";

export default async function ShopLanding() {
  // If user is logged in and has a claimed planet, redirect to their shop
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const username = (
      user.user_metadata?.user_name ??
      user.user_metadata?.preferred_username ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      ""
    ).toLowerCase();

    if (username) {
      const sb = getSupabaseAdmin();
      const { data: record } = await sb
        .from("companies")
        .select("username, claimed")
        .eq("username", username)
        .single();

      if (record?.claimed) {
        redirect(`/shop/${record.username}`);
      }
    }
  }

  return (
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <div className="mx-auto max-w-lg px-3 py-6 sm:px-4 sm:py-10">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
        >
          &larr; Back to Universe
        </Link>

        <div className="border-[3px] border-border bg-bg-raised p-6 sm:p-10">
          <h1 className="text-center text-xl text-cream sm:text-2xl">
            Maia Universe <span style={{ color: ACCENT }}>Shop</span>
          </h1>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted normal-case">
            Customize your planet with effects, structures and identity items.
            Make your planet stand out in the Universe.
          </p>

          {/* How it works */}
          <div className="mt-6 space-y-3">
            <h2 className="text-xs" style={{ color: ACCENT }}>
              How it works
            </h2>
            <div className="space-y-4 text-xs text-muted normal-case italic text-center">
              <p>Sign-in is no longer required for regular users.</p>
              <p>Explore all planets and constellations freely.</p>
            </div>
          </div>

          {/* Free Universe Message */}
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-cream normal-case">
              The Universe is now free and open to explore.
            </p>
            {!user && (
              <Link
                href="/auth"
                className="mt-2 text-[10px] text-muted hover:text-cream underline"
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>

        {/* Creator credit */}
        <div className="mt-10 border-t border-border/50 pt-4 text-center">
          <p className="text-[9px] text-muted normal-case">
            built by{" "}
            <a
              href="https://x.com/leonardomaia253"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
              style={{ color: ACCENT }}
            >
              @leonardomaia253
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
