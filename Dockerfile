# syntax=docker/dockerfile:1
# Payflow 웹(Next.js 16) 컨테이너.
# 배포 타깃은 linux/amd64 — arm(Apple Silicon)에서 빌드해도 amd64 이미지를 만든다.
#   docker build --platform linux/amd64 ... (또는 buildx) 권장.

# ---------- base ----------
FROM --platform=linux/amd64 node:22-alpine AS base
# sharp 등 네이티브 모듈 호환을 위한 glibc 호환 레이어 + pnpm
RUN apk add --no-cache libc6-compat && npm install -g pnpm@9
WORKDIR /app

# ---------- deps (빌드용 의존성, dev 포함) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- build (codegen + next build → standalone) ----------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* 는 빌드 시 클라이언트 번들에 인라인되므로 build arg로 주입해야 한다.
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT
ARG NEXT_PUBLIC_KAKAO_MAPS_APP_KEY
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=$NEXT_PUBLIC_GRAPHQL_ENDPOINT \
    NEXT_PUBLIC_KAKAO_MAPS_APP_KEY=$NEXT_PUBLIC_KAKAO_MAPS_APP_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prebuild 훅이 codegen 실행. BE 레포(../be)가 없으므로 vendoring된 ./schema.graphqls 사용.
RUN pnpm build

# ---------- runner (최소 런타임) ----------
FROM --platform=linux/amd64 node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs nextjs
# standalone 은 public / .next/static 을 자동 포함하지 않으므로 수동 복사.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# AUTH_SECRET / AUTH_TRUST_HOST 등 서버 런타임 env 는 docker run -e / compose 로 주입.
CMD ["node", "server.js"]
