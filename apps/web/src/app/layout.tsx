import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hábitos — POC diária",
  description:
    "Laboratório de hábitos diários com Next.js, NestJS, Neon e OTP por e-mail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
