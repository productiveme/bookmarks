# Build stage
FROM node:22-alpine AS builder

# Accept build argument for the public URL
ARG PUBLIC_APP_URL=http://localhost:4321
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --production

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4321/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "./dist/server/entry.mjs"]
