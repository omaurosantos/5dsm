# Usa uma imagem base do Node.js, versão 18-alpine, que é leve
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de configuração do Node.js para que as dependências sejam instaladas
COPY package*.json ./

# Instala as dependências do projeto
# O --production evita a instalação de dependências de desenvolvimento, reduzindo o tamanho da imagem
RUN npm install

# Copia o restante dos arquivos do projeto para o container
# O .dockerignore vai ajudar a ignorar arquivos desnecessários como node_modules
COPY . .

# Compila o código TypeScript em JavaScript
# Assume que a compilação gerará um arquivo server.js no mesmo diretório ou em um subdiretório
RUN npx tsc

# Opcional: Define a porta que a aplicação irá expor
# Por padrão, muitas aplicações Node.js usam a porta 3000
EXPOSE 3000

# Define o comando para iniciar a aplicação quando o container for executado
# Assumimos que o arquivo de entrada compilado é server.js
CMD [ "node", "dist/server.js" ]