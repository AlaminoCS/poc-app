import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
    .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
    .regex(/[0-9]/, "Inclua ao menos um número"),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid("Challenge inválido"),
  code: z.string().regex(/^\d{6}$/, "OTP deve ter 6 dígitos"),
});

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(280).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export type HabitDto = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  active: boolean;
  sortOrder: number;
  checkedToday: boolean;
  streak: number;
};

export type AuthChallengeResponse = {
  challengeId: string;
  expiresAt: string;
  message: string;
  /** Só presente quando ALLOW_TEST_OTP=true (E2E/local). */
  debugOtp?: string;
};

export type AuthUserResponse = {
  id: string;
  email: string;
};
