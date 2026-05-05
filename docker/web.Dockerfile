# syntax=docker/dockerfile:1.6

# ---------- deps: install all monorepo dependencies (incl. dev) ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

# ---------- builder: build apps/web with Next.js standalone output ----------
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# @freshorder/shared is consumed as TS source via Next's transpilePackages,
# so no separate build step is needed for the shared package.
RUN npm run build --workspace=@freshorder/web

# ---------- runner: minimal image running the standalone server ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# Standalone output already contains a self-contained server + traced node_modules.
# Layout after copy: /app/apps/web/server.js, /app/node_modules, etc.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
