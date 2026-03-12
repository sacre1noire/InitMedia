FROM node:20-alpine

WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json* ./
RUN npm install

# Копирование кода
COPY . .

# Порт
EXPOSE 5173

# Запуск dev сервера
CMD ["npm", "run", "dev", "--", "--host"]
