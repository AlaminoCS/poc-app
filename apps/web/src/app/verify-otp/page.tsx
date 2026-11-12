import { OtpForm } from "@/components/otp-form";
import { SiteChrome } from "@/components/site-chrome";

export default function VerifyOtpPage() {
  return (
    <SiteChrome maxWidth={480} padding="1.5rem 0 3rem">
      <OtpForm />
    </SiteChrome>
  );
}
