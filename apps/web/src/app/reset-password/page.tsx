import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteChrome } from "@/components/site-chrome";

export default function ResetPasswordPage() {
  return (
    <SiteChrome maxWidth={480} padding="1.5rem 0 3rem">
      <ResetPasswordForm />
    </SiteChrome>
  );
}
