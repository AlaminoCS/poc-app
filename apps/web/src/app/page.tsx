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
          POC lab · engenharia com agentes de IA
        </p>
        <h1
          className="brand"
          style={{
            margin: 0,
            fontSize: "clamp(2.8rem, 8vw, 5.2rem)",
            lineHeight: 0.95,
          }}
        >
          Consistência diária com segurança de verdade.
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: "1.15rem", maxWidth: 560 }}>
          Cadastre hábitos, marque o dia e acompanhe streaks. Login com Argon2id + pepper e OTP por e-mail a cada acesso.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          <Link className="btn btn-primary pulse-glow" href="/register">
            Começar agora
          </Link>
          <Link className="btn btn-ghost" href="/login">
            Já tenho conta
          </Link>
        </div>
      </section>
    </main>
  );
}
