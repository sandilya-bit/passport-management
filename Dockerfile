FROM node:24-alpine

WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY server ./server

RUN npm run build:api && npm prune --omit=dev
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "run", "start:api"]
