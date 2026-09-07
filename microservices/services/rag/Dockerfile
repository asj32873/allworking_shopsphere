FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/rag ./services/rag


RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5010

CMD ["node", "src/server.js"]