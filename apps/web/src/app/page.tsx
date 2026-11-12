import Link from "next/link";
import { SiteChrome } from "@/components/site-chrome";

export default function HomePage() {
  return (
    <SiteChrome padding="1.5rem 0 3rem">
      <section
        className="fade-up"
        style={{
          display: "grid",
          gap: "1.25rem",
          maxWidth: 720,
          paddingTop: "1.5rem",
        }}
      >
        <p
          className="muted"
          style={{
            margin: 0,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
          }}
        >
          Projeto de hábitos · sem uso comercial
        </p>
        <h1
          className="brand"
          style={{
            margin: 0,
            fontSize: "clamp(2.6rem, 8vw, 5rem)",
            lineHeight: 0.95,
          }}
        >
          Consistência diária, do seu jeito.
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: "1.15rem", maxWidth: 560 }}>
          Cadastre hábitos, marque o dia e acompanhe streaks. É um projeto aberto, sem fins
          comerciais — use à vontade.
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
    </SiteChrome>
  );
}
