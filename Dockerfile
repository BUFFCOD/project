# ── builder stage ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Add ENCRYPTION_SECRET to be available at build time
ENV ENCRYPTION_SECRET=kQIBcLw4PqLxiZCN3f5GkhuDeNOBTs4bnGftZtxqbcM=

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

# Add ENCRYPTION_SECRET again for runtime
ENV ENCRYPTION_SECRET=kQIBcLw4PqLxiZCN3f5GkhuDeNOBTs4bnGftZtxqbcM=
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output and Prisma client
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose the app port and run it
EXPOSE 8080
CMD ["npm", "run", "start"]
