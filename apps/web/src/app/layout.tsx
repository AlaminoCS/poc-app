import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hábitos",
  description:
    "Projeto de hábitos diários, sem uso comercial. Cadastre hábitos, marque o dia e acompanhe streaks — use à vontade.",
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
