FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/product ./services/product


RUN npm install

COPY . .

EXPOSE 5003

CMD ["node", "src/server.js"]