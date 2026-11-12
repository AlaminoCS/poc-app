"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { AuthUserResponse, ContactUnlockResponse } from "@poc/shared";
import { api } from "@/lib/api/client";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          language?: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const PUBLIC = {
  portfolioUrl: "https://vanderlei.alamino.dev.br/",
  linkedinUrl: "https://www.linkedin.com/in/vanderlei-jose-alamino/",
};

export function HireMe() {
  const [token, setToken] = useState("");
  const [unlock, setUnlock] = useState<ContactUnlockResponse | null>(null);
  const [me, setMe] = useState<AuthUserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    void (async () => {
      try {
        const profile = await api.me();
        setMe(profile);
        setName((prev) => prev || profile.name || "");
        setEmail((prev) => prev || profile.email || "");
      } catch {
        setMe(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!siteKey || !widgetRef.current) return;
    let cancelled = false;
    const scriptId = "cf-turnstile";

    const mount = () => {
      if (cancelled || !widgetRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
      widgetRef.current.innerHTML = "";
      setWidgetError(null);
      setToken("");
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        theme: "dark",
        language: "pt-BR",
        callback: (t) => {
          setToken(t);
          setWidgetError(null);
        },
        "error-callback": () => {
          setToken("");
          setWidgetError(
            "A verificação humana falhou. Atualize a página, desative bloqueadores neste site e tente de novo.",
          );
        },
        "expired-callback": () => {
          setToken("");
          setWidgetError("A verificação expirou. Resolva o desafio novamente.");
        },
        "timeout-callback": () => {
          setToken("");
          setWidgetError("Tempo esgotado na verificação. Tente novamente.");
        },
      });
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) mount();
      else existing.addEventListener("load", mount, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = mount;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const turnstileToken =
        token ||
        ((process.env.NODE_ENV !== "production" ||
          process.env.NEXT_PUBLIC_ALLOW_TEST_TURNSTILE === "true") &&
        !siteKey
          ? "test-turnstile-token"
          : token);
      if (!turnstileToken) {
        setError("Complete a verificação humana.");
        return;
      }
      const result = await api.contactUnlock({
        turnstileToken,
        website: honeypot || undefined,
      });
      setUnlock(result);
      setInfo("Verificação ok. Canais liberados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na verificação");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        setToken("");
      }
    }
  }

  async function onMessage(event: FormEvent) {
    event.preventDefault();
    if (!unlock) return;
    setError(null);
    try {
      const result = await api.contactMessage({
        unlockToken: unlock.unlockToken,
        name,
        email,
        message,
        website: honeypot || undefined,
      });
      setInfo(result.message ?? "Mensagem enviada.");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar");
    }
  }

  return (
    <div style={{ display: "grid", gap: "1.35rem" }} data-testid="hire-me">
      <header className="fade-up" style={{ display: "grid", gap: "0.55rem" }}>
        <p
          className="muted"
          style={{
            margin: 0,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.78rem",
          }}
        >
          Aberto a oportunidades
        </p>
        <h1 className="brand" style={{ margin: 0, fontSize: "clamp(2rem, 6vw, 2.75rem)" }}>
          Contrate-me
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: 40 * 16, fontSize: "1.05rem" }}>
          Front-end sênior · React, TypeScript, Next.js. Liberamos e-mail e WhatsApp após
          verificação humana — proteção contra robôs.
        </p>
      </header>

      <section className="hire-links fade-up" data-testid="hire-public-links">
        <a
          className="hire-link-card"
          href={PUBLIC.portfolioUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="hire-link-kicker">Portfólio</span>
          <strong>vanderlei.alamino.dev.br</strong>
        </a>
        <a
          className="hire-link-card"
          href={PUBLIC.linkedinUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="hire-link-kicker">Rede</span>
          <strong>LinkedIn</strong>
        </a>
        <a
          className="hire-link-card"
          href="https://alamino.dev.br/"
          target="_blank"
          rel="noreferrer"
        >
          <span className="hire-link-kicker">Studio</span>
          <strong>Alamino Code Solutions</strong>
        </a>
      </section>

      <form
        className="panel fade-up"
        onSubmit={onUnlock}
        style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}
        data-testid="hire-unlock-form"
      >
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Verificação humana</h2>
        <label className="field" style={{ position: "absolute", left: "-9999px" }} aria-hidden>
          <span>Website</span>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            data-testid="hire-honeypot"
          />
        </label>
        {siteKey ? (
          <div ref={widgetRef} data-testid="hire-turnstile" style={{ minHeight: 65 }} />
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Modo teste: Turnstile site key ausente — use o bypass de laboratório.
          </p>
        )}
        {widgetError ? (
          <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="hire-turnstile-error">
            {widgetError}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" data-testid="hire-unlock">
          Liberar contatos
        </button>
      </form>

      {unlock ? (
        <>
          <section
            className="panel fade-up"
            style={{ padding: "1.25rem", display: "grid", gap: "0.55rem" }}
            data-testid="hire-channels"
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Canais</h2>
            <a href={`mailto:${unlock.channels.email}`}>{unlock.channels.email}</a>
            <a href={unlock.channels.whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp {unlock.channels.phone}
            </a>
          </section>

          <form
            className="panel fade-up"
            onSubmit={onMessage}
            style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}
            data-testid="hire-message-form"
          >
            <div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Enviar mensagem</h2>
              {me ? (
                <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
                  Prefill com seus dados da sessão — edite se quiser.
                </p>
              ) : null}
            </div>
            <label className="field">
              <span>Nome</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="hire-name"
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="hire-email"
              />
            </label>
            <label className="field">
              <span>Mensagem</span>
              <textarea
                required
                minLength={10}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="hire-message"
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Enviar
            </button>
          </form>
        </>
      ) : null}

      {error ? <p style={{ color: "#FF8FA3" }} data-testid="hire-error">{error}</p> : null}
      {info ? <p style={{ color: "#7CFFB2" }} data-testid="hire-info">{info}</p> : null}
    </div>
  );
}
