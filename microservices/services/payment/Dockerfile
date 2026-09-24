FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./ 
    
COPY packages ./packages
COPY services/payment ./services/payment

RUN npm ci

WORKDIR /app/services/payment

EXPOSE 5006

CMD ["node", "src/server.js"]