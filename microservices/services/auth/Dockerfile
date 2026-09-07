FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/auth ./services/auth


RUN npm install

COPY . .

EXPOSE 5002

CMD ["node", "src/server.js"]