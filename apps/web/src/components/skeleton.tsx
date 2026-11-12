export function Skeleton({
  height = 16,
  width = "100%",
  radius = 12,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <div
      aria-hidden
      className="skeleton-pulse"
      style={{
        height,
        width,
        borderRadius: radius,
        background: "rgba(255,255,255,0.08)",
      }}
    />
  );
}

export function HabitsBoardSkeleton() {
  return (
    <div style={{ display: "grid", gap: "1rem" }} aria-busy="true">
      <span className="sr-only">Carregando...</span>
      <Skeleton height={72} />
      <Skeleton height={220} />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={88} />
      ))}
    </div>
  );
}
