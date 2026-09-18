FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/product ./services/product

RUN npm install

WORKDIR /app/services/product

EXPOSE 5003

CMD ["node", "src/server.js"]