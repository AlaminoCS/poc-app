"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { HabitDto } from "@poc/shared";
import { api } from "@/lib/api/client";

const COLORS = ["#FF4D6D", "#FFD166", "#2EC4B6", "#7B61FF", "#4CC9F0"];

export function HabitsBoard() {
  const router = useRouter();
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api.me();
        setEmail(me.email);
        const list = await api.listHabits();
        setHabits(list);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await api.createHabit({
        title,
        description: description || undefined,
        color,
      });
      setHabits((prev) => [...prev, created]);
      setTitle("");
      setDescription("");
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar hábito");
    }
  }

  async function onToggle(id: string) {
    setBusyId(id);
    try {
      const updated = await api.toggleHabitToday(id);
      setHabits((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar hábito");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      await api.deleteHabit(id);
      setHabits((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setBusyId(null);
    }
  }

  async function onLogout() {
    await api.logout();
    router.replace("/login");
  }

  if (loading) {
    return <p className="muted fade-up">Carregando sua rotina...</p>;
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="brand" style={{ fontSize: "1.8rem" }}>
            Hábitos
          </div>
          <p className="muted" style={{ margin: "0.2rem 0 0" }}>
            Olá, {email}
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => void onLogout()}>
          Sair
        </button>
      </header>

      <form
        className="panel fade-up"
        onSubmit={onCreate}
        style={{ padding: "1.25rem", display: "grid", gap: "0.85rem", animationDelay: "60ms" }}
        data-testid="habit-create-form"
      >
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Novo hábito</h2>
        <label className="field">
          <span>Título</span>
          <input
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="habit-title"
          />
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea
            rows={2}
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Cor ${swatch}`}
              onClick={() => setColor(swatch)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: color === swatch ? "2px solid #fff" : "2px solid transparent",
                background: swatch,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        {error ? <p style={{ margin: 0, color: "#FF8FA3" }}>{error}</p> : null}
        <button className="btn btn-primary" type="submit" data-testid="habit-submit">
          Adicionar
        </button>
      </form>

      <section style={{ display: "grid", gap: "0.85rem" }}>
        {habits.length === 0 ? (
          <p className="muted">Nenhum hábito ainda. Crie o primeiro acima.</p>
        ) : (
          habits.map((habit, index) => (
            <article
              key={habit.id}
              className={`panel fade-up ${habit.checkedToday ? "check-pop" : ""}`}
              style={{
                padding: "1rem 1.1rem",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "0.9rem",
                alignItems: "center",
                animationDelay: `${100 + index * 40}ms`,
                borderLeft: `5px solid ${habit.color}`,
              }}
            >
              <button
                className="btn"
                type="button"
                disabled={busyId === habit.id}
                onClick={() => void onToggle(habit.id)}
                data-testid={`habit-toggle-${habit.id}`}
                aria-label={`Marcar ${habit.title}`}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  padding: 0,
                  background: habit.checkedToday
                    ? `linear-gradient(135deg, ${habit.color}, #fff3)`
                    : "rgba(255,255,255,0.08)",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                {habit.checkedToday ? "✓" : ""}
              </button>
              <div>
                <h3
                  style={{ margin: 0, fontFamily: "var(--font-display)" }}
                  data-testid={`habit-item-${habit.id}`}
                >
                  {habit.title}
                </h3>
                {habit.description ? (
                  <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.92rem" }}>
                    {habit.description}
                  </p>
                ) : null}
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: habit.color }}>
                  Streak: {habit.streak} dia{habit.streak === 1 ? "" : "s"}
                </p>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={busyId === habit.id}
                onClick={() => void onDelete(habit.id)}
              >
                Remover
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
