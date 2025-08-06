# Dockerfile for Bot
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Start the bot
CMD ["node", "index.js"]
