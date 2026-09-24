FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json  ./

COPY packages ./packages
COPY services/address ./services/address

RUN npm ci

WORKDIR /app/services/address

EXPOSE 5008

CMD ["node", "src/server.js"]