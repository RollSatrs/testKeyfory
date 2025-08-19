FROM node:20-bookworm-slim

# Build tools for native modules like bcrypt
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies cleanly
COPY package*.json ./
RUN sh -lc 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'

# Copy source code
COPY . .

EXPOSE 3000

# Default dev command (overridden by compose command)
CMD ["npm", "run", "dev"]
