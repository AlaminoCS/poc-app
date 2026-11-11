"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await api.register({ email, password });
      }
      const challenge = await api.login({ email, password });
      sessionStorage.setItem(
        "otpChallenge",
        JSON.stringify({
          challengeId: challenge.challengeId,
          expiresAt: challenge.expiresAt,
          email,
          debugOtp: challenge.debugOtp,
        }),
      );
      router.push("/verify-otp");
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
      data-testid={`auth-form-${mode}`}
    >
      <div>
        <h1 className="brand" style={{ margin: "0 0 0.35rem", fontSize: "2rem" }}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {mode === "login"
            ? "Após a senha, enviamos um OTP para o seu e-mail."
            : "Senha forte + OTP em todo login."}
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
          data-testid="auth-email"
        />
      </label>

      <label className="field">
        <span>Senha</span>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="auth-password"
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            data-testid="auth-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M9.9 5.1A10.5 10.5 0 0121 12c-.6 1-1.4 2-2.4 2.9M6.1 6.2C4.6 7.4 3.5 8.8 3 12c1.8 4.5 6 7.5 9 7.5 1.4 0 2.8-.4 4.1-1.1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {error ? (
        <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="auth-error">
          {error}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        disabled={loading}
        type="submit"
        data-testid="auth-submit"
      >
        {loading ? "Aguarde..." : mode === "login" ? "Continuar" : "Cadastrar e continuar"}
      </button>

      <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
        {mode === "login" ? (
          <>
            Novo por aqui? <Link href="/register">Criar conta</Link>
          </>
        ) : (
          <>
            Já tem conta? <Link href="/login">Entrar</Link>
          </>
        )}
      </p>
    </form>
  );
}
