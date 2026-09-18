FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/cart ./services/cart

RUN npm install

WORKDIR /app/services/cart

EXPOSE 5004

CMD ["node", "src/server.js"]