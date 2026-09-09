FROM node:20-alpine

WORKDIR /app

COPY package.json ./

COPY packages ./packages
COPY services/user ./services/user

RUN npm install

WORKDIR /app/services/user

EXPOSE 5007

CMD ["node", "src/server.js"]