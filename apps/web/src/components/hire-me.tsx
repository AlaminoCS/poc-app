"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ContactUnlockResponse } from "@poc/shared";
import { api } from "@/lib/api/client";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
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
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    if (!siteKey || !widgetRef.current) return;
    const scriptId = "cf-turnstile";
    const mount = () => {
      if (!widgetRef.current || !window.turnstile) return;
      widgetRef.current.innerHTML = "";
      window.turnstile.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (t) => setToken(t),
        "error-callback": () => setToken(""),
      });
    };
    if (document.getElementById(scriptId)) {
      mount();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = mount;
    document.body.appendChild(script);
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
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar");
    }
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }} data-testid="hire-me">
      <header className="panel fade-up" style={{ padding: "1.6rem" }}>
        <p className="muted" style={{ margin: 0 }}>
          Aberto a oportunidades
        </p>
        <h1 className="brand" style={{ margin: "0.35rem 0", fontSize: "2.4rem" }}>
          Contrate-me
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: 52 * 16 }}>
          Front-end sênior · React, TypeScript, Next.js. Complete a verificação humana para liberar
          e-mail e WhatsApp — proteção contra robôs e disparos automáticos.
        </p>
      </header>

      <section
        className="panel fade-up"
        style={{ padding: "1.25rem", display: "grid", gap: "0.75rem" }}
      >
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Links públicos</h2>
        <a href={PUBLIC.portfolioUrl} target="_blank" rel="noreferrer">
          Portfólio — vanderlei.alamino.dev.br
        </a>
        <a href={PUBLIC.linkedinUrl} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <Link href="/">Voltar à home</Link>
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
        {siteKey ? <div ref={widgetRef} /> : (
          <p className="muted" style={{ margin: 0 }}>
            Modo teste: Turnstile site key ausente — use o bypass de laboratório.
          </p>
        )}
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
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Enviar mensagem</h2>
            <label className="field">
              <span>Nome</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
