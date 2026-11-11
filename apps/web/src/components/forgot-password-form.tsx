"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await api.forgotPassword({ email });
      setInfo(result.message);
      if (result.challengeId && result.expiresAt) {
        sessionStorage.setItem(
          "resetChallenge",
          JSON.stringify({
            challengeId: result.challengeId,
            expiresAt: result.expiresAt,
            email,
            debugOtp: result.debugOtp,
          }),
        );
        router.push("/reset-password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="panel fade-up"
      onSubmit={onSubmit}
      style={{ padding: "1.75rem", display: "grid", gap: "1rem" }}
      data-testid="forgot-password-form"
    >
      <div>
        <h1 className="brand" style={{ margin: "0 0 0.35rem", fontSize: "2rem" }}>
          Esqueci a senha
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Enviamos um OTP para o e-mail cadastrado, se ele existir.
        </p>
      </div>

      <label className="field">
        <span>E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="forgot-email"
        />
      </label>

      {error ? (
        <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="forgot-error">
          {error}
        </p>
      ) : null}
      {info ? (
        <p style={{ margin: 0, color: "#7CFFB2" }} data-testid="forgot-info">
          {info}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        disabled={loading}
        type="submit"
        data-testid="forgot-submit"
      >
        {loading ? "Enviando..." : "Enviar código"}
      </button>

      <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
        Lembrou a senha? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
