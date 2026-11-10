# Hábitos — POC Lab

Aplicação de hábitos diários usada como **laboratório de engenharia com agentes de IA** (Cursor). O objetivo não é só “um CRUD online”: é deixar auditável *como* humano e agente colaboraram, quais decisões foram tomadas e por que certas medidas de arquitetura/segurança valem a pena.

**Stack:** Next.js · NestJS · Prisma · Neon · Resend · Docker · Vercel  
**Repo:** [AlaminoCS/poc-app](https://github.com/AlaminoCS/poc-app) · **Web:** [poc.alamino.dev.br](https://poc.alamino.dev.br)

## Para quem analisa este repositório

Se você está revisando o código, o processo ou o uso de agentes, leia nesta ordem:

1. Este `README.md` — visão rápida, colaboração e como rodar
2. [`CONTEXT.md`](CONTEXT.md) — produto, stack e restrições
3. [`AGENTS.md`](AGENTS.md) — contrato operacional do agente (o que ele pode/deve fazer)
4. [`docs/LAB.md`](docs/LAB.md) — diário da interação humano ↔ agente e trade-offs
5. [`docs/SECURITY.md`](docs/SECURITY.md) — modelo de segurança (pepper, OTP, cookies)
6. [`docs/architecture.excalidraw`](docs/architecture.excalidraw) / [`docs/architecture.svg`](docs/architecture.svg) — desenho da arquitetura
7. Histórico git — commits semânticos pequenos como evidência de processo

## Como trabalhamos (humano + agente)

O humano define intenção, restrições e critérios de pronto. O agente executa implementação, scaffolding, docs e smoke checks dentro desse contrato. Nada crítico fica só no chat: decisões viram arquivos versionados.

| Etapa | Papel humano | Papel agente | Resultado |
|-------|--------------|--------------|-----------|
| Escopo | Modo Plan: stack, OTP a cada login, Neon, Vercel, artefatos de lab | Estrutura o plano e confirma ambiguidades | Escopo fechado antes do código |
| Bootstrap | Repo GitHub vazio + autonomia de execução no Cursor | Monorepo `pnpm` + Turborepo (`web` / `api` / `db` / `shared`) | Base tipada e buildável |
| Domínio | Exigiu Nest + Next **não procedural** | Controllers finos, services, repositories, ports | Camadas legíveis para revisão humana |
| Segurança | Argon2id + pepper, OTP em todo login, secrets fora do git | Implementação + `SECURITY.md` | Demo defensável, não só “login funciona” |
| Infra | Contas Neon / Vercel / Resend | Migrations, Docker, env de exemplo, deploy web | Caminho reproduzível |
| Narrativa | Pediu lab legível para análise do repo | `AGENTS.md`, rules, `LAB.md`, diagramas | Próximo revisor (ou agente) herda o contexto |

### Por que essa forma de interação

- **Contrato escrito** (`AGENTS.md` + `CONTEXT.md` + `.cursor/rules`) reduz improvisação e alucinação de arquitetura
- **Commits pequenos e semânticos** mostram o ritmo real da sessão (não um dump único)
- **Diário em `LAB.md`** explica *por quê*, não só *o quê* — útil em revisão técnica e em handoff
- **Humano no loop** nos pontos de produto/segurança; agente na execução mecânica e na consistência

### Vantagens das medidas adotadas

- **Monorepo tipado** — um schema Prisma e schemas Zod compartilhados reduzem drift entre front e API
- **Nest modular + DI** — integrações (Resend) ficam atrás de ports; domínio permanece testável e legível
- **Migrations versionadas** — histórico auditável; `migrate deploy` no boot do container evita schema “à mão”
- **Argon2id + pepper** — salt nativo do Argon2 + segredo de servidor; vazamento do banco sozinho não basta
- **OTP a cada login** — trade-off consciente de UX em troca de prova prática de segundo fator por e-mail
- **OTP só como hash** — o código em claro nunca persiste; challenge com TTL curto
- **Cookie HttpOnly** — mitiga XSS para token de sessão; `Secure` em produção
- **Artefatos de agente** — próximo agente (ou quem analisa o repo) herda o mesmo contrato sem “memória oral”

## O que a POC demonstra

- Cadastro/login com e-mail e senha
- OTP via Resend após senha válida
- CRUD de hábitos + check-in do dia + streak
- Tema vibrante (CSS variables, motion leve)

## Arquitetura

```text
Quem analisa o repo → Next.js (Vercel) → NestJS (Docker) → Neon Postgres
                                           ↓
                                        Resend OTP
```

## Subir local

```bash
cp .env.example .env
# preencha RESEND_API_KEY, PASSWORD_PEPPER, JWT_SECRET
# DATABASE_URL: Neon ou Postgres do Docker Compose

pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Stack completa:

```bash
docker compose up --build
```

- Web: http://localhost:3000  
- API: http://localhost:3001/api/health  

## Variáveis de ambiente

Ver [`.env.example`](.env.example). Nada sensível no git.

| Variável | Onde | Papel |
|----------|------|--------|
| `DATABASE_URL` / `DIRECT_URL` | API / Neon | Pool + migrate |
| `PASSWORD_PEPPER` | API | Pepper do hash |
| `JWT_SECRET` | API | Assinatura do cookie |
| `RESEND_API_KEY` / `RESEND_FROM` | API | Envio de OTP |
| `CORS_ORIGIN` | API | Origem do front |
| `NEXT_PUBLIC_API_URL` | Web (Vercel) | Base da API |
| `NEXT_PUBLIC_APP_URL` | Web (Vercel) | URL pública do app |
| `COOKIE_SECURE` | API | `true` em HTTPS |

> Sem domínio verificado no Resend, OTP de teste só chega no e-mail da conta Resend.  
> A API em produção precisa de URL pública; `NEXT_PUBLIC_API_URL=http://localhost:3001` só serve para smoke local com a API rodando na sua máquina.

## Deploy

- **Web (Vercel):** projeto `poc-app`, root `apps/web`
  - Install: `cd ../.. && pnpm install`
  - Build: `cd ../.. && pnpm --filter @poc/shared build && pnpm --filter @poc/web build`
  - Envs atuais do front: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`
- **API:** imagem Docker (`apps/api/Dockerfile`) com `prisma migrate deploy` no boot
- **DB:** Neon project `poc-habits` (São Paulo) — schema sincronizado via migration `init_habits`

## Estado atual da infra (lab)

| Peça | Status |
|------|--------|
| Neon `poc-habits` | Branch principal com schema e dados de smoke (users / habits / challenges) |
| Vercel web | Projeto importado de `AlaminoCS/poc-app` → [poc.alamino.dev.br](https://poc.alamino.dev.br) (`poc-app-drab.vercel.app`) |
| API pública | Ainda via Docker local; apontar `NEXT_PUBLIC_API_URL` para um host público quando a API estiver exposta |
