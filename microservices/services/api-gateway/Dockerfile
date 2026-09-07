FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/api-gateway ./services/api-gateway


RUN npm install

COPY . .

EXPOSE 5001

CMD ["node", "src/server.js"]