FROM node:22-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @poc/api... --frozen-lockfile=false

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
COPY .env.example ./.env.example
ENV DATABASE_URL="postgresql://poc:poc@localhost:5432/poc_habits?schema=public"
ENV DIRECT_URL="postgresql://poc:poc@localhost:5432/poc_habits?schema=public"
RUN pnpm --filter @poc/shared build \
  && pnpm --filter @poc/db generate \
  && pnpm --filter @poc/db build \
  && pnpm --filter @poc/api build

FROM base AS runner
ENV NODE_ENV=production
# Vercel Containers roteiam para a porta 80 por padrão (ou $PORT injetado)
ENV PORT=80
WORKDIR /app
COPY --from=build /app /app
EXPOSE 80
CMD ["sh", "-c", "cd /app/packages/db && pnpm exec prisma migrate deploy && cd /app/apps/api && node dist/main.js"]
