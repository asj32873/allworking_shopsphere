FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/address ./services/address

RUN npm install

WORKDIR /app/services/address

EXPOSE 5004

CMD ["node", "src/server.js"]