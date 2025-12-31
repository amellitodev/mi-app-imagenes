FROM node:18-alpine

WORKDIR /app

# 1. Copiar backend
COPY backend/package*.json ./
RUN npm install --production

# 2. Copiar todo el backend
COPY backend/ .

# 3. Crear carpeta uploads
RUN mkdir -p uploads

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["node", "server.js"]