FROM node:20-bookworm-slim

# Build tools for native modules like bcrypt
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies using npm install to avoid lockfile mismatch issues in CI
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install
# Rebuild native binaries just in case
RUN npm rebuild esbuild --update-binary || true
RUN npm rebuild bcrypt || true

# Copy source code
COPY . .

EXPOSE 3000

# Default dev command (overridden by compose command)
CMD ["npm", "run", "dev"]
