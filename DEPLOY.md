# Деплой на VPS (5.35.99.120)

## На сервере

```bash
# Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin

# Скопируйте папку проекта на сервер, затем:
cd InitMedia
chmod +x scripts/migrate.sh

docker compose --env-file .env.production up -d --build
./scripts/migrate.sh
```

## Доступ

- **Сайт:** http://5.35.99.120:5173
- **API:** http://5.35.99.120:8080
- **Health:** http://5.35.99.120:8080/health

Регистрируйтесь как **соискатель (applicant)** — раздел «Курсы» доступен только ему.

## Firewall (ufw)

```bash
sudo ufw allow 22
sudo ufw allow 5173
sudo ufw allow 8080
sudo ufw enable
```

Порт **5432** наружу не открывайте.

## Обновление после изменений кода

```bash
docker compose up -d --build
```

Новые миграции — снова `./scripts/migrate.sh`.

## Локальная разработка

Скопируйте `frontend/.env.example` в `frontend/.env` или используйте localhost в отдельном `.env` без production-значений.
