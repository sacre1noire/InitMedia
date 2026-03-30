# Сборка внутри Docker
FROM golang:1.26-bookworm AS builder

WORKDIR /app

# Копируем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем СТАТИЧЕСКИЙ бинарник
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/server ./cmd/api/main.go

# Финальный образ (используем Debian Slim для совместимости)
FROM debian:bookworm-slim
WORKDIR /app

# Устанавливаем базовые сертификаты
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Копируем только бинарник из билдера
COPY --from=builder /app/server /app/server

# Права на запуск
RUN chmod +x /app/server

# Запуск
ENTRYPOINT ["/app/server"]