# ── builder stage ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# 1) copy package manifests and install all deps (framer‑motion, recharts, etc.)
COPY package*.json pnpm-lock.yaml* ./
RUN npm ci

# 2) copy source, generate Prisma client, build Next.js
COPY . .
RUN npx prisma generate
RUN npm run build

# ── runner stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next     ./.next
COPY --from=builder /app/public    ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json  ./package.json

ENV PORT 8080
EXPOSE 8080
CMD ["npm", "run", "start"]
