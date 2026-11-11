import type {
  AuthChallengeResponse,
  AuthUserResponse,
  CreateHabitInput,
  HabitDto,
  LoginInput,
  RegisterInput,
  UpdateHabitInput,
  VerifyOtpInput,
} from "@poc/shared";

/**
 * Em produção usamos URL relativa (same-origin) para evitar CORS:
 * o Next faz rewrite de `/api/*` para a API Nest (API_URL).
 * Em dev, NEXT_PUBLIC_API_URL=http://localhost:3001 continua válido.
 */
const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const API_URL =
  configured === "" || configured === "/"
    ? ""
    : configured;

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = "Falha na requisição";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(input: RegisterInput) {
    return request<AuthUserResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login(input: LoginInput) {
    return request<AuthChallengeResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  verifyOtp(input: VerifyOtpInput) {
    return request<AuthUserResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout() {
    return request<{ ok: boolean }>("/auth/logout", { method: "POST" });
  },
  me() {
    return request<AuthUserResponse>("/auth/me");
  },
  listHabits() {
    return request<HabitDto[]>("/habits");
  },
  createHabit(input: CreateHabitInput) {
    return request<HabitDto>("/habits", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateHabit(id: string, input: UpdateHabitInput) {
    return request<HabitDto>(`/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteHabit(id: string) {
    return request<{ ok: boolean }>(`/habits/${id}`, { method: "DELETE" });
  },
  toggleHabitToday(id: string) {
    return request<HabitDto>(`/habits/${id}/toggle-today`, { method: "POST" });
  },
};
