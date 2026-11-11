import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `e2e.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.com`;
}

test.describe("Hábitos — fluxo principal", () => {
  test("olhinho alterna visibilidade da senha", async ({ page }) => {
    await page.goto("/register");
    const password = page.getByTestId("auth-password");
    const toggle = page.getByTestId("auth-password-toggle");

    await password.fill("SenhaForte1");
    await expect(password).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("cadastro → OTP → hábito → check-in", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaForte1";
    const habitTitle = `Beber água ${Date.now()}`;

    await page.goto("/register");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();

    await expect(page).toHaveURL(/\/verify-otp/);
    await expect(page.getByTestId("otp-code")).not.toHaveValue("");

    await page.getByTestId("otp-submit").click();
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText(email)).toBeVisible();

    await page.getByTestId("habit-title").fill(habitTitle);
    await page.getByTestId("habit-submit").click();
    await expect(page.getByText(habitTitle)).toBeVisible();

    const habitHeading = page.getByText(habitTitle);
    const card = habitHeading.locator("xpath=ancestor::article[1]");
    await card.getByRole("button", { name: `Marcar ${habitTitle}` }).click();
    await expect(card.getByRole("button", { name: `Marcar ${habitTitle}` })).toContainText("✓");
  });

  test("e-mail já cadastrado oferece Entrar e Esqueci a senha", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaForte1";

    await page.goto("/register");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/verify-otp/);

    await page.goto("/register");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();

    await expect(page.getByTestId("auth-error")).toContainText(/já cadastrado/i);
    await expect(page.getByTestId("auth-conflict-login")).toBeVisible();
    await expect(page.getByTestId("auth-conflict-forgot")).toBeVisible();

    await page.getByTestId("auth-conflict-login").click();
    await expect(page).toHaveURL(new RegExp(`/login\\?email=${encodeURIComponent(email)}`));
    await expect(page.getByTestId("auth-email")).toHaveValue(email);
  });

  test("forgot → reset → login → OTP → app", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaForte1";
    const newPassword = "OutraSenha2";

    await page.goto("/register");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();
    await expect(page).toHaveURL(/\/verify-otp/);
    await page.getByTestId("otp-submit").click();
    await expect(page).toHaveURL(/\/app/);

    await page.goto("/forgot-password");
    await page.getByTestId("forgot-email").fill(email);
    await page.getByTestId("forgot-submit").click();

    await expect(page).toHaveURL(/\/reset-password/);
    await expect(page.getByTestId("reset-otp-code")).not.toHaveValue("");
    await page.getByTestId("reset-password").fill(newPassword);
    await page.getByTestId("reset-submit").click();

    await expect(page).toHaveURL(new RegExp(`/login\\?email=${encodeURIComponent(email)}`));
    await expect(page.getByTestId("auth-email")).toHaveValue(email);
    await page.getByTestId("auth-password").fill(newPassword);
    await page.getByTestId("auth-submit").click();

    await expect(page).toHaveURL(/\/verify-otp/);
    await expect(page.getByTestId("otp-code")).not.toHaveValue("");
    await page.getByTestId("otp-submit").click();
    await expect(page).toHaveURL(/\/app/);
  });
});
