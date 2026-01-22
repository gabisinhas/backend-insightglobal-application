# ---------- build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ---------- production stage ----------
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER app

EXPOSE 3000

CMD ["node", "dist/main.js"]
