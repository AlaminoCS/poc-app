"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LGPD_POLICY_VERSION } from "@poc/shared";
import { api } from "@/lib/api/client";

const STORAGE_KEY = `habitos.lgpd.${LGPD_POLICY_VERSION}`;

function getAnonymousId() {
  const key = "habitos.anonymousId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function LgpdBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  async function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    try {
      await api.acceptConsent({
        policyVersion: LGPD_POLICY_VERSION,
        anonymousId: getAnonymousId(),
      });
    } catch {
      // banner some mesmo se API falhar; consent local permanece
    }
  }

  if (!visible) return null;

  return (
    <div className="lgpd-banner fade-up" role="dialog" aria-label="Privacidade" data-testid="lgpd-banner">
      <strong style={{ display: "block", marginBottom: "0.45rem" }}>
        Privacidade, cookies e armazenamento local
      </strong>
      <p className="muted" style={{ margin: "0 0 0.85rem", fontSize: "0.92rem", lineHeight: 1.45 }}>
        Este site usa cookies e localStorage (e tecnologias similares) para lembrar preferências,
        manter sessão quando aplicável e melhorar a experiência. Ao aceitar, você consente com esse
        tratamento de dados no seu navegador, em linha com a LGPD. Você pode apagar dados do site
        nas configurações do navegador a qualquer momento.
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link href="/privacidade">Política LGPD e privacidade</Link>
        <button
          className="btn btn-primary"
          type="button"
          data-testid="lgpd-accept"
          onClick={() => void accept()}
          style={{ background: "linear-gradient(135deg, #4cc9f0, #7cffb2)", color: "#07111f" }}
        >
          Aceitar e continuar
        </button>
      </div>
    </div>
  );
}
