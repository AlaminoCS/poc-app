"use client";

import { useState } from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  testId?: string;
  toggleTestId?: string;
};

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  minLength,
  required = true,
  testId = "auth-password",
  toggleTestId = "auth-password-toggle",
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-field">
        <input
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={showPassword}
          data-testid={toggleTestId}
          onClick={() => setShowPassword((current) => !current)}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M9.9 5.1A10.5 10.5 0 0121 12c-.6 1-1.4 2-2.4 2.9M6.1 6.2C4.6 7.4 3.5 8.8 3 12c1.8 4.5 6 7.5 9 7.5 1.4 0 2.8-.4 4.1-1.1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
