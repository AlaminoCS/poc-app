import Link from "next/link";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.3.1";

export function SiteFooter() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="shell site-footer-inner">
        <div className="site-footer-copy">
          <p>
            <span>© {new Date().getFullYear()} Vanderlei José Alamino · construído com </span>
            <span className="site-footer-accent">
              Next.js · React · TypeScript · Tailwind CSS
            </span>
          </p>
          <p>
            <span>Feito com ❤️ por </span>
            <a
              href="https://alamino.dev.br/"
              target="_blank"
              rel="noreferrer"
              className="site-footer-accent"
            >
              Alamino Code Solutions
            </a>
          </p>
        </div>
        <div className="site-footer-meta">
          <span className="site-footer-dot" aria-hidden />
          <Link href="/" className="site-footer-version">
            v{APP_VERSION}
          </Link>
        </div>
      </div>
    </footer>
  );
}
