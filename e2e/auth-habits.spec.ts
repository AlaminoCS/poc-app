import { expect, test } from "@playwright/test";

function uniqueEmail() {
  return `e2e.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.com`;
}

async function dismissLgpd(page: import("@playwright/test").Page) {
  const btn = page.getByTestId("lgpd-accept");
  if (await btn.count()) {
    await btn.click({ timeout: 2000 }).catch(() => undefined);
  }
}

async function registerAndEnterApp(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  rememberMe = false,
) {
  await page.goto("/register");
  await dismissLgpd(page);
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  if (rememberMe) {
    await page.getByTestId("remember-me").check();
  }
  await page.getByTestId("auth-submit").click();
  await expect(page).toHaveURL(/\/verify-otp/);
  await expect(page.getByTestId("otp-code")).not.toHaveValue("");
  await page.getByTestId("otp-submit").click();
  await expect(page).toHaveURL(/\/app/);
}

async function openHabitForm(page: import("@playwright/test").Page) {
  if (await page.getByTestId("habit-create-form").count()) return;
  await page.getByTestId("habit-new").click();
  await expect(page.getByTestId("habit-create-form")).toBeVisible();
}

test.describe("Hábitos v0.3", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("habitos.lgpd.v1", "1");
    });
  });

  test("olhinho alterna visibilidade da senha", async ({ page }) => {
    await page.goto("/register");
    const password = page.getByTestId("auth-password");
    const toggle = page.getByTestId("auth-password-toggle");
    await password.fill("SenhaForte1");
    await expect(password).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
  });

  test("cadastro → OTP → hábito → check-in", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaForte1";
    const habitTitle = `Beber água ${Date.now()}`;
    await registerAndEnterApp(page, email, password);
    await openHabitForm(page);
    await page.getByTestId("habit-title").fill(habitTitle);
    await page.getByTestId("habit-submit").click();
    await expect(page.getByText(habitTitle)).toBeVisible();
    const card = page.getByText(habitTitle).locator("xpath=ancestor::article[1]");
    await card.getByRole("button", { name: `Marcar ${habitTitle}` }).click();
    await expect(card.getByRole("button", { name: `Marcar ${habitTitle}` })).toContainText("✓");
  });

  test("manter conectado → cookie Max-Age longo", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndEnterApp(page, email, "SenhaForte1", true);
    const cookies = await page.context().cookies();
    const access = cookies.find((c) => c.name === "access_token");
    expect(access).toBeTruthy();
    expect(access!.expires).toBeGreaterThan(0);
    const ttlSec = access!.expires - Date.now() / 1000;
    expect(ttlSec).toBeGreaterThanOrEqual(29 * 24 * 60 * 60 - 120);
    await page.reload();
    await expect(page.getByTestId("app-greeting")).toBeVisible();
  });

  test("perfil + birthday + change-password OTP", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndEnterApp(page, email, "SenhaForte1");
    await page.goto("/app/perfil");
    const today = new Date();
    const yyyy = today.getFullYear() - 20;
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    await page.getByTestId("profile-name").fill("Usuário E2E");
    await page.getByTestId("profile-birthdate").fill(`${yyyy}-${mm}-${dd}`);
    await page.getByTestId("profile-save").click();
    await expect(page.getByTestId("profile-info")).toContainText(/atualizado/i);

    await page.goto("/app");
    await expect(page.getByTestId("birthday-banner")).toBeVisible();
    await expect(page.getByTestId("app-greeting")).toContainText("Usuário E2E");

    await page.goto("/app/perfil");
    await page.getByTestId("change-password-request").click();
    await expect(page.getByTestId("change-password-otp")).not.toHaveValue("");
    await page.getByTestId("change-password-new").fill("OutraSenha2");
    await page.getByTestId("change-password-confirm").click();
    await expect(page.getByTestId("profile-info")).toContainText(/Senha atualizada/i);
  });

  test("editar hábito + scroll + frequência weekdays", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndEnterApp(page, email, "SenhaForte1");
    await openHabitForm(page);
    await page.getByTestId("habit-title").fill("Corrida");
    await page.getByTestId("habit-frequency").selectOption("weekdays");
    await page.getByTestId("habit-time").fill("07:30");
    await page.getByTestId("habit-submit").click();
    await expect(page.getByText("Corrida")).toBeVisible();
    const article = page.getByText("Corrida").locator("xpath=ancestor::article[1]");
    await expect(article.getByText("Dias úteis")).toBeVisible();
    await article.getByRole("button", { name: /Ações de/ }).click();
    await expect(page.getByRole("menuitem", { name: "Editar" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await expect(page.getByTestId("habit-create-form")).toBeVisible();
    await expect(page.getByTestId("habit-title")).toBeInViewport();
    await page.getByTestId("habit-title").fill("Corrida matinal");
    await page.getByTestId("habit-submit").click();
    await expect(page.getByText("Corrida matinal")).toBeVisible();
  });

  test("menu hambúrguer + página lembretes", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndEnterApp(page, email, "SenhaForte1");
    await page.getByTestId("app-menu-toggle").click();
    await expect(page.getByTestId("app-menu")).toBeVisible();
    await page.getByTestId("nav-lembretes").click();
    await expect(page).toHaveURL(/\/app\/lembretes/);
    await expect(page.getByTestId("enable-push")).toBeVisible();
  });

  test("calendário de acompanhamento", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndEnterApp(page, email, "SenhaForte1");
    await openHabitForm(page);
    await page.getByTestId("habit-title").fill("Meditar");
    await page.getByTestId("habit-submit").click();
    await page.goto("/app/acompanhamento");
    await expect(page.getByTestId("habits-calendar")).toBeVisible();
    const todayKey = new Date().toISOString().slice(0, 10);
    const cell = page.getByTestId(`cal-day-${todayKey}`);
    if (await cell.count()) {
      await cell.click();
      await expect(page.getByTestId("cal-detail")).toBeVisible();
    }
  });

  test("LGPD banner aceitar", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByTestId("lgpd-banner")).toBeVisible();
    await page.getByTestId("lgpd-accept").click();
    await expect(page.getByTestId("lgpd-banner")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("lgpd-banner")).toHaveCount(0);
    await context.close();
  });

  test("contrate-me unlock com bypass de teste", async ({ page }) => {
    await page.goto("/contrate-me");
    await expect(page.getByTestId("hire-me")).toBeVisible();
    await page.getByTestId("hire-unlock").click();
    await expect(page.getByTestId("hire-channels")).toBeVisible({ timeout: 15_000 });
  });

  test("e-mail já cadastrado oferece Entrar e Esqueci a senha", async ({ page }) => {
    const email = uniqueEmail();
    const password = "SenhaForte1";
    await registerAndEnterApp(page, email, password);
    await page.goto("/register");
    await page.getByTestId("auth-email").fill(email);
    await page.getByTestId("auth-password").fill(password);
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toContainText(/já cadastrado/i);
    await expect(page.getByTestId("auth-conflict-login")).toBeVisible();
  });
});
