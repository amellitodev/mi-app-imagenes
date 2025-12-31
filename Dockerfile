# ============================================
# BACKEND ONLY - Simple deployment
# ============================================

FROM node:18-alpine

WORKDIR /app

# Copiar solo el backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copiar código del backend
COPY backend/ .

# Crear carpeta para uploads
RUN mkdir -p uploads && chmod 755 uploads

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Exponer puerto
EXPOSE 5000

# Comando para iniciar
CMD ["node", "server.js"]