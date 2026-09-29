FROM node:24-alpine

WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY server ./server

RUN npm run build:api && npm prune --omit=dev
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate resolve --rolled-back 20260928000000_init --schema server/prisma/schema.prisma >/dev/null 2>&1 || true; npm run db:migrate && npm run start:api"]
