FROM node:20-alpine

WORKDIR /app

# Install build dependencies if needed for sharp / native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
