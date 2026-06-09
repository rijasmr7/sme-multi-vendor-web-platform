FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5 && \
    (npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit)
COPY . .
EXPOSE 5173
# Expose to 0.0.0.0 to ensure it routes successfully over Docker bridge networks
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--force"]
