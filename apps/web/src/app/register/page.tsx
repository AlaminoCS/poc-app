import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="shell" style={{ padding: "3rem 0", maxWidth: 480 }}>
      <Link href="/" className="brand" style={{ display: "inline-block", marginBottom: "1.5rem", fontSize: "1.3rem" }}>
        Hábitos
      </Link>
      <AuthForm mode="register" />
    </main>
  );
}
