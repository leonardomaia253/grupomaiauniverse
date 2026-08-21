"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase";
import { hasPublicSupabaseConfig } from "@/lib/env";

interface Props {
  companyLogin: string;
  claimed: boolean;
}

export default function ClaimButton({ companyLogin, claimed }: Props) {
  const [isClaimed, setIsClaimed] = useState(claimed);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const accent = "#b89a62";

  useEffect(() => {
    if (!hasPublicSupabaseConfig()) return;
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) return;
      const login = (
        user.user_metadata.user_name ??
        user.user_metadata.preferred_username ??
        ""
      ).toLowerCase();
      setIsOwner(login === companyLogin.toLowerCase());
    });
  }, [companyLogin]);

  if (isClaimed) {
    return (
      <div
        className="inline-block rounded-full border px-3 py-1 text-[10px]"
        style={{ borderColor: accent, color: accent }}
      >
        Perfil verificado
      </div>
    );
  }

  if (!isOwner) return null;

  async function handleClaim() {
    setLoading(true);
    try {
      const res = await fetch("/api/claim", { method: "POST" });
      if (res.ok) setIsClaimed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClaim}
      disabled={loading}
      className="rounded-full px-5 py-2.5 text-xs text-[#171714] disabled:opacity-40"
      style={{ backgroundColor: accent }}
    >
      {loading ? "Confirmando…" : "Verificar perfil"}
    </button>
  );
}

