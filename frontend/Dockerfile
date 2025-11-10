# Stage 1: build the app
FROM oven/bun:latest AS builder

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Install dependencies first
COPY package.json bun.lock ./
RUN bun i

# Copy rest and build
COPY . .
RUN bun run build

# Stage 2: serve with nginx
FROM nginx:stable-alpine AS runner

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with one that supports SPA routing (fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
