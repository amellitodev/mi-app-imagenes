# ============================================
# BACKEND - Node.js API
# ============================================

FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copiar package.json del backend
COPY backend/package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código del backend
COPY backend/ .

# Crear carpeta para uploads
RUN mkdir -p uploads && chmod 755 uploads

# ============================================
# FRONTEND - React App Build
# ============================================

FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copiar package.json del frontend
COPY frontend/package*.json ./

# Instalar todas las dependencias del frontend
RUN npm ci

# Copiar código del frontend
COPY frontend/ .

# Construir la aplicación React
RUN npm run build

# ============================================
# IMAGEN FINAL DE PRODUCCIÓN
# ============================================

FROM node:18-alpine

WORKDIR /app

# 1. Copiar backend construido
COPY --from=backend-builder /app/backend /app/backend

# 2. Copiar frontend construido
COPY --from=frontend-builder /app/frontend/build /app/frontend/build

# 3. Ir al directorio del backend
WORKDIR /app/backend

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Exponer puerto
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["node", "server.js"]