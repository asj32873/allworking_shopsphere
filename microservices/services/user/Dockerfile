FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy this specific service
COPY services/user ./services/user


RUN npm install

COPY . .

EXPOSE 5007

CMD ["node", "src/server.js"]