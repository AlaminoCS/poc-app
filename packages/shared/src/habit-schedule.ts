export type HabitFrequency = "daily" | "weekdays" | "weekly" | "monthly";

export type HabitSchedule = {
  frequency: HabitFrequency;
  weekdays: number[];
  monthDay: number | null;
};

/** Partes de data/hora no fuso informado (Intl). weekday: 1=seg … 7=dom */
export function zonedParts(
  instant: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  dateKey: string;
} {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;

  return {
    year,
    month,
    day,
    hour,
    minute: Number(parts.minute),
    weekday: weekdayMap[parts.weekday] ?? 1,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function dateKeyToUtcDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isHabitDueOn(
  habit: HabitSchedule,
  instantOrKey: Date | string,
  timeZone = "America/Sao_Paulo",
): boolean {
  const parts =
    typeof instantOrKey === "string"
      ? (() => {
          const [y, m, d] = instantOrKey.split("-").map(Number);
          // meio-dia UTC evita edge de DST ao derivar weekday local
          const probe = new Date(Date.UTC(y, m - 1, d, 15, 0, 0));
          return zonedParts(probe, timeZone);
        })()
      : zonedParts(instantOrKey, timeZone);

  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return parts.weekday >= 1 && parts.weekday <= 5;
    case "weekly": {
      const days = habit.weekdays?.length ? habit.weekdays : [];
      return days.includes(parts.weekday);
    }
    case "monthly": {
      const target = habit.monthDay ?? parts.day;
      const lastDay = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
      const effective = Math.min(target, lastDay);
      return parts.day === effective;
    }
    default:
      return true;
  }
}

export function isBirthdayToday(
  birthDate: Date | string | null | undefined,
  timeZone = "America/Sao_Paulo",
  now = new Date(),
): boolean {
  if (!birthDate) return false;
  const birth =
    typeof birthDate === "string"
      ? birthDate.slice(0, 10)
      : birthDate.toISOString().slice(0, 10);
  const [, bm, bd] = birth.split("-").map(Number);
  const today = zonedParts(now, timeZone);
  return today.month === bm && today.day === bd;
}

export function ageFromBirthDate(
  birthDate: Date | string,
  timeZone = "America/Sao_Paulo",
  now = new Date(),
): number {
  const birth =
    typeof birthDate === "string"
      ? birthDate.slice(0, 10)
      : birthDate.toISOString().slice(0, 10);
  const [by, bm, bd] = birth.split("-").map(Number);
  const today = zonedParts(now, timeZone);
  let age = today.year - by;
  if (today.month < bm || (today.month === bm && today.day < bd)) age -= 1;
  return age;
}

export const MIN_USER_AGE = 13;
export const LGPD_POLICY_VERSION = "v1";
