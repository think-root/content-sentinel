FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci
RUN npm install express http-proxy-middleware

COPY . .

RUN npm run build

EXPOSE ${PORT:-3000}

ENV NODE_ENV=production

CMD ["node", "server.js"]
