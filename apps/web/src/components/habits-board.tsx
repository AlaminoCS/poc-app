"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUserResponse, HabitDto, HabitFrequency } from "@poc/shared";
import { api } from "@/lib/api/client";
import { HabitsBoardSkeleton } from "@/components/skeleton";
import { vibrate } from "@/lib/vibrate";

const COLORS = ["#FF4D6D", "#FFD166", "#2EC4B6", "#7B61FF", "#4CC9F0"];
const WEEKDAYS = [
  { v: 1, l: "Seg" },
  { v: 2, l: "Ter" },
  { v: 3, l: "Qua" },
  { v: 4, l: "Qui" },
  { v: 5, l: "Sex" },
  { v: 6, l: "Sáb" },
  { v: 7, l: "Dom" },
];

const FREQ_LABEL: Record<HabitFrequency, string> = {
  daily: "Diário",
  weekdays: "Dias úteis",
  weekly: "Semanal",
  monthly: "Mensal",
};

type Draft = {
  title: string;
  description: string;
  color: string;
  frequency: HabitFrequency;
  weekdays: number[];
  monthDay: number;
  remindAtTime: string;
  remindEnabled: boolean;
};

const emptyDraft = (): Draft => ({
  title: "",
  description: "",
  color: COLORS[0],
  frequency: "daily",
  weekdays: [1, 2, 3, 4, 5],
  monthDay: 1,
  remindAtTime: "08:00",
  remindEnabled: false,
});

