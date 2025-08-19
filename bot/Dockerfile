# Bot Dockerfile (dev mode)
FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN sh -lc 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'
COPY . .
CMD ["npm", "run", "start"]
