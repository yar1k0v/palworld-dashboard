# Stage 1: Build
FROM node:20-alpine AS builder

# Enable corepack for pnpm
# Pinned: pnpm 11 requires node:sqlite, which Node 20 does not provide
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

WORKDIR /app

# Copy package files first (changes rarely - cached layer)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (cached unless package files change)
RUN pnpm install --frozen-lockfile

# Copy source files (public/ holds only the favicon and icons; map tiles are mounted at runtime)
COPY index.html vite.config.ts tsconfig*.json ./
COPY public ./public
COPY src ./src

# Build the app
RUN pnpm build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine renders /etc/nginx/templates/*.template with envsubst at start-up
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV API_BACKEND_URL=http://localhost:8212

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
