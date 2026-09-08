FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/order ./services/order

RUN npm install

WORKDIR /app/services/order

EXPOSE 5005

CMD ["node", "src/server.js"]