import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="brand" style={{ display: "inline-block", marginBottom: "1.5rem", fontSize: "1.3rem" }}>
        Hábitos
      </Link>
      <Suspense fallback={<p className="muted">Carregando...</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
