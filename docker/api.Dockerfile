# syntax=docker/dockerfile:1.6

# ─────────────────────────────────────────────────────────────
# api.Dockerfile — NestJS + Prisma (모노레포 의식한 멀티스테이지)
# ─────────────────────────────────────────────────────────────

# ---------- deps: 모든 워크스페이스 의존성 설치 ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma engine은 OpenSSL이 필요
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

# ---------- builder: Prisma generate + nest build ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# nest CLI 등 일부 의존성은 root로 hoist 되지 않고 apps/api/node_modules 에만 설치된다.
# 호스트의 .dockerignore가 node_modules 를 막으므로 deps 단계에서 별도로 가져온다.
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Prisma client는 schema 위치 기준으로 node_modules에 생성됨
RUN cd apps/api && npx prisma generate

# nest build → apps/api/dist
RUN npm run build --workspace=@freshorder/api

# ---------- runner: 슬림 런타임 (마이그레이션/시드 가능) ----------
FROM node:20-alpine AS runner
WORKDIR /app

# tini: PID 1 신호 처리; openssl: prisma engine 의존
RUN apk add --no-cache openssl tini

ENV NODE_ENV=production
ENV PORT=3001

# node_modules는 builder에서 그대로 복사 (Prisma CLI / ts-node / typescript 포함 →
# 컨테이너 안에서 prisma migrate deploy / db seed 실행 가능).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/tsconfig.json ./apps/api/tsconfig.json
# nest CLI는 빠져도 되지만 ts-node 가 apps/api/node_modules 에 있어 seed 실행에 필요
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
