"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUserResponse } from "@poc/shared";
import { api } from "@/lib/api/client";
import { PasswordField } from "@/components/password-field";
import { Skeleton } from "@/components/skeleton";

export function ProfileForm() {
  const router = useRouter();
  const [me, setMe] = useState<AuthUserResponse | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | undefined>();

  useEffect(() => {
    void (async () => {
      try {
        const profile = await api.me();
        setMe(profile);
        setName(profile.name ?? "");
        setBirthDate(profile.birthDate ?? "");
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const updated = await api.updateProfile({
        name: name.trim() || null,
        birthDate: birthDate || null,
      });
      setMe(updated);
      setInfo("Perfil atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  async function onRequestOtp() {
    setError(null);
    setInfo(null);
    try {
      const challenge = await api.requestChangePassword();
      setOtpChallengeId(challenge.challengeId);
      setDebugOtp(challenge.debugOtp);
      if (challenge.debugOtp) setOtpCode(challenge.debugOtp);
      setInfo(challenge.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao pedir OTP");
    }
  }

  async function onConfirmPassword(event: FormEvent) {
    event.preventDefault();
    if (!otpChallengeId) return;
    setError(null);
    try {
      const result = await api.confirmChangePassword({
        challengeId: otpChallengeId,
        code: otpCode,
        newPassword,
      });
      setInfo(result.message);
      setOtpChallengeId(null);
      setOtpCode("");
      setNewPassword("");
      setDebugOtp(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao trocar senha");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <Skeleton height={48} />
        <Skeleton height={220} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <form
        className="panel fade-up"
        onSubmit={onSaveProfile}
        style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}
        data-testid="profile-form"
      >
        <div>
          <h1 className="brand" style={{ margin: 0, fontSize: "2rem" }}>
            Seu perfil
          </h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>{me?.email}</p>
        </div>
        <label className="field">
          <span>Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={80}
            data-testid="profile-name"
          />
        </label>
        <label className="field">
          <span>Data de nascimento</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            data-testid="profile-birthdate"
          />
        </label>
        {me?.age != null ? (
          <p className="muted" style={{ margin: 0 }}>
            Idade calculada: {me.age} anos
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" data-testid="profile-save">
          Salvar perfil
        </button>
      </form>

      <form
        className="panel fade-up"
        onSubmit={onConfirmPassword}
        style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}
        data-testid="change-password-form"
      >
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Alterar senha</h2>
        <p className="muted" style={{ margin: 0 }}>
          Enviamos um OTP para o seu e-mail antes de gravar a nova senha.
        </p>
        <button
          className="btn btn-ghost"
          type="button"
          data-testid="change-password-request"
          onClick={() => void onRequestOtp()}
        >
          Enviar código OTP
        </button>
        {otpChallengeId ? (
          <>
            <label className="field">
              <span>OTP</span>
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                data-testid="change-password-otp"
              />
            </label>
            {debugOtp ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                debugOtp: {debugOtp}
              </p>
            ) : null}
            <PasswordField
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              testId="change-password-new"
              toggleTestId="change-password-toggle"
            />
            <button className="btn btn-primary" type="submit" data-testid="change-password-confirm">
              Confirmar nova senha
            </button>
          </>
        ) : null}
      </form>

      {error ? <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="profile-error">{error}</p> : null}
      {info ? <p style={{ margin: 0, color: "#7CFFB2" }} data-testid="profile-info">{info}</p> : null}
    </div>
  );
}
