"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { AppNav } from "@/components/app-nav";

export function SiteHeader() {
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    void (async () => {
      try {
        await api.me();
        setHomeHref("/app");
      } catch {
        setHomeHref("/");
      }
    })();
  }, []);

  return (
    <header className="site-header" data-testid="site-header">
      <div className="shell site-header-inner">
        <Link
          href={homeHref}
          className="brand site-logo"
          data-testid="site-logo"
          aria-label={homeHref === "/app" ? "Ir para hábitos" : "Ir para a home"}
        >
          Hábitos
        </Link>
        <AppNav />
      </div>
    </header>
  );
}
