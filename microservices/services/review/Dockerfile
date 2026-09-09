FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/review ./services/review

RUN npm install

WORKDIR /app/services/review

EXPOSE 5009

CMD ["node", "src/server.js"]