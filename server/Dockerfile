FROM node:20-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the server port
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]
