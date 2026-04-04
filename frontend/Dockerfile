FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Expose to 0.0.0.0 to ensure it routes successfully over Docker bridge networks
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
