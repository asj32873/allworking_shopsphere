FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./ 

COPY packages ./packages
COPY services/user ./services/user

RUN npm ci

WORKDIR /app/services/user

EXPOSE 5007

CMD ["node", "src/server.js"]