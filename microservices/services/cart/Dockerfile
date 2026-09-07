FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/cart ./services/cart


RUN npm install

COPY . .

EXPOSE 5004

CMD ["node", "src/server.js"]