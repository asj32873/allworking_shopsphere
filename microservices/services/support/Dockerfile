FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/support ./services/support


RUN npm install

COPY . .

EXPOSE 5011

CMD ["node", "src/server.js"]