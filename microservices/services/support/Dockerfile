FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/support ./services/support

RUN npm install

WORKDIR /app/services/support

EXPOSE 5011

CMD ["node", "src/server.js"]