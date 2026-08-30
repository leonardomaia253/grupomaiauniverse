import Link from "next/link";
import EditorialPageShell from "@/components/EditorialPageShell";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cat?: string; error?: string }>;
}) {
  const params = await searchParams;
  const success = params.success === "true";
  const category = params.cat ?? "all";
  const error = params.error;

  const categoryLabels: Record<string, string> = {
    all: "todas as mensagens",
    social: "notificações de atividade",
    digest: "resumos periódicos",
    marketing: "comunicações institucionais",
    streak_reminders: "lembretes de atividade",
    transactional: "mensagens transacionais",
  };

  return (
    <EditorialPageShell eyebrow="Preferências de comunicação" title="Sua caixa de entrada, sob controle" intro="Confirmação e gestão das mensagens enviadas pelo Grupo Maia.">
      <section className="max-w-2xl border-y border-white/12 py-8">
        {error ? (
          <>
            <p className="text-2xl tracking-[-.03em] text-red-300">Link inválido ou expirado</p>
            <p className="mt-4 text-sm leading-6 text-white/45">
              Solicite um novo link ou gerencie as preferências nas configurações.
            </p>
          </>
        ) : success ? (
          <>
            <p className="text-2xl leading-9 tracking-[-.03em] text-white/80">
              A inscrição foi removida de{" "}
              <strong className="font-normal text-[#b79a6c]">
                {categoryLabels[category] ?? category}
              </strong>
              .
            </p>
            <p className="mt-4 text-sm leading-6 text-white/45">
              As preferências podem ser alteradas novamente a qualquer momento.
            </p>
          </>
        ) : (
          <p className="text-sm leading-6 text-white/45">
            Use o link enviado por e-mail para gerenciar suas preferências.
          </p>
        )}
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center border border-white/15 px-5 text-xs text-white/65 transition hover:border-[#b79a6c] hover:text-white">
          Voltar ao Grupo Maia
        </Link>
      </section>
    </EditorialPageShell>
  );
}
