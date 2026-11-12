import type {
  AuthChallengeResponse,
  AuthUserResponse,
  ConsentInput,
  ContactMessageInput,
  ContactUnlockInput,
  ContactUnlockResponse,
  CreateHabitInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  HabitDto,
  HabitsSummaryResponse,
  LoginInput,
  PushSubscribeInput,
  RegisterInput,
  ResetPasswordInput,
  ResetPasswordResponse,
  UpdateHabitInput,
  UpdateProfileInput,
  ChangePasswordConfirmInput,
  VerifyOtpInput,
} from "@poc/shared";

const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
const API_URL =
  configured === "" || configured === "/" ? "" : configured;

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
      // ignore
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
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
  forgotPassword(input: ForgotPasswordInput) {
    return request<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  resetPassword(input: ResetPasswordInput) {
    return request<ResetPasswordResponse>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  requestChangePassword() {
    return request<AuthChallengeResponse>("/auth/change-password/request", {
      method: "POST",
    });
  },
  confirmChangePassword(input: ChangePasswordConfirmInput) {
    return request<{ message: string }>("/auth/change-password/confirm", {
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
  updateProfile(input: UpdateProfileInput) {
    return request<AuthUserResponse>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  listHabits() {
    return request<HabitDto[]>("/habits");
  },
  habitsSummary(from: string, to: string) {
    return request<HabitsSummaryResponse>(
      `/habits/summary?from=${from}&to=${to}`,
    );
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
  acceptConsent(input: ConsentInput) {
    return request<{ id: string }>("/consent", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  contactUnlock(input: ContactUnlockInput) {
    return request<ContactUnlockResponse>("/contact/unlock", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  contactMessage(input: ContactMessageInput) {
    return request<{ ok: boolean; message?: string }>("/contact/message", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  pushSubscribe(input: PushSubscribeInput) {
    return request<{ ok: boolean }>("/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  pushUnsubscribe(endpoint?: string) {
    return request<{ ok: boolean }>("/notifications/subscribe", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    });
  },
};
