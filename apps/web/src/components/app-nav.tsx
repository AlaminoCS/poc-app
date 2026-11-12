"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Hábitos" },
  { href: "/app/acompanhamento", label: "Acompanhamento" },
  { href: "/app/perfil", label: "Perfil" },
  { href: "/contrate-me", label: "Contrate-me" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
        marginBottom: "1.25rem",
      }}
      aria-label="Principal"
    >
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/app" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className="btn btn-ghost"
            data-testid={`nav-${link.label.toLowerCase()}`}
            style={{
              padding: "0.55rem 0.95rem",
              background: active ? "rgba(255,255,255,0.12)" : undefined,
              border: active ? "1px solid rgba(255,255,255,0.25)" : undefined,
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
