"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DaySummaryDto, HabitDto } from "@poc/shared";
import { api } from "@/lib/api/client";
import { AppNav } from "@/components/app-nav";
import { Skeleton } from "@/components/skeleton";

function monthBounds(year: number, monthIndex: number) {
  const from = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
  const last = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const to = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to, last };
}

export function HabitsCalendar() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [days, setDays] = useState<DaySummaryDto[]>([]);
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await api.me();
        const { from, to } = monthBounds(year, month);
        const [summary, list] = await Promise.all([
          api.habitsSummary(from, to),
          api.listHabits(),
        ]);
        setDays(summary.days);
        setHabits(list);
        setSelected(null);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [year, month, router]);

  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const { last } = monthBounds(year, month);
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  // JS Sun=0 → shift to Mon-first empty slots
  const pad = (firstWeekday + 6) % 7;
  const selectedDay = selected ? byDate.get(selected) : null;
  const habitMap = useMemo(() => new Map(habits.map((h) => [h.id, h])), [habits]);

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  const title = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <Skeleton height={48} />
        <Skeleton height={360} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }} data-testid="habits-calendar">
      <AppNav />
      <header
        className="panel fade-up"
        style={{
          padding: "1.25rem 1.4rem",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="brand" style={{ margin: 0, fontSize: "2rem", textTransform: "capitalize" }}>
            {title}
          </h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Veja os dias em que você fechou a rotina — e onde faltou um check.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-ghost" type="button" onClick={() => shiftMonth(-1)}>
            Anterior
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => shiftMonth(1)}>
            Próximo
          </button>
        </div>
      </header>

      <div className="panel fade-up" style={{ padding: "1.1rem" }}>
        <div
          className="cal-grid"
          style={{ marginBottom: "0.55rem", color: "var(--muted)", fontSize: "0.8rem" }}
        >
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
            <div key={d} style={{ textAlign: "center" }}>
              {d}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {Array.from({ length: pad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: last }).map((_, i) => {
            const day = i + 1;
            const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const summary = byDate.get(date);
            const status = summary?.status ?? "none";
            return (
              <button
                key={date}
                type="button"
                className={`cal-cell is-${status}${selected === date ? " is-selected" : ""}`}
                data-testid={`cal-day-${date}`}
                onClick={() => setSelected(date)}
              >
                <strong>{day}</strong>
                {summary && summary.expected > 0 ? (
                  <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>
                    {summary.done}/{summary.expected}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: "var(--muted)",
          }}
        >
          <span className="badge is-complete" style={{ background: "rgba(46,196,182,0.25)" }}>
            Completo
          </span>
          <span className="badge" style={{ background: "rgba(255,209,102,0.25)" }}>
            Parcial
          </span>
          <span className="badge" style={{ background: "rgba(255,77,109,0.22)" }}>
            Vazio
          </span>
          <span className="badge">Sem hábitos previstos</span>
        </div>
      </div>

      <aside className="panel fade-up" style={{ padding: "1.25rem" }} data-testid="cal-detail">
        {!selectedDay ? (
          <p className="muted" style={{ margin: 0 }}>
            Toque em um dia para ver o que foi cumprido e o que faltou.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>{selected}</h2>
            <p className="muted" style={{ margin: 0 }}>
              {selectedDay.done} de {selectedDay.expected} hábitos previstos
            </p>
            <div>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>Cumpridos</h3>
              {selectedDay.doneHabitIds.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  Nenhum
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {selectedDay.doneHabitIds.map((id) => (
                    <li key={id}>{habitMap.get(id)?.title ?? id}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>Faltaram</h3>
              {selectedDay.missingHabitIds.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  Nada pendente
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {selectedDay.missingHabitIds.map((id) => (
                    <li key={id}>{habitMap.get(id)?.title ?? id}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {error ? <p style={{ color: "#FF8FA3" }}>{error}</p> : null}
      </aside>
    </div>
  );
}
