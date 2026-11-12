"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { vibrate } from "@/lib/vibrate";

const links = [
  { href: "/app", label: "Hábitos" },
  { href: "/app/acompanhamento", label: "Acompanhamento" },
  { href: "/app/lembretes", label: "Lembretes" },
  { href: "/app/perfil", label: "Perfil" },
  { href: "/contrate-me", label: "Contrate-me" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onLogout() {
    setOpen(false);
    await api.logout();
    router.replace("/login");
  }

  function toggle() {
    vibrate(10);
    setOpen((v) => !v);
  }

  return (
    <div className="app-nav" style={{ position: "relative", zIndex: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <button
          ref={buttonRef}
          type="button"
          className="btn btn-ghost app-nav-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          data-testid="app-menu-toggle"
          onClick={toggle}
          style={{ padding: "0.55rem 0.85rem", minWidth: 48 }}
        >
          <span aria-hidden="true" style={{ fontSize: "1.35rem", lineHeight: 1 }}>
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="app-nav-overlay"
            aria-label="Fechar menu"
            data-testid="app-menu-overlay"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={panelId}
            className="panel app-nav-panel fade-up"
            role="menu"
            data-testid="app-menu"
          >
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/app" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  data-testid={`nav-${link.label.toLowerCase()}`}
                  className="app-nav-link"
                  style={{
                    background: active ? "rgba(255,255,255,0.12)" : undefined,
                  }}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              role="menuitem"
              className="app-nav-link"
              data-testid="nav-sair"
              onClick={() => void onLogout()}
              style={{
                width: "100%",
                border: 0,
                background: "transparent",
                color: "inherit",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 700,
              }}
            >
              Sair
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
