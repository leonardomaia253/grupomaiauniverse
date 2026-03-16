import Link from "next/link";

export default function DevNotFound() {
  const accent = "#c8e64a";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg font-pixel uppercase text-warm">
      <div className="text-center">
        <h1 className="text-5xl text-cream">404</h1>
        <p className="mt-4 text-xs text-muted normal-case">
          Esta empresa ainda não foi adicionada ao Maia Universe.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block px-6 py-3 text-sm text-bg transition-all"
          style={{
            backgroundColor: accent,
            boxShadow: "4px 4px 0 0 #5a7a00",
          }}
        >
          Voltar ao Universo
        </Link>
      </div>
    </main>
  );
}
