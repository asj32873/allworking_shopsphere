FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/vendor ./services/vendor


RUN npm install

COPY . .

EXPOSE 5012

CMD ["node", "src/server.js"]