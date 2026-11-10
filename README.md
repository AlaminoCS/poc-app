# Hábitos — POC Lab

Aplicação de hábitos diários usada como **laboratório para recrutadores** verem colaboração humano + agentes de IA.

**Stack:** Next.js · NestJS · Prisma · Neon · Resend · Docker · Vercel

## O que demonstra

- Auth e-mail/senha com **Argon2id + pepper**
- **OTP por e-mail a cada login** (Resend)
- CRUD de hábitos + check-in do dia + streak
- Monorepo tipado (`apps/web`, `apps/api`, `packages/db`, `packages/shared`)
- Migrations Prisma + Docker Compose
- Artefatos de lab: `AGENTS.md`, `CONTEXT.md`, `docs/LAB.md`, `docs/SECURITY.md`, diagrama Excalidraw

## Diagrama

Arquivo editável: [`docs/architecture.excalidraw`](docs/architecture.excalidraw)

Espelho online (export): [excalidraw.com](https://excalidraw.com/#json=XzsrUIVzZQMf9goIaCL9-,kZdEtfR31zSzIpsv6d6tNw)

```text
Recrutador → Next.js (Vercel) → NestJS (Docker) → Neon
                                      ↓
                                   Resend OTP
```

## Subir local

```bash
cp .env.example .env
# preencha RESEND_API_KEY, PASSWORD_PEPPER, JWT_SECRET
# DATABASE_URL pode ser Docker local ou Neon

pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Ou stack completa:

```bash
docker compose up --build
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/health  

## Variáveis

Ver [`.env.example`](.env.example). Segredos nunca vão para o git.

## Lab para recrutadores

1. [`AGENTS.md`](AGENTS.md) — contrato do agente
2. [`CONTEXT.md`](CONTEXT.md) — produto e decisões
3. [`docs/LAB.md`](docs/LAB.md) — diário do processo
4. [`docs/SECURITY.md`](docs/SECURITY.md) — modelo de segurança
5. Histórico git semântico

## Deploy

- **Web:** Vercel → Import `AlaminoCS/poc-app` → Root Directory `apps/web`
  - Install: `cd ../.. && pnpm install`
  - Build: `cd ../.. && pnpm --filter @poc/shared build && pnpm --filter @poc/web build`
  - Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`
- **API:** `docker compose up --build api` (Neon via `DATABASE_URL` / `DIRECT_URL`)
- **DB:** Neon project `poc-habits` (São Paulo) + migration `init_habits`

> Sem domínio verificado no Resend, OTP só chega em `alamino.code.solutions@gmail.com`.
