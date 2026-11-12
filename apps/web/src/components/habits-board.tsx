"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUserResponse, HabitDto, HabitFrequency } from "@poc/shared";
import { api } from "@/lib/api/client";
import { AppNav } from "@/components/app-nav";
import { HabitsBoardSkeleton } from "@/components/skeleton";
import { enablePushNotifications } from "@/lib/push";

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
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [me, setMe] = useState<AuthUserResponse | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

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

  function fillDraft(habit?: HabitDto) {
    if (!habit) {
      setDraft(emptyDraft());
      setEditingId(null);
      return;
    }
    setEditingId(habit.id);
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
      fillDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar hábito");
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
      if (editingId === id) fillDraft();
    } catch (err) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    } finally {
      setBusyId(null);
    }
  }

  async function enableAllReminders() {
    setError(null);
    try {
      const updated = await Promise.all(
        habits.map((h) => api.updateHabit(h.id, { remindEnabled: true })),
      );
      setHabits(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar lembretes");
    }
  }

  async function onEnablePush() {
    setPushMsg(null);
    try {
      await enablePushNotifications();
      const profile = await api.me();
      setMe(profile);
      setPushMsg("Lembretes do navegador ativados.");
    } catch (err) {
      setPushMsg(err instanceof Error ? err.message : "Não foi possível ativar");
    }
  }

  async function onLogout() {
    await api.logout();
    router.replace("/login");
  }

  if (loading) return <HabitsBoardSkeleton />;

  const greeting = me?.name || me?.email || "";

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <AppNav />
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
          <p className="muted" style={{ margin: "0.2rem 0 0" }} data-testid="app-greeting">
            Olá, {greeting}
          </p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => void onLogout()}>
          Sair
        </button>
      </header>

      {me?.isBirthdayToday ? (
        <div className="birthday-banner" data-testid="birthday-banner">
          <strong>Feliz aniversário{me.name ? `, ${me.name}` : ""}!</strong>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Que seu dia seja leve — e seus hábitos, celebrados.
          </p>
        </div>
      ) : null}

      <div className="panel fade-up" style={{ padding: "1rem 1.15rem", display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn btn-primary"
            type="button"
            data-testid="enable-push"
            onClick={() => void onEnablePush()}
          >
            Ativar lembretes do navegador
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => void enableAllReminders()}>
            Lembrar todos os hábitos
          </button>
          <Link className="btn btn-ghost" href="/app/acompanhamento">
            Ver calendário
          </Link>
        </div>
        {pushMsg ? <p className="muted" style={{ margin: 0 }}>{pushMsg}</p> : null}
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Escolha hábitos específicos no card (interruptores de lembrete) ou ative todos de uma vez.
        </p>
      </div>

      <form
        className="panel fade-up"
        onSubmit={onSubmit}
        style={{ padding: "1.25rem", display: "grid", gap: "0.85rem", animationDelay: "60ms" }}
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
                    background: on ? "rgba(46,196,182,0.25)" : undefined,
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
          <span>Horário do lembrete</span>
          <input
            type="time"
            value={draft.remindAtTime}
            onChange={(e) => setDraft((d) => ({ ...d, remindAtTime: e.target.value }))}
            data-testid="habit-time"
          />
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={draft.remindEnabled}
            onChange={(e) => setDraft((d) => ({ ...d, remindEnabled: e.target.checked }))}
            data-testid="habit-remind-enabled"
          />
          Lembrar este hábito
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Cor ${swatch}`}
              onClick={() => setDraft((d) => ({ ...d, color: swatch }))}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: draft.color === swatch ? "2px solid #fff" : "2px solid transparent",
                background: swatch,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        {error ? <p style={{ margin: 0, color: "#FF8FA3" }}>{error}</p> : null}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" data-testid="habit-submit">
            {editingId ? "Salvar alterações" : "Adicionar"}
          </button>
          {editingId ? (
            <button className="btn btn-ghost" type="button" onClick={() => fillDraft()}>
              Cancelar
            </button>
          ) : null}
        </div>
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
              <div style={{ display: "grid", gap: "0.4rem" }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  data-testid={`habit-edit-${habit.id}`}
                  onClick={() => fillDraft(habit)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busyId === habit.id}
                  onClick={() => void onDelete(habit.id)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
