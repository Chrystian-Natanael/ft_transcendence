# Backend/Dockerfile
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência primeiro (para aproveitar o cache do Docker)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código fonte
COPY . .

# Expõe a porta que o Fastify usa
EXPOSE 3333

# Comando para rodar em desenvolvimento (com hot-reload se usar ts-node-dev ou similar)
# Se for produção, seria 'npm run build' e depois 'npm start'
CMD ["npm", "run", "dev"]