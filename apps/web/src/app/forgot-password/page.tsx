import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SiteChrome } from "@/components/site-chrome";

export default function ForgotPasswordPage() {
  return (
    <SiteChrome maxWidth={480} padding="1.5rem 0 3rem">
      <Suspense fallback={<p className="muted">Carregando...</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </SiteChrome>
  );
}
