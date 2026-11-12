import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell" style={{ padding: "3rem 0 4rem" }}>
      <header
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        <div className="brand" style={{ fontSize: "1.5rem" }}>
          Hábitos
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link className="btn btn-ghost" href="/login">
            Entrar
          </Link>
          <Link className="btn btn-primary" href="/register">
            Criar conta
          </Link>
        </div>
      </header>

      <section
        className="fade-up"
        style={{
          display: "grid",
          gap: "1.25rem",
          maxWidth: 720,
          animationDelay: "80ms",
        }}
      >
        <p className="muted" style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
          Projeto de hábitos · sem uso comercial
        </p>
        <h1
          className="brand"
          style={{
            margin: 0,
            fontSize: "clamp(2.8rem, 8vw, 5.2rem)",
            lineHeight: 0.95,
          }}
        >
          Consistência diária, do seu jeito.
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: "1.15rem", maxWidth: 560 }}>
          Cadastre hábitos, marque o dia e acompanhe streaks. É um projeto aberto, sem fins comerciais — use à vontade.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <Link className="btn btn-primary pulse-glow" href="/register">
            Começar agora
          </Link>
          <Link className="btn btn-ghost" href="/login">
            Já tenho conta
          </Link>
          <Link className="btn btn-ghost" href="/contrate-me">
            Contrate-me
          </Link>
          <Link className="btn btn-ghost" href="/privacidade">
            Privacidade
          </Link>
        </div>
      </section>
    </main>
  );
}
