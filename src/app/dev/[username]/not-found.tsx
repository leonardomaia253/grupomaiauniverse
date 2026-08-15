import Link from "next/link";

export default function DevNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#eeeae0] px-6 text-[#1c1c18]">
      <div className="text-center">
        <h1 className="text-5xl font-light">404</h1>
        <p className="mt-4 text-sm text-[#6e6b63]">
          Esta empresa ainda não foi adicionada ao Mapa Vivo.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-[#8f8778] px-6 py-3 text-sm transition hover:bg-[#1c1c18] hover:text-[#eeeae0]"
        >
          Voltar ao portfólio
        </Link>
      </div>
    </main>
  );
}
