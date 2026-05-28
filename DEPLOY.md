# Деплой на VPS (5.35.99.120)

Тот же `docker-compose.yml`, что и для локалки — отличается **только тем, какой `.env`-файл используется**. Локально это `.env`, на сервере — `.env.production`.

## Первый запуск

### 1. Подготовь сервер

```bash
# Установить Docker и compose-плагин
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# Дать твоему пользователю права на docker без sudo (опционально)
sudo usermod -aG docker $USER && newgrp docker
```

### 2. Залей код на сервер

Любым удобным способом — через `scp`, `rsync` или `git clone` (если репо приватный — настрой ssh-ключ).

```bash
# Вариант 1: rsync с локальной машины
rsync -av --exclude='node_modules' --exclude='.git' \
  /home/sacre1noire/Projects/InitMedia/ user@5.35.99.120:~/InitMedia/

# Вариант 2: на самом сервере
git clone <repo-url> ~/InitMedia
```

### 3. На сервере

```bash
cd ~/InitMedia
```

### 4. Проверь `.env.production`

```bash
cat .env.production
```

Минимально нужно:

```env
PUBLIC_HOST=5.35.99.120
VITE_API_URL=http://5.35.99.120:8080
CORS_ORIGINS=http://5.35.99.120:5173,http://5.35.99.120,http://localhost:5173
JWT_SECRET=<длинная случайная строка>
POSTGRES_PASSWORD=<длинный случайный пароль>
```

> **ВАЖНО:** перед первым продакшн-запуском сгенерируй новые секреты:
> ```bash
> openssl rand -hex 32   # для JWT_SECRET
> openssl rand -hex 24   # для POSTGRES_PASSWORD
> ```
> Текущие значения в репо — заглушки и публично известны.

### 5. Открой порты в firewall

```bash
sudo ufw allow 22       # SSH
sudo ufw allow 5173     # Frontend
sudo ufw allow 8080     # Backend API
sudo ufw enable
```

Порт **5432 (Postgres) наружу не открывай** — он уже привязан только к `127.0.0.1` в compose.

### 6. Подними стек

```bash
docker compose --env-file .env.production up -d --build
```

Сборка займёт 2–3 минуты. Проверь:

```bash
docker compose ps
```

### 7. Накати миграции

```bash
chmod +x scripts/migrate.sh
./scripts/migrate.sh
```

### 8. Проверь

```bash
curl http://localhost:8080/health        # на самом сервере
curl http://5.35.99.120:8080/health      # снаружи
```

Открой в браузере: **http://5.35.99.120:5173**

Регистрируйся как **соискатель (applicant)** — он видит все секции (вакансии, курсы, резюме).

---

## Обновление после изменений кода

```bash
cd ~/InitMedia

# Получить новый код
git pull                       # или rsync с локалки

# Пересобрать и перезапустить (БД не трогается)
docker compose --env-file .env.production up -d --build

# Если есть новые миграции
./scripts/migrate.sh
```

Время простоя при обновлении — несколько секунд (контейнеры backend/frontend пересоздаются, postgres остаётся жить).

## Логи и диагностика

```bash
# Все логи
docker compose logs -f

# Только backend
docker compose logs -f backend

# Только последние 100 строк
docker compose logs --tail=100 backend
```

## Бэкап БД

```bash
# Дамп
docker exec initmedia_db pg_dump -U postgres initmedia > backup_$(date +%Y%m%d).sql

# Восстановление
docker exec -i initmedia_db psql -U postgres initmedia < backup_20260528.sql
```

## Остановка / откат

```bash
# Остановить, БД сохранится
docker compose down

# ПОЛНОСТЬЮ снести (volumes тоже) — ВСЕ ДАННЫЕ ПОТЕРЯЮТСЯ
docker compose down -v
```

## Что-то улучшить (опционально, не для MVP)

- **HTTPS** — поставить Caddy или nginx + Let's Encrypt перед фронтом и API. Сейчас всё по голому HTTP.
- **Домен** — повесить A-запись на IP, обновить `VITE_API_URL` и `CORS_ORIGINS`.
- **Авто-миграции при старте** — добавить миграционный шаг в `docker-compose.yml` (отдельный сервис `migrate`, запускающий `scripts/migrate.sh`).
- **CI/CD** — на каждый push в master — `ssh + docker compose pull + up -d`.
- **Бэкапы по cron** — `pg_dump` каждые сутки в облако.

---

## Чем отличается от локального запуска

| | Локально | На сервере |
|---|---|---|
| Env-файл | `.env` (из `.env.example`) | `.env.production` |
| Команда | `docker compose up -d --build` | `docker compose --env-file .env.production up -d --build` |
| `VITE_API_URL` | `http://localhost:8080` | `http://5.35.99.120:8080` |
| `CORS_ORIGINS` | `localhost:5173` | `5.35.99.120:5173` |
| Доступ снаружи | нет | через 5173/8080 |

Если запустить compose **без** `--env-file .env.production` — он подхватит дефолты (localhost) и фронт не сможет достучаться до API через публичный IP.
