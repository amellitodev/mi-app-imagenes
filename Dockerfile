FROM node:18-alpine

WORKDIR /app

# 1. Copiar package.json del backend
COPY backend/package*.json ./

# 2. Instalar dependencias de producción
RUN npm ci --only=production

# 3. Copiar TODO el backend (incluyendo public/)
COPY backend/ ./

# 4. Verificar qué se copió
RUN echo "=== Contenido de /app ===" && ls -la
RUN echo "=== Carpeta public/ ===" && ls -la public/ || echo "No hay carpeta public"

# 5. Asegurar que uploads existe
RUN mkdir -p uploads && chmod 755 uploads

# 6. Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# 7. Exponer puerto
EXPOSE 5000

# 8. Comando de inicio
CMD ["node", "server.js"]