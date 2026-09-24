FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./ 

COPY packages ./packages
COPY services/vendor ./services/vendor

RUN npm ci

WORKDIR /app/services/vendor

EXPOSE 5012

CMD ["node", "src/server.js"]