FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npm run prisma:generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
