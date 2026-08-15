"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EditorialPageShell from "@/components/EditorialPageShell";

interface PresenceCompany {
  companyLogin: string;
  avatarUrl: string;
  status: string;
  language: string | null;
}

export default function LivePage() {
  const [companies, setCompanies] = useState<PresenceCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresence = () => {
      fetch("/api/presence")
        .then((response) => response.json())
        .then((data) => {
          setCompanies(
            Array.isArray(data.companies)
              ? [...data.companies].sort((a: PresenceCompany, b: PresenceCompany) => a.companyLogin.localeCompare(b.companyLogin))
              : [],
          );
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetchPresence();
    const interval = window.setInterval(fetchPresence, 15_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <EditorialPageShell
      eyebrow="Operação"
      title="Atividade em tempo real"
      intro="Uma leitura simples das operações que optaram por compartilhar presença de desenvolvimento. Nenhum conteúdo de código é coletado."
    >
      <div className="mb-8 flex items-center justify-between border-y border-white/13 py-4 text-sm">
        <span className="flex items-center gap-2 text-white/62"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Atualização automática</span>
        <span className="tabular-nums text-white/38">{companies.length} {companies.length === 1 ? "operação ativa" : "operações ativas"}</span>
      </div>

      {loading ? (
        <p className="py-16 text-sm text-white/40">Consultando atividade…</p>
      ) : companies.length === 0 ? (
        <div className="border border-white/13 p-8 sm:p-12">
          <h2 className="text-2xl tracking-[-.03em]">Nenhuma atividade compartilhada agora.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/48">A ausência de sinal não indica indisponibilidade das empresas; mostra apenas que nenhuma operação está transmitindo presença neste momento.</p>
        </div>
      ) : (
        <div className="border-t border-white/13">
          {companies.map((company, index) => (
            <Link key={company.companyLogin} href={`/?user=${company.companyLogin}`} className="group grid grid-cols-[2rem_2.75rem_1fr_auto] items-center gap-4 border-b border-white/13 py-4 transition hover:bg-white/[.03] sm:px-3">
              <span className="text-[10px] tabular-nums text-white/25">{String(index + 1).padStart(2, "0")}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={company.avatarUrl} alt="" className="h-11 w-11 rounded-full grayscale" />
              <div>
                <p className="text-base text-white/82">{company.companyLogin}</p>
                <p className="mt-1 text-xs text-white/38">{company.language || "Tecnologia não informada"} · {company.status === "idle" ? "em pausa" : "em atividade"}</p>
              </div>
              <span className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white">→</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-14 border-t border-white/13 pt-8">
        <h2 className="text-2xl tracking-[-.03em]">Compartilhamento voluntário</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">A integração exibe somente identificador, estado e linguagem informada. Cada operação controla quando a presença fica ativa.</p>
        <a href="https://marketplace.visualstudio.com/items?itemName=git-Universe.constellationOS" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-full border border-white/18 px-5 py-3 text-xs text-white/70 transition hover:border-white/38 hover:text-white">Conhecer a integração</a>
      </div>
    </EditorialPageShell>
  );
}
