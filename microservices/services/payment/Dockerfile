FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/payment ./services/payment


RUN npm install

COPY . .

EXPOSE 5006

CMD ["node", "src/server.js"]