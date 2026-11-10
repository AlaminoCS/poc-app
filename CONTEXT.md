# CONTEXT.md — Hábitos POC

## Produto

Aplicação de **lista de tarefas/hábitos diários**: o usuário cadastra hábitos, marca o dia e acompanha streak.

Público desta POC: **recrutadores** avaliando capacidade de orquestrar agentes de IA, arquitetura e segurança prática.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js (App Router) + React + Tailwind |
| API | NestJS (módulos, DI, Passport JWT) |
| DB | PostgreSQL via Neon (prod) / Docker (dev) |
| ORM | Prisma + migrations versionadas |
| E-mail | Resend (OTP a cada login) |
| Deploy | Vercel (web) + Docker (API) |

## Decisões de produto

- OTP **obrigatório em todo login** após senha válida (demo de segurança consciente de UX)
- Senha: Argon2id + pepper em variável de ambiente
- Idioma: PT-BR

## Glossário

- **Challenge**: registro `LoginChallenge` que guarda o hash do OTP até expirar/consumir
- **Pepper**: segredo de servidor concatenado à senha antes do hash
- **Streak**: dias consecutivos com check-in (UTC)

## Fora de escopo (POC)

- OAuth social, MFA app authenticator, billing, mobile nativo, multi-tenant
