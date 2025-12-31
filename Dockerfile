# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ .
RUN npm run build

# Copy backend source
WORKDIR /app
COPY backend/ ./backend/

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built backend
COPY --from=builder /app/backend ./backend

# Copy built frontend
COPY --from=builder /app/frontend/build ./frontend/build

# Create uploads directory
RUN mkdir -p backend/uploads && chmod 755 backend/uploads

# Set working directory to backend
WORKDIR /app/backend

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server.js"]