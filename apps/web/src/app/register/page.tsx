import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { SiteChrome } from "@/components/site-chrome";

export default function RegisterPage() {
  return (
    <SiteChrome maxWidth={480} padding="1.5rem 0 3rem">
      <Suspense fallback={<p className="muted">Carregando...</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </SiteChrome>
  );
}
