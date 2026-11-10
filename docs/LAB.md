# LAB.md — Diário do laboratório com agentes

POC construída como evidência de colaboração humano + agente (Cursor) para recrutadores.

## Contexto

- Repo inicial: `poc-app` vazio (`# poc-app`)
- Objetivo: hábitos diários + auth segura + Neon + Vercel + narrativa de processo

## Decisões tomadas com o agente

| Decisão | Por quê |
|---------|--------|
| Monorepo pnpm + Turborepo | Separar web/api/db/shared sem perder tipagem |
| Nest modular + repositories | Evitar procedural; DI e camadas claras |
| Argon2id + pepper | Demo de defesa em profundidade no hash |
| OTP a cada login (Resend) | Requisito explícito da POC para segurança visível |
| Prisma migrations | Histórico auditável; `migrate deploy` no Docker |
| AGENTS.md + CONTEXT.md + rules | Agentes futuros herdam o mesmo contrato |

## Fluxo de trabalho observado

1. Planejamento em modo Plan (escopo, auth, deploy)
2. Bootstrap do monorepo e artefatos de lab
3. Auth + OTP + Habits
4. Neon (`poc-habits`) + migrations
5. Docs/diagramas + deploy Vercel/Docker

## Trade-offs conscientes

- OTP a cada login piora UX; ótimo para demo de segurança
- Nest em Docker (não serverless) mantém cookie/sessão previsíveis
- Tema vibrante customizado (sem visual “IA genérico”)

## Como um recrutador deve ler este repo

1. `README.md` — o que é e como rodar
2. `AGENTS.md` / `CONTEXT.md` — contrato do agente
3. `docs/architecture.excalidraw` — arquitetura visual
4. `docs/SECURITY.md` — modelo de ameaça resumido
5. Histórico git — commits semânticos pequenos
