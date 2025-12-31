FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar el código de la aplicación
COPY . .

# Crear carpeta uploads si no existe
RUN mkdir -p uploads

# Exponer el puerto
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]