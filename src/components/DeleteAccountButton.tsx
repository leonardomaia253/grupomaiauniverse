"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Não foi possível concluir a solicitação.");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-red-400/40 px-4 py-2 text-xs text-red-300 transition-colors hover:bg-red-500/10"
      >
        Excluir conta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#211f1b] p-7 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-light">Excluir conta</h2>
            <p className="mt-4 text-sm leading-6 text-white/55">
              Esta ação remove permanentemente a conta, o perfil da empresa e os
              dados associados armazenados pela plataforma.
            </p>
            <p className="mt-3 text-sm text-red-300">
              A ação não pode ser desfeita.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-300">{error}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-full border border-red-400/50 px-4 py-2.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                {loading ? "Excluindo…" : "Confirmar exclusão"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/65 transition-colors hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
