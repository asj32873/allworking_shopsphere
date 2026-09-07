FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/review ./services/review


RUN npm install

COPY . .

EXPOSE 5009

CMD ["node", "src/server.js"]