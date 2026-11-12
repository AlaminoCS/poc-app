import { z } from "zod";

export * from "./habit-schedule";

export const passwordRules = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
  .regex(/[0-9]/, "Inclua ao menos um número");

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: passwordRules,
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid("Challenge inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve ter 6 dígitos"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  challengeId: z.string().uuid("Challenge inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve ter 6 dígitos"),
  newPassword: passwordRules,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .nullable(),
  timezone: z.string().min(1).max(64).optional(),
  notificationsEnabled: z.boolean().optional(),
});

export const changePasswordConfirmSchema = z.object({
  challengeId: z.string().uuid("Challenge inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve ter 6 dígitos"),
  newPassword: passwordRules,
});

export const habitFrequencySchema = z.enum([
  "daily",
  "weekdays",
  "weekly",
  "monthly",
]);

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(280).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  frequency: habitFrequencySchema.optional(),
  weekdays: z.array(z.number().int().min(1).max(7)).optional(),
  monthDay: z.number().int().min(1).max(31).optional().nullable(),
  remindAtTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  remindEnabled: z.boolean().optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const consentSchema = z.object({
  policyVersion: z.string().min(1).max(32),
  anonymousId: z.string().min(1).max(80).optional(),
});

export const contactUnlockSchema = z.object({
  turnstileToken: z.string().min(1),
  website: z.string().optional(),
});

export const contactMessageSchema = z.object({
  unlockToken: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  message: z.string().trim().min(10).max(2000),
  website: z.string().optional(),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordConfirmInput = z.infer<
  typeof changePasswordConfirmSchema
>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type ContactUnlockInput = z.infer<typeof contactUnlockSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

export type HabitDto = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  active: boolean;
  sortOrder: number;
  frequency: "daily" | "weekdays" | "weekly" | "monthly";
  weekdays: number[];
  monthDay: number | null;
  remindAtTime: string | null;
  remindEnabled: boolean;
  dueToday: boolean;
  checkedToday: boolean;
  streak: number;
};

export type DaySummaryStatus = "complete" | "partial" | "empty" | "none";

export type DaySummaryDto = {
  date: string;
  expected: number;
  done: number;
  status: DaySummaryStatus;
  missingHabitIds: string[];
  doneHabitIds: string[];
};

export type HabitsSummaryResponse = {
  from: string;
  to: string;
  days: DaySummaryDto[];
};

export type AuthChallengeResponse = {
  challengeId: string;
  expiresAt: string;
  message: string;
  debugOtp?: string;
};

export type ForgotPasswordResponse = {
  message: string;
  challengeId?: string;
  expiresAt?: string;
  debugOtp?: string;
};

export type ResetPasswordResponse = {
  message: string;
  email: string;
};

export type AuthUserResponse = {
  id: string;
  email: string;
  name: string | null;
  birthDate: string | null;
  timezone: string;
  notificationsEnabled: boolean;
  isBirthdayToday: boolean;
  age: number | null;
};

export type ContactUnlockResponse = {
  unlockToken: string;
  expiresAt: string;
  channels: {
    email: string;
    phone: string;
    whatsappUrl: string;
    portfolioUrl: string;
    linkedinUrl: string;
  };
};
