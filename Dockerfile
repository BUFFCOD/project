# ── builder stage ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# Add required build-time env vars
ENV ENCRYPTION_SECRET=kQIBcLw4PqLxiZCN3f5GkhuDeNOBTs4bnGftZtxqbcM=
ENV GEMINI_API_KEY=AIzaSyBffX7G8w65NYLtls3JCf53yP7b0PvxmkQ
ENV PLAID_CLIENT_ID=67e988daf2516500245db25d
ENV PLAID_SECRET=8bbd29e83414bf5d3c48a61d2810b6
ENV PLAID_ENV=production
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWFnaWNhbC1maXNoLTUwLmNsZXJrLmFjY291bnRzLmRldiQ

# Install dependencies
COPY package*.json pnpm-lock.yaml* ./
RUN npm ci

# Copy all source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# ── runner stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# Add runtime env vars again
ENV ENCRYPTION_SECRET=kQIBcLw4PqLxiZCN3f5GkhuDeNOBTs4bnGftZtxqbcM=
ENV GEMINI_API_KEY=AIzaSyBffX7G8w65NYLtls3JCf53yP7b0PvxmkQ
ENV PLAID_CLIENT_ID=67e988daf2516500245db25d
ENV PLAID_SECRET=8bbd29e83414bf5d3c48a61d2810b6
ENV PLAID_ENV=production
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWFnaWNhbC1maXNoLTUwLmNsZXJrLmFjY291bnRzLmRldiQ
ENV CLERK_SECRET_KEY=sk_test_gQFf9V9GzTFYV9JNUCeREqFe4mQIuUvEpE3OUnU18K
ENV PORT=8080

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080
CMD ["npm", "run", "start"]
