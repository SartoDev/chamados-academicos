# API image. Build context: repository root (docker compose builds it from there).
FROM node:24-bookworm-slim AS base
WORKDIR /app
# OpenSSL is required by the Prisma schema engine used by `prisma migrate deploy`.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
COPY package.json package-lock.json .npmrc ./
COPY scripts/install-git-hooks.mjs scripts/install-git-hooks.mjs
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN npm run build -w apps/api \
  && npm prune --omit=dev \
  && mkdir -p apps/api/node_modules

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3000
# Migrations first; the initial load runs when the application starts (WF9).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
