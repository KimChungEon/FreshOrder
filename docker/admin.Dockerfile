# syntax=docker/dockerfile:1.6

# ---------- deps: install monorepo dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

# ---------- builder: vite build for apps/admin ----------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin

# packages/shared is TS source consumed directly; no build step needed.
RUN npm run build --workspace=@freshorder/admin

# ---------- runner: serve dist/ via nginx with SPA fallback ----------
FROM nginx:alpine AS runner

COPY docker/admin-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
