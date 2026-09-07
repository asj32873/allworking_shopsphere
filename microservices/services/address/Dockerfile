FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/address ./services/address


RUN npm install

COPY . .

EXPOSE 5008

CMD ["node", "src/server.js"]