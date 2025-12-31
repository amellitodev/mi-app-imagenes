FROM node:18-alpine as backend

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
RUN mkdir -p uploads

FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Copiar backend
COPY --from=backend /app/backend /app/backend

# Copiar frontend build
COPY --from=frontend-build /app/frontend/build /app/public

# Instalar dependencias solo de producción para backend
WORKDIR /app/backend
RUN npm ci --only=production

# Crear carpeta uploads
RUN mkdir -p uploads && chmod 755 uploads

# Servir estáticos y API
RUN npm install -g serve
EXPOSE 5000 3000

# Comando para iniciar
CMD ["sh", "-c", "node server.js & serve -s /app/public -l 3000"]