FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json  ./

COPY packages ./packages
COPY services/auth ./services/auth

RUN npm ci --legacy-peer-deps

WORKDIR /app/services/auth

EXPOSE 5002

CMD ["node", "src/server.js"]