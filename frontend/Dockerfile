FROM node:20-bookworm-slim
WORKDIR /app

# Improve npm reliability inside container
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 10 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry https://registry.npmjs.org/

COPY package*.json ./
# Use install with retries and legacy-peer-deps to avoid lockfile/platform mismatch; prefer offline when possible
RUN sh -c '\
    attempt=0;\
    until [ "$attempt" -ge 5 ]; do\
    npm install --no-audit --no-fund --prefer-offline --legacy-peer-deps && break || true;\
    attempt=$((attempt+1));\
    echo "npm install failed, retrying ($attempt/5)...";\
    sleep 5;\
    done;\
    exit 0'

# Ensure esbuild binary matches the container platform
RUN npm rebuild esbuild --update-binary || true

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
