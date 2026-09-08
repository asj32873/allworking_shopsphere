FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/rag ./services/rag

RUN npm install

WORKDIR /app/services/rag

EXPOSE 5010

CMD ["node", "src/server.js"]