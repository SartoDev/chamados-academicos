# Web image. Build context: repository root (docker compose builds it from there).
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY scripts/install-git-hooks.mjs scripts/install-git-hooks.mjs
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/web apps/web
RUN npm run build -w apps/web

# Serves the SPA and forwards /api to the API container (same origin, X-01).
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
