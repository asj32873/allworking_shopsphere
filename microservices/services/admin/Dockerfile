FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/admin ./services/admin

RUN npm install

WORKDIR /app/services/admin

EXPOSE 5013

CMD ["node", "src/server.js"]