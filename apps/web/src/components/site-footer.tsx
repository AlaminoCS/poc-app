import Link from "next/link";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.3.1";

export function SiteFooter() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="shell site-footer-inner">
        <div className="site-footer-copy">
          <p>
            © {new Date().getFullYear()} Vanderlei José Alamino
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            construído com{" "}
            <span className="site-footer-stack">
              Next.js · NestJS · Prisma · Neon · Resend · Vercel
            </span>
          </p>
          <p>
            Feito com{" "}
            <span className="site-footer-heart" aria-hidden>
              ❤️
            </span>{" "}
            por{" "}
            <a
              href="https://alamino.dev.br/"
              target="_blank"
              rel="noreferrer"
              className="site-footer-brand"
            >
              Alamino Code Solutions
            </a>
          </p>
        </div>
        <Link href="/" className="site-footer-version" title="Versão do app">
          v{APP_VERSION}
        </Link>
      </div>
    </footer>
  );
}
