FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 5010

CMD ["npm", "start"]
