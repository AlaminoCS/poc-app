import type { CSSProperties, ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Props = {
  children: ReactNode;
  /** Largura máxima do conteúdo (ex.: 720). */
  maxWidth?: number | string;
  /** Padding vertical do main (horizontal vem do gutter do `.shell`). */
  padding?: string;
  className?: string;
  style?: CSSProperties;
};

export function SiteChrome({
  children,
  maxWidth,
  padding = "1.35rem 0 3rem",
  className,
  style,
}: Props) {
  return (
    <div className={`site-chrome ${className ?? ""}`.trim()}>
      <SiteHeader />
      <main
        className="shell site-main"
        style={{
          padding,
          maxWidth: maxWidth
            ? `min(${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth}, 100%)`
            : undefined,
          ...style,
        }}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
