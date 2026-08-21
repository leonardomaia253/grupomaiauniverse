import Link from "next/link";

export default function EditorialPageShell({
  eyebrow,
  title,
  intro,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="maia-editorial-shell relative min-h-screen overflow-hidden bg-[#12110f] text-[#eee9df]">
      <header className="relative z-20 border-b border-white/10 bg-[#12110f]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="maia-wordmark" aria-label="Grupo Maia — início"><span>MAIA</span><small>Grupo</small></Link>
          <nav className="flex items-center gap-5 text-[11px] text-white/55" aria-label="Navegação principal">
            <Link className="transition hover:text-white" href="/">Empresas</Link>
            <Link className="transition hover:text-white" href="/intro">Apresentação</Link>
            <Link className="hidden transition hover:text-white sm:block" href="/support">Contato</Link>
          </nav>
        </div>
      </header>
      <div className={`relative z-10 mx-auto ${wide ? "max-w-7xl" : "max-w-4xl"} px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:px-12`}>
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#bda57e]">{eyebrow}</p>
          <h1 className="mt-4 text-5xl font-normal leading-[.94] tracking-[-.055em] text-[#f2eee6] sm:text-7xl">{title}<span className="ml-2 text-[#b79a6c]">.</span></h1>
          {intro && <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">{intro}</p>}
        </div>
        <div className="mt-14">{children}</div>
      </div>
      <footer className="relative z-10 border-t border-white/10 bg-[#12110f]/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>Grupo Maia · Mapa Vivo</span>
          <div className="flex gap-5"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div>
        </div>
      </footer>
    </main>
  );
}

export function EditorialSection({
  index,
  title,
  children,
}: {
  index?: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-t border-white/13 py-7 sm:grid-cols-[3rem_14rem_1fr] sm:gap-6">
      <span className="text-[10px] tabular-nums text-white/28">{index ? String(index).padStart(2, "0") : ""}</span>
      <h2 className="text-lg font-normal tracking-[-.02em] text-white/82">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-white/52">{children}</div>
    </section>
  );
}