export function HabitsBoard() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [me, setMe] = useState<AuthUserResponse | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [scrollFormNonce, setScrollFormNonce] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await api.me();
        setMe(profile);
        const list = await api.listHabits();
        setHabits(list);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!menuOpenId) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.(`[data-habit-menu="${menuOpenId}"]`)) return;
      setMenuOpenId(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpenId]);

  useEffect(() => {
    if (!scrollFormNonce) return;
    const el = formRef.current;
    if (!el) return;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const smoothScrollTo = (node: HTMLElement, durationMs = 820) => {
      const top = node.getBoundingClientRect().top + window.scrollY - 24;
      const start = window.scrollY;
      const delta = top - start;
      if (Math.abs(delta) < 2) return;
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        window.scrollTo(0, start + delta * easeInOutCubic(t));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const timer = window.setTimeout(() => {
      smoothScrollTo(el, 820);
      window.setTimeout(() => {
        el.querySelector<HTMLInputElement>("[data-testid=habit-title]")?.focus({
          preventScroll: true,
        });
      }, 420);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [scrollFormNonce]);

  function fillDraft(habit?: HabitDto) {
    if (!habit) {
      setDraft(emptyDraft());
      setEditingId(null);
      setFormOpen(false);
      return;
    }
    setEditingId(habit.id);
    setFormOpen(true);
    setDraft({
      title: habit.title,
      description: habit.description ?? "",
      color: habit.color,
      frequency: habit.frequency,
      weekdays: habit.weekdays.length ? habit.weekdays : [1],
      monthDay: habit.monthDay ?? 1,
      remindAtTime: habit.remindAtTime ?? "08:00",
      remindEnabled: habit.remindEnabled,
    });
    setScrollFormNonce((n) => n + 1);
  }

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
    setScrollFormNonce((n) => n + 1);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      title: draft.title,
      description: draft.description || undefined,
      color: draft.color,
      frequency: draft.frequency,
      weekdays: draft.frequency === "weekly" ? draft.weekdays : [],
      monthDay: draft.frequency === "monthly" ? draft.monthDay : null,
      remindAtTime: draft.remindAtTime || null,
      remindEnabled: draft.remindEnabled,
    };
    try {
      if (editingId) {
        const updated = await api.updateHabit(editingId, payload);
        setHabits((prev) => prev.map((h) => (h.id === editingId ? updated : h)));
      } else {
        const created = await api.createHabit(payload);
        setHabits((prev) => [...prev, created]);
      }
      vibrate(16);
      fillDraft();
    } catch (err) {
      vibrate([20, 40, 20]);
      setError(err instanceof Error ? err.message : "Erro ao salvar hábito");
    }
  }

  async function onToggle(id: string) {
    setBusyId(id);
    try {
      const updated = await api.toggleHabitToday(id);
      setHabits((prev) => prev.map((item) => (item.id === id ? updated : item)));
      vibrate(updated.checkedToday ? 18 : 10);
    } catch (err) {
      vibrate([20, 40, 20]);
      setError(err instanceof Error ? err.message : "Erro ao marcar hábito");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setMenuOpenId(null);
    setBusyId(id);
    try {
      await api.deleteHabit(id);
      setHabits((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) fillDraft();
      vibrate([12, 30, 12]);
    } catch (err) {
      vibrate([20, 40, 20]);
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleRemind(habit: HabitDto, enabled: boolean) {
    setBusyId(habit.id);
    try {
      const updated = await api.updateHabit(habit.id, { remindEnabled: enabled });
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
      vibrate(10);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <HabitsBoardSkeleton />;

  const greeting = me?.name || me?.email || "";
  const showForm = formOpen || Boolean(editingId);

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header className="fade-up">
        <p className="muted" style={{ margin: 0 }} data-testid="app-greeting">
          Olá, {greeting}
        </p>
        <h1 className="brand" style={{ margin: "0.2rem 0 0", fontSize: "1.65rem" }}>
          Seus hábitos de hoje
        </h1>
      </header>

      {me?.isBirthdayToday ? (
        <div className="birthday-banner" data-testid="birthday-banner">
          <strong>Feliz aniversário{me.name ? `, ${me.name}` : ""}!</strong>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Que seu dia seja leve — e seus hábitos, celebrados.
          </p>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", alignItems: "center" }}>
        <button
          className="btn btn-primary"
          type="button"
          data-testid="habit-new"
          onClick={openCreate}
          style={{ padding: "0.65rem 1.1rem" }}
        >
          Novo hábito
        </button>
      </div>

      <section style={{ display: "grid", gap: "0.85rem" }} data-testid="habits-list">
        {habits.length === 0 ? (
          <p className="muted">Nenhum hábito ainda. Crie o primeiro.</p>
        ) : (
          habits.map((habit, index) => (
            <article
              key={habit.id}
              className={`panel fade-up habit-card ${habit.checkedToday ? "check-pop" : ""} ${menuOpenId === habit.id ? "habit-card-menu-open" : ""}`}
              style={{
                padding: "1rem 1.1rem",
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: "0.9rem",
                alignItems: "center",
                animationDelay: `${40 + index * 40}ms`,
                borderLeft: `5px solid ${habit.color}`,
                opacity: habit.dueToday ? 1 : 0.72,
              }}
            >
              <button
                className="btn"
                type="button"
                disabled={busyId === habit.id || !habit.dueToday}
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
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
                  <span className="badge">{FREQ_LABEL[habit.frequency]}</span>
                  {habit.remindAtTime ? <span className="badge">{habit.remindAtTime}</span> : null}
                  <span className="badge" style={{ color: habit.color }}>
                    Streak {habit.streak}
                  </span>
                  {!habit.dueToday ? <span className="badge">Fora do dia</span> : null}
                </div>
                <label
                  style={{
                    display: "inline-flex",
                    gap: "0.4rem",
                    alignItems: "center",
                    marginTop: "0.55rem",
                    fontSize: "0.85rem",
                    color: "var(--muted)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={habit.remindEnabled}
                    disabled={busyId === habit.id}
                    data-testid={`habit-remind-${habit.id}`}
                    onChange={(e) => void toggleRemind(habit, e.target.checked)}
                  />
                  Lembrete
                </label>
              </div>
              <div
                data-habit-menu={habit.id}
                style={{ position: "relative" }}
              >
                <button
                  className="btn btn-ghost"
                  type="button"
                  aria-label={`Ações de ${habit.title}`}
                  aria-expanded={menuOpenId === habit.id}
                  data-testid={`habit-menu-${habit.id}`}
                  onClick={() => {
                    vibrate(8);
                    setMenuOpenId((id) => (id === habit.id ? null : habit.id));
                  }}
                  style={{ padding: "0.45rem 0.7rem", minWidth: 42 }}
                >
                  ⋯
                </button>
                {menuOpenId === habit.id ? (
                  <div
                    className="panel habit-kebab"
                    role="menu"
                    data-testid={`habit-menu-panel-${habit.id}`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="habit-kebab-item"
                      data-testid={`habit-edit-${habit.id}`}
                      onClick={() => {
                        setMenuOpenId(null);
                        fillDraft(habit);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="habit-kebab-item"
                      disabled={busyId === habit.id}
                      data-testid={`habit-delete-${habit.id}`}
                      onClick={() => void onDelete(habit.id)}
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      {showForm ? (
        <form
          ref={formRef}
          className="panel fade-up habit-form-anchor"
          onSubmit={onSubmit}
          style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}
          data-testid="habit-create-form"
        >
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)" }}>
            {editingId ? "Editar hábito" : "Novo hábito"}
          </h2>
          <label className="field">
            <span>Título</span>
            <input
              required
              maxLength={80}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              data-testid="habit-title"
            />
          </label>
          <label className="field">
            <span>Descrição</span>
            <textarea
              rows={2}
              maxLength={280}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </label>
          <label className="field">
            <span>Frequência</span>
            <select
              value={draft.frequency}
              onChange={(e) =>
                setDraft((d) => ({ ...d, frequency: e.target.value as HabitFrequency }))
              }
              data-testid="habit-frequency"
            >
              <option value="daily">Diário</option>
              <option value="weekdays">Dias úteis</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </label>
          {draft.frequency === "weekly" ? (
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {WEEKDAYS.map((day) => {
                const on = draft.weekdays.includes(day.v);
                return (
                  <button
                    key={day.v}
                    type="button"
                    className="btn btn-ghost"
                    style={{
                      padding: "0.4rem 0.7rem",
                      background: on ? "rgba(255,255,255,0.16)" : undefined,
                    }}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        weekdays: on
                          ? d.weekdays.filter((x) => x !== day.v)
                          : [...d.weekdays, day.v],
                      }))
                    }
                  >
                    {day.l}
                  </button>
                );
              })}
            </div>
          ) : null}
          {draft.frequency === "monthly" ? (
            <label className="field">
              <span>Dia do mês</span>
              <input
                type="number"
                min={1}
                max={31}
                value={draft.monthDay}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, monthDay: Number(e.target.value) || 1 }))
                }
              />
            </label>
          ) : null}
          <label className="field">
            <span>Cor</span>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: draft.color === c ? "2px solid #fff" : "2px solid transparent",
                    background: c,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </label>
          <label className="field">
            <span>Horário do lembrete</span>
            <input
              type="time"
              value={draft.remindAtTime}
              onChange={(e) => setDraft((d) => ({ ...d, remindAtTime: e.target.value }))}
              data-testid="habit-time"
            />
          </label>
          <label
            style={{
              display: "inline-flex",
              gap: "0.45rem",
              alignItems: "center",
              color: "var(--muted)",
            }}
          >
            <input
              type="checkbox"
              checked={draft.remindEnabled}
              onChange={(e) => setDraft((d) => ({ ...d, remindEnabled: e.target.checked }))}
              data-testid="habit-remind-enabled"
            />
            Ativar lembrete neste hábito
          </label>
          {error ? (
            <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="habit-error">
              {error}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="submit" data-testid="habit-submit">
              {editingId ? "Salvar" : "Criar"}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => fillDraft()}
              data-testid="habit-cancel"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {error && !showForm ? (
        <p style={{ margin: 0, color: "#FF8FA3" }} data-testid="habit-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
