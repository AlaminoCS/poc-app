"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { PasswordField } from "@/components/password-field";

type Challenge = {
  challengeId: string;
  expiresAt: string;
  email: string;
  debugOtp?: string;
};

export function ResetPasswordForm() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("resetChallenge");
    if (!raw) {
      router.replace("/forgot-password");
      return;
    }
    const parsed = JSON.parse(raw) as Challenge;
    setChallenge(parsed);
    if (parsed.debugOtp) setCode(parsed.debugOtp);
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.resetPassword({
        challengeId: challenge.challengeId,
        code,
        newPassword,
      });
      sessionStorage.removeItem("resetChallenge");
      router.push(`/login?email=${encodeURIComponent(result.email)}`);
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
      data-testid="reset-password-form"
    >
      <div>
        <h1 className="brand" style={{ margin: "0 0 0.35rem", fontSize: "2rem" }}>
          Nova senha
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Código enviado para{" "}
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
          data-testid="reset-otp-code"
        />
      </label>

      <PasswordField
        label="Nova senha"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
        minLength={8}
        testId="reset-password"
        toggleTestId="reset-password-toggle"
      />

      {error ? (
        <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="reset-error">
          {error}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        disabled={loading || code.length !== 6}
        type="submit"
        data-testid="reset-submit"
      >
        {loading ? "Salvando..." : "Atualizar senha"}
      </button>

      <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
        <Link href="/forgot-password">Pedir outro código</Link>
      </p>
    </form>
  );
}
