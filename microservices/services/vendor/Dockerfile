FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/vendor ./services/vendor

RUN npm install

WORKDIR /app/services/vendor

EXPOSE 5012

CMD ["node", "src/server.js"]