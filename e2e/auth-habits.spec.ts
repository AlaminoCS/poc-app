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
});
