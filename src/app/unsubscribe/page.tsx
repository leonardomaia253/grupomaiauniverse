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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#eeeae0",
        fontFamily: "Arial, sans-serif",
        color: "#1c1c18",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 440,
          textAlign: "center",
          background: "#eeeae0",
          padding: "40px 32px",
          border: "1px solid #b8b0a0",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            letterSpacing: 4,
            color: "#74664d",
            marginTop: 0,
          }}
        >
          MAIA
        </h1>

        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, transparent, #c8e64a, transparent)",
            margin: "20px 0",
          }}
        />

        {error ? (
          <>
            <p style={{ fontSize: 18, color: "#8d3e35" }}>Link inválido ou expirado</p>
            <p style={{ color: "#666", fontSize: 14 }}>
              Solicite um novo link ou gerencie as preferências nas configurações.
            </p>
          </>
        ) : success ? (
          <>
            <p style={{ fontSize: 18 }}>
              A inscrição foi removida de{" "}
              <strong style={{ color: "#74664d" }}>
                {categoryLabels[category] ?? category}
              </strong>
              .
            </p>
            <p style={{ color: "#666", fontSize: 14 }}>
              As preferências podem ser alteradas novamente a qualquer momento.
            </p>
          </>
        ) : (
          <p style={{ color: "#666", fontSize: 14 }}>
            Use o link enviado por e-mail para gerenciar suas preferências.
          </p>
        )}

        <div
          style={{
            height: 2,
            background: "linear-gradient(90deg, transparent, #1c1c20, transparent)",
            margin: "20px 0",
          }}
        />

        <a
          href="https://universe.grupomaia.me"
          style={{ color: "#74664d", fontSize: 14, textDecoration: "underline" }}
        >
          Voltar ao Mapa Vivo
        </a>
      </div>
    </div>
  );
}
