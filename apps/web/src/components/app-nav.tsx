"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { vibrate } from "@/lib/vibrate";

type NavLink = { href: string; label: string; testId: string };

const AUTH_LINKS: NavLink[] = [
  { href: "/app", label: "Hábitos", testId: "nav-hábitos" },
  { href: "/app/acompanhamento", label: "Acompanhamento", testId: "nav-acompanhamento" },
  { href: "/app/lembretes", label: "Lembretes", testId: "nav-lembretes" },
  { href: "/app/perfil", label: "Perfil", testId: "nav-perfil" },
  { href: "/contrate-me", label: "Contrate-me", testId: "nav-contrate-me" },
  { href: "/privacidade", label: "Privacidade", testId: "nav-privacidade" },
];

const GUEST_LINKS: NavLink[] = [
  { href: "/login", label: "Entrar", testId: "nav-entrar" },
  { href: "/register", label: "Criar conta", testId: "nav-criar-conta" },
  { href: "/contrate-me", label: "Contrate-me", testId: "nav-contrate-me" },
  { href: "/privacidade", label: "Privacidade", testId: "nav-privacidade" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    void (async () => {
      try {
        await api.me();
        setAuthed(true);
      } catch {
        setAuthed(false);
      } finally {
        setReady(true);
      }
    })();
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
    setAuthed(false);
    router.replace("/login");
  }

  function toggle() {
    vibrate(10);
    setOpen((v) => !v);
  }

  const links = authed ? AUTH_LINKS : GUEST_LINKS;

  return (
    <div className="app-nav" style={{ position: "relative", zIndex: 40 }}>
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
            id={panelId}
            className="panel app-nav-panel fade-up"
            role="menu"
            data-testid="app-menu"
          >
            {!ready ? (
              <p className="muted" style={{ margin: 0, padding: "0.65rem 0.95rem" }}>
                Carregando…
              </p>
            ) : null}
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/app" &&
                  link.href !== "/" &&
                  pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  data-testid={link.testId}
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
            {authed ? (
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
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
