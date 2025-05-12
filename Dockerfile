# ── builder stage ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json pnpm-lock.yaml* ./
RUN npm ci

# Copy all source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Optional: Push schema to database (for automatic migrations)
# RUN npx prisma db push

# Build the Next.js app
RUN npm run build

# ── runner stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output and Prisma client
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Add Prisma client output just in case it's used at runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set env, expose port
ENV PORT=8080
EXPOSE 8080

# Start the Next.js app
CMD ["npm", "run", "start"]
