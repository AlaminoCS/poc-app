import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="brand" style={{ display: "inline-block", marginBottom: "1.5rem", fontSize: "1.3rem" }}>
        Hábitos
      </Link>
      <ResetPasswordForm />
    </main>
  );
}
