FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

COPY packages ./packages
COPY services/api-gateway ./services/api-gateway

RUN npm ci

WORKDIR /app/services/api-gateway

EXPOSE 5001

CMD ["node", "src/server.js"]