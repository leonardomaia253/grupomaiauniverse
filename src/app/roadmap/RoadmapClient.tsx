import { ROADMAP_PHASES } from "@/lib/roadmap-data";
import EditorialPageShell from "@/components/EditorialPageShell";

const statusLabel = { done: "Concluído", active: "Em desenvolvimento", planned: "Planejado" } as const;

export default function RoadmapClient() {
  const total = ROADMAP_PHASES.reduce((sum, phase) => sum + phase.items.length, 0);
  const done = ROADMAP_PHASES.reduce((sum, phase) => sum + phase.items.filter((item) => item.status === "done").length, 0);

  return (
    <EditorialPageShell eyebrow="Produto" title="Evolução da plataforma" intro="O que já foi entregue, o que está em desenvolvimento e quais frentes permanecem planejadas para o Mapa Vivo." wide>
      <div className="mb-14 flex items-end justify-between border-y border-white/13 py-5">
        <p className="text-sm text-white/48">Progresso documentado</p>
        <p className="text-3xl tracking-[-.04em] text-white/82">{done}<span className="text-base text-white/30"> / {total}</span></p>
      </div>
      <div className="border-t border-white/13">
        {ROADMAP_PHASES.map((phase, phaseIndex) => (
          <section key={phase.id} className="grid gap-5 border-b border-white/13 py-8 lg:grid-cols-[4rem_16rem_1fr]">
            <span className="text-[10px] tabular-nums text-white/25">{String(phaseIndex + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="text-2xl tracking-[-.03em] text-white/84">{phase.title}</h2>
              <p className="mt-2 text-xs text-white/35">{phase.quarter}</p>
              <span className="mt-4 inline-flex rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-[#c5aa7d]">{statusLabel[phase.status]}</span>
            </div>
            <ul>
              {phase.items.map((item) => (
                <li key={item.id} className="grid grid-cols-[1rem_1fr_auto] gap-3 border-b border-white/10 py-3 last:border-0">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${item.status === "done" ? "bg-[#c5aa7d]" : "border border-white/25"}`} />
                  <span><strong className="block text-sm font-normal text-white/70">{item.name}</strong>{item.description && <small className="mt-1 block text-xs leading-5 text-white/35">{item.description}</small>}</span>
                  <span className="text-[10px] text-white/28">{statusLabel[item.status]}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </EditorialPageShell>
  );
}
