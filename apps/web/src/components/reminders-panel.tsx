"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUserResponse, HabitDto } from "@poc/shared";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/skeleton";
import { enablePushNotifications } from "@/lib/push";
import { vibrate } from "@/lib/vibrate";

export function RemindersPanel() {
  const router = useRouter();
  const [me, setMe] = useState<AuthUserResponse | null>(null);
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await api.me();
        setMe(profile);
        setHabits(await api.listHabits());
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onEnablePush() {
    setPushMsg(null);
    setError(null);
    try {
      await enablePushNotifications();
      setMe(await api.me());
      vibrate(16);
      setPushMsg("Lembretes do navegador ativados.");
    } catch (err) {
      vibrate([20, 40, 20]);
      setPushMsg(err instanceof Error ? err.message : "Não foi possível ativar");
    }
  }

  async function enableAllReminders() {
    setBusy(true);
    setError(null);
    try {
      const updated = await Promise.all(
        habits.map((h) => api.updateHabit(h.id, { remindEnabled: true })),
      );
      setHabits(updated);
      vibrate(16);
    } catch (err) {
      vibrate([20, 40, 20]);
      setError(err instanceof Error ? err.message : "Erro ao ativar lembretes");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRemind(habit: HabitDto, enabled: boolean) {
    setBusy(true);
    try {
      const updated = await api.updateHabit(habit.id, { remindEnabled: enabled });
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
      vibrate(10);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar lembrete");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <Skeleton height={48} />
        <Skeleton height={180} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <header>
        <h1 className="brand" style={{ margin: 0, fontSize: "1.8rem" }}>
          Lembretes
        </h1>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Ative o navegador e escolha quais hábitos devem lembrar você.
          {me?.notificationsEnabled ? " Push ativo nesta sessão." : ""}
        </p>
      </header>

      <div className="panel fade-up" style={{ padding: "1.15rem", display: "grid", gap: "0.85rem" }}>
        <button
          className="btn btn-primary"
          type="button"
          data-testid="enable-push"
          onClick={() => void onEnablePush()}
        >
          Ativar lembretes do navegador
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={busy || habits.length === 0}
          data-testid="remind-all"
          onClick={() => void enableAllReminders()}
        >
          Lembrar todos os hábitos
        </button>
        <Link className="btn btn-ghost" href="/app/acompanhamento" data-testid="link-calendar">
          Ver calendário
        </Link>
        {pushMsg ? <p className="muted" style={{ margin: 0 }}>{pushMsg}</p> : null}
        {error ? <p style={{ margin: 0, color: "#FF8FA3" }}>{error}</p> : null}
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Lembretes por hábito também podem ser ligados no card em Hábitos.
        </p>
      </div>

      <section style={{ display: "grid", gap: "0.65rem" }}>
        {habits.length === 0 ? (
          <p className="muted">Nenhum hábito ainda. Crie em Hábitos.</p>
        ) : (
          habits.map((habit) => (
            <label
              key={habit.id}
              className="panel"
              style={{
                padding: "0.85rem 1rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                borderLeft: `4px solid ${habit.color}`,
              }}
            >
              <input
                type="checkbox"
                checked={habit.remindEnabled}
                disabled={busy}
                data-testid={`habit-remind-${habit.id}`}
                onChange={(e) => void toggleRemind(habit, e.target.checked)}
              />
              <span style={{ fontWeight: 700 }}>{habit.title}</span>
              {habit.remindAtTime ? (
                <span className="badge" style={{ marginLeft: "auto" }}>
                  {habit.remindAtTime}
                </span>
              ) : null}
            </label>
          ))
        )}
      </section>
    </div>
  );
}
