FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/admin ./services/admin


RUN npm install

COPY . .

EXPOSE 5013

CMD ["node", "src/server.js"]