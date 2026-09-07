FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/order ./services/order


RUN npm install

COPY . .

EXPOSE 5005

CMD ["node", "src/server.js"]