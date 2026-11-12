# Hábitos — POC Lab

**Versão:** `0.2.0`

Aplicação de hábitos diários usada como **laboratório de engenharia com agentes de IA** (Cursor). O objetivo não é só “um CRUD online”: é deixar auditável *como* humano e agente colaboraram, quais decisões foram tomadas e por que certas medidas de arquitetura/segurança valem a pena.

**Stack:** Next.js · NestJS · Prisma · Neon · Resend · Web Push · Cloudflare Turnstile · Docker · Vercel  
**Repo:** [AlaminoCS/poc-app](https://github.com/AlaminoCS/poc-app) · **Web:** [poc.alamino.dev.br](https://poc.alamino.dev.br)

## Novidades 0.2.0

- Perfil com nome e `birthDate` (idade mínima 13 — LGPD); banner **Feliz aniversário**
- Troca de senha logada com confirmação **OTP**
- Edição de hábitos; frequência (diário / dias úteis / semanal / mensal); horário de lembrete
- Calendário de acompanhamento (somente leitura) com status completo/parcial/vazio
- Web Push + lembretes (cron diário Vercel + tick a cada 5 min via GitHub Actions)
- Skeletons de loading
- Página **/contrate-me** com Turnstile + honeypot + rate limit (PII mascarada até unlock)
- Banner LGPD + **/privacidade** + `ConsentEvent` versionado

## Para quem analisa este repositório

1. Este `README.md` — visão rápida, versão e como rodar  
2. [`CONTEXT.md`](CONTEXT.md) — produto, stack e restrições  
3. [`AGENTS.md`](AGENTS.md) — contrato operacional do agente  
4. [`docs/LAB.md`](docs/LAB.md) — diário e trade-offs  
5. [`docs/SECURITY.md`](docs/SECURITY.md) — pepper, OTP, push, Turnstile, LGPD  
6. Diagramas em `docs/` · histórico git semântico  

## Como trabalhamos (humano + agente)

O humano define intenção, restrições e critérios de pronto. O agente executa implementação, scaffolding, docs e smoke checks dentro desse contrato. Nada crítico fica só no chat: decisões viram arquivos versionados. Entregas grandes seguem **E2E da fatia → push → smoke em produção**.

## O que a POC demonstra

- Cadastro/login com e-mail e senha + OTP via Resend  
- Perfil, reset/change-password com OTP  
- Hábitos com frequência, horário, edição, check-in e streak  
- Calendário de cumprimento  
- Lembretes Web Push  
- Contrate-me protegido + LGPD  

## Arquitetura

```text
Quem analisa o repo → Next.js + Nest (Vercel Services) → Neon Postgres
                         ↓                    ↓
                      Web Push cron        Resend OTP / contato
                         ↓
                   Cloudflare Turnstile
```

## Subir local

```bash
cp .env.example .env
# preencha secrets (Resend, pepper, JWT, VAPID, Turnstile, CONTACT_HMAC_SECRET, CRON_SECRET)

pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/health  
- E2E: `pnpm test:e2e`

## Variáveis de ambiente

Ver [`.env.example`](.env.example).

| Variável | Papel |
|----------|--------|
| `DATABASE_URL` / `DIRECT_URL` | Neon / Postgres |
| `PASSWORD_PEPPER` / `JWT_SECRET` | Auth |
| `RESEND_API_KEY` / `RESEND_FROM` | OTP e contato |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push |
| `CRON_SECRET` | Protege `/api/internal/reminders/tick` |
| `TURNSTILE_*` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Anti-bot |
| `CONTACT_HMAC_SECRET` | Unlock token de contato |
| `NEXT_PUBLIC_APP_URL` | URL pública |

## Deploy

Monorepo na Vercel com **Services** (`vercel.json`: web Next + API container). Lembretes: cron diário no Hobby + GitHub Actions `*/5` em `/api/internal/reminders/tick` (Hobby não permite cron Vercel mais frequente). Domínio: [poc.alamino.dev.br](https://poc.alamino.dev.br).
