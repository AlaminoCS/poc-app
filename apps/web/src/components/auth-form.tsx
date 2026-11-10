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
    <form className="panel fade-up" onSubmit={onSubmit} style={{ padding: "1.75rem", display: "grid", gap: "1rem" }}>
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
        />
      </label>

      <label className="field">
        <span>Senha</span>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error ? (
        <p style={{ margin: 0, color: "#FF8FA3" }}>{error}</p>
      ) : null}

      <button className="btn btn-primary" disabled={loading} type="submit">
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
