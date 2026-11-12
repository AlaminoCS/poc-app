# SECURITY.md

## Senha

- Algoritmo: **Argon2id**
- **Salt** gerado automaticamente pelo Argon2 por hash
- **Pepper** (`PASSWORD_PEPPER`) concatenado à senha antes do hash — vive só em variável de ambiente

## OTP a cada login

1. Senha válida → gera OTP de 6 dígitos
2. Persiste apenas `sha256(otp)` em `LoginChallenge`
3. Envia o OTP em claro via Resend (canal e-mail)
4. TTL curto (`OTP_TTL_MINUTES`, padrão 10)
5. Challenge consumido após uso bem-sucedido

## Sessão

- JWT assinado com `JWT_SECRET`
- Cookie `access_token` com `HttpOnly`, `SameSite=Lax`, `Secure` em produção
- TTL do cookie **alinhado** ao `expiresIn` do JWT
- Sem “Manter conectado”: `JWT_EXPIRES_IN` (padrão `1d`)
- Com “Manter conectado”: `JWT_EXPIRES_IN_REMEMBER` (padrão `30d`) — OTP continua obrigatório no login

## Segredos

Nunca commitados. Ver `.env.example`. Em produção: secrets da Vercel (web) + host da API Docker.

## Resend (lab)

Sem domínio verificado, o Resend só entrega OTP para o e-mail da conta (ex.: `alamino.code.solutions@gmail.com`).

Com `alamino.dev.br` verificado em [resend.com/domains](https://resend.com/domains), use `RESEND_FROM=Hábitos <noreply@alamino.dev.br>` (ou outro endereço do mesmo domínio) para enviar OTP a qualquer destinatário.

Reset de senha: `purpose=password_reset`. Troca logada: `purpose=password_change`. Login: `purpose=login`.

## Perfil e idade

`birthDate` com idade mínima **13** (LGPD: menores de 12 exigem responsável — fora do escopo da POC).

## Web Push

VAPID keys + service worker. Cron Vercel chama `/api/internal/reminders/tick` com `Authorization: Bearer CRON_SECRET`.

## Contrate-me / anti-bot

Cloudflare Turnstile (siteverify) + honeypot + rate limit + unlock token HMAC de curta duração. E-mail/WhatsApp só após unlock. Tentativas em `ContactAttempt`.

## LGPD

Banner + `/privacidade` + `ConsentEvent` (`policyVersion`, ex. `v1`).
