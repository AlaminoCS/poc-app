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

## Segredos

Nunca commitados. Ver `.env.example`. Em produção: secrets da Vercel (web) + host da API Docker.

## Resend (lab)

Sem domínio verificado, o Resend só entrega OTP para o e-mail da conta (ex.: `alamino.code.solutions@gmail.com`).

Com `alamino.dev.br` verificado em [resend.com/domains](https://resend.com/domains), use `RESEND_FROM=Hábitos <noreply@alamino.dev.br>` (ou outro endereço do mesmo domínio) para enviar OTP a qualquer destinatário.

Reset de senha reutiliza `LoginChallenge` com `purpose=password_reset` (OTP hasheado, TTL curto); o login continua com `purpose=login`.
