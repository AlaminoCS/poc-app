"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

type Challenge = {
  challengeId: string;
  expiresAt: string;
  email: string;
  debugOtp?: string;
  rememberMe?: boolean;
};

export function OtpForm() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("otpChallenge");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const parsed = JSON.parse(raw) as Challenge;
    setChallenge(parsed);
    if (parsed.debugOtp) {
      setCode(parsed.debugOtp);
    }
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setLoading(true);
    setError(null);
    try {
      await api.verifyOtp({
        challengeId: challenge.challengeId,
        code,
        rememberMe: Boolean(challenge.rememberMe),
      });
      sessionStorage.removeItem("otpChallenge");
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (!challenge) {
    return <p className="muted">Carregando desafio...</p>;
  }

  return (
    <form
      className="panel fade-up"
      onSubmit={onSubmit}
      style={{ padding: "1.75rem", display: "grid", gap: "1rem" }}
      data-testid="otp-form"
    >
      <div>
        <h1 className="brand" style={{ margin: "0 0 0.35rem", fontSize: "2rem" }}>
          Código OTP
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Enviamos um código de 6 dígitos para{" "}
          <strong style={{ color: "var(--ink)" }}>{challenge.email}</strong>.
        </p>
      </div>

      <label className="field">
        <span>OTP</span>
        <input
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          style={{ letterSpacing: "0.35em", fontSize: "1.4rem", fontWeight: 700 }}
          data-testid="otp-code"
        />
      </label>

      {error ? (
        <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="otp-error">
          {error}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        disabled={loading || code.length !== 6}
        type="submit"
        data-testid="otp-submit"
      >
        {loading ? "Validando..." : "Confirmar acesso"}
      </button>
    </form>
  );
}
