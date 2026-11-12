import type { CSSProperties, ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type Props = {
  children: ReactNode;
  /** Largura máxima do conteúdo (ex.: 720). */
  maxWidth?: number | string;
  /**
   * Padding vertical do main.
   * Aceita `1.35rem 0 3rem` (shorthand de 3 valores) ou `1.35rem 3rem` (block).
   * Nunca aplica padding horizontal — o gutter vem de `.shell` / `--shell-gutter`.
   */
  padding?: string;
  className?: string;
  style?: CSSProperties;
};

/** Extrai só o eixo vertical para não zerar o `padding-inline` do `.shell`. */
function toPaddingBlock(padding: string): string {
  const parts = padding.trim().split(/\s+/);
  if (parts.length === 3) return `${parts[0]} ${parts[2]}`;
  if (parts.length === 4) return `${parts[0]} ${parts[2]}`;
  return padding;
}

const SHELL_PAD_INLINE =
  "max(var(--shell-gutter), env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))";

export function SiteChrome({
  children,
  maxWidth,
  padding = "1.35rem 0 3rem",
  className,
  style,
}: Props) {
  const {
    padding: _padding,
    paddingLeft: _paddingLeft,
    paddingRight: _paddingRight,
    paddingInline: _paddingInline,
    ...safeStyle
  } = style ?? {};

  return (
    <div className={`site-chrome ${className ?? ""}`.trim()}>
      <SiteHeader />
      <main
        className="shell site-main"
        style={{
          ...safeStyle,
          paddingBlock: toPaddingBlock(padding),
          // Inline para vencer qualquer shorthand `padding` e garantir gutter real.
          paddingInline: SHELL_PAD_INLINE,
          maxWidth: maxWidth
            ? `min(${typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth}, 100%)`
            : undefined,
        }}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
