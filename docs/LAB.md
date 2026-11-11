# LAB.md — Diário do laboratório com agentes

POC construída como evidência de colaboração **humano + agente** (Cursor). Destinada a quem analisa o repositório: revisão técnica, portfólio ou avaliação de processo.

## Contexto

- Repo inicial: `poc-app` vazio (`# poc-app`)
- Objetivo: hábitos diários + auth segura + Neon + Vercel + narrativa de processo auditável
- Regra de ouro: intenção e restrições ficam no humano; execução e consistência no agente; decisões viram arquivos no git

## Decisões tomadas com o agente

| Decisão | Por quê | Vantagem |
|---------|--------|----------|
| Monorepo pnpm + Turborepo | Separar web/api/db/shared sem perder tipagem | Menos drift de contratos entre camadas |
| Nest modular + repositories | Evitar procedural; DI e camadas claras | Código legível para humanos e agentes |
| Argon2id + pepper | Defesa em profundidade no hash | Banco vazado ≠ senhas prontas |
| OTP a cada login (Resend) | Requisito explícito da POC | Segundo fator demonstrável sem app MFA |
| Prisma migrations | Histórico versionado | Deploy previsível (`migrate deploy`) |
| AGENTS.md + CONTEXT.md + rules | Contrato persistente para o agente | Reproduzibilidade da colaboração |

## Fluxo de trabalho observado

1. Planejamento em modo Plan (escopo, auth, deploy, artefatos de lab)
2. Bootstrap do monorepo e regras Cursor
3. Auth + OTP + Habits
4. Neon (`poc-habits`) + migrations
5. Docs/diagramas + deploy Vercel/Docker
6. Ajuste de linguagem dos docs: de “recrutadores” para **quem analisa o repositório**

## O que a interação humano ↔ agente mostrou na prática

- Escopo fechado antes do código evita refatoração ampla no meio da POC
- Contrato em `AGENTS.md` impede o agente de “inventar” arquitetura (ex.: procedural em controller)
- Smoke real (Neon + OTP Resend + Docker) surfaca limites de plataforma cedo (domínio Resend, API pública vs localhost)
- Docs e diagramas versionados transformam a sessão em artefato revisável, não só histórico de chat

## Trade-offs conscientes

- OTP a cada login piora UX; ótimo para demo de segurança
- Nest em Docker (não serverless) mantém cookie/sessão previsíveis
- Tema vibrante customizado (sem visual “IA genérico”)
- Front chama `/api` same-origin (rewrite) para evitar CORS; Nest precisa estar no mesmo deploy (Vercel Services) ou em `API_URL` alcançável pelo Next
- `ALLOW_TEST_OTP=true` só para E2E/local — nunca em produção pública
- Domínio Resend verificado (`alamino.dev.br`) + `RESEND_FROM` no domínio — sandbox do Resend só entregava OTP ao e-mail da conta
- Reset de senha via OTP (mesmo challenge/mail) em vez de painel admin para destravar conta já cadastrada

## Roteiro de leitura sugerido

1. `README.md` — o que é, como rodamos e por que as medidas
2. `AGENTS.md` / `CONTEXT.md` — contrato do agente e do produto
3. `docs/architecture.excalidraw` — arquitetura visual
4. `docs/SECURITY.md` — modelo de ameaça resumido
5. Histórico git — commits semânticos pequenos
