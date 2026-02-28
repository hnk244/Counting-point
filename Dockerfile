# ── Stage 1: Install all dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile && npx prisma generate

# ── Stage 2: Build the Vite frontend ─────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && yarn build

# ── Stage 3: Production dependencies only ────────────────────────────────────
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile --production && npx prisma generate

# ── Stage 4: Final production image ──────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy production node_modules (includes @prisma/client + engine)
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy Prisma schema (needed at runtime)
COPY prisma ./prisma/

# Copy built frontend assets
COPY --from=build /app/dist ./dist

# Copy server source + configs
COPY server ./server/
COPY package.json tsconfig.json tsconfig.server.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]