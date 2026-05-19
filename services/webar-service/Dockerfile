FROM node:18-alpine

WORKDIR /app

# Install openssl and compatibility layers for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install

# Copy prisma schema first to leverage Docker cache
COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 5006

CMD ["npm", "start"]
