FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json  ./

COPY packages ./packages
COPY services/order ./services/order

RUN npm ci --legacy-peer-deps

WORKDIR /app/services/order

EXPOSE 5005

CMD ["node", "src/server.js"]