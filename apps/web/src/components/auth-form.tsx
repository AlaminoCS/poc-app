"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api/client";
import { PasswordField } from "@/components/password-field";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setConflict(false);
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
          rememberMe,
        }),
      );
      router.push("/verify-otp");
    } catch (err) {
      if (mode === "register" && err instanceof ApiError && err.status === 409) {
        setConflict(true);
        setError("E-mail já cadastrado. Entre ou redefina a senha.");
      } else {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      }
    } finally {
      setLoading(false);
    }
  }

  const emailQuery = encodeURIComponent(email.trim());

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

      <PasswordField
        label="Senha"
        value={password}
        onChange={setPassword}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        minLength={8}
        testId="auth-password"
        toggleTestId="auth-password-toggle"
      />

      <label
        style={{
          display: "inline-flex",
          gap: "0.5rem",
          alignItems: "center",
          color: "var(--muted)",
          fontSize: "0.95rem",
        }}
      >
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          data-testid="remember-me"
        />
        Manter conectado (até 30 dias após o OTP)
      </label>

      {error ? (
        <div data-testid="auth-error" style={{ display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, color: "#FF8FA3" }}>{error}</p>
          {conflict ? (
            <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
              <Link href={`/login?email=${emailQuery}`} data-testid="auth-conflict-login">
                Entrar com este e-mail
              </Link>
              {" · "}
              <Link
                href={`/forgot-password?email=${emailQuery}`}
                data-testid="auth-conflict-forgot"
              >
                Esqueci a senha
              </Link>
            </p>
          ) : null}
        </div>
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
            {" · "}
            <Link href={email ? `/forgot-password?email=${emailQuery}` : "/forgot-password"}>
              Esqueci a senha
            </Link>
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
