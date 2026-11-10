# AGENTS.md — Hábitos POC

Instruções operacionais para agentes de IA neste repositório. Quem analisa o repo: este arquivo é parte do laboratório de colaboração humano + agente.

## Objetivo do produto

POC de **hábitos diários** com autenticação e-mail/senha (Argon2id + pepper), **OTP via Resend a cada login**, API NestJS, UI Next.js, Postgres (Neon/Docker) e deploy Vercel + Docker.

## Arquitetura obrigatória

- Monorepo `pnpm` + Turborepo: `apps/web`, `apps/api`, `packages/db`, `packages/shared`
- Nest: Controller → Service → Repository; DI; sem scripts procedurais longos em controllers
- Next: pages/rotas finas; lógica de API em `src/lib/api`; UI em componentes
- Prisma: schema e migrations só em `packages/db` — nunca `db push` em produção
- E-mail: porta `MailPort` + adapter Resend (não acoplar Resend nos services de domínio)

## Segurança (não negociar)

- Pepper em `PASSWORD_PEPPER` (env); salt nativo do Argon2id
- OTP armazenado **apenas como hash**; TTL curto
- JWT em cookie `HttpOnly` (`access_token`)
- Segredos apenas em `.env` / secrets de deploy — nunca commitados

## Como trabalhar

1. Ler `CONTEXT.md` antes de mudanças amplas
2. Preferir commits semânticos pequenos (`feat:`, `fix:`, `docs:`, `chore:`)
3. Atualizar `docs/LAB.md` quando houver decisão de trade-off relevante
4. Manter PT-BR em UI e docs voltados a quem analisa o repositório
5. Não editar o arquivo de plano em `.cursor/plans`

## Checklist antes de considerar pronto

- [ ] `pnpm build` ok
- [ ] Migrations versionadas
- [ ] Fluxo cadastro → login → OTP → hábitos
- [ ] `.env.example` atualizado
- [ ] Docs de lab coerentes com o código
