# Локальный запуск через Docker

Поднимает весь стек (PostgreSQL + Go backend + React frontend) на твоей машине.

## Требования

- Docker и Docker Compose (плагин `docker compose`, не legacy `docker-compose`)
- Свободные порты: **5173** (frontend), **8080** (backend), **5432** (Postgres, слушает только на 127.0.0.1)

Проверь:

```bash
docker --version
docker compose version
```

## Шаги

### 1. Из корня репо

```bash
cd /home/sacre1noire/Projects/InitMedia
```

### 2. Создай локальный `.env`

```bash
cp .env.example .env
```

Содержимое уже настроено на `localhost` — менять ничего не нужно.

> **Важно:** `docker-compose.yml` теперь читает переменные из `.env` автоматически. Файл `.env.production` остаётся для деплоя на VPS и локальной сборкой не используется.

### 3. Подними стек

```bash
docker compose up -d --build
```

Первая сборка занимает ~2–3 минуты (Go + npm).

Проверь, что три контейнера живы:

```bash
docker compose ps
```

Ожидаемо: `initmedia_db`, `initmedia_backend`, `initmedia_frontend` — все `running`/`healthy`.

### 4. Накати миграции

```bash
chmod +x scripts/migrate.sh
./scripts/migrate.sh
```

Применит все `backend/migrations/*.up.sql` по порядку. Скрипт идемпотентный — повторный запуск безопасен.

### 5. Открой в браузере

| Что | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger/index.html |
| Health | http://localhost:8080/health |
| Ready (с проверкой БД) | http://localhost:8080/ready |

Зарегистрируйся как **соискатель (applicant)** — это даёт доступ к курсам, резюме, откликам.

## Полезные команды

```bash
# Логи в реальном времени
docker compose logs -f backend
docker compose logs -f frontend

# Перезапустить только бэкенд (после правки Go-кода)
docker compose up -d --build backend

# Перезапустить только фронт (после правки React-кода)
docker compose up -d --build frontend

# Остановить всё, но сохранить БД
docker compose down

# ПОЛНАЯ очистка — удалит volume с данными PostgreSQL и аплоадами
docker compose down -v

# Зайти в psql внутри контейнера
docker exec -it initmedia_db psql -U postgres -d initmedia

# Список таблиц
docker exec -it initmedia_db psql -U postgres -d initmedia -c '\dt'
```

## Создание новой миграции

```bash
# Следующая по порядку — посмотри последний номер
ls backend/migrations/ | tail -3

# Создай файл
touch backend/migrations/000014_my_change.up.sql

# Накати только её
docker exec -i initmedia_db psql -U postgres -d initmedia \
  -v ON_ERROR_STOP=1 -f /dev/stdin < backend/migrations/000014_my_change.up.sql

# Или прогони весь скрипт — он пропустит уже применённые
./scripts/migrate.sh
```

## Hot reload?

Сейчас Docker-сборка **не** делает hot reload — фронт собирается через `vite build` и раздаётся nginx, бэк — статическим бинарником.

Если нужен hot reload, разработка идёт вне Docker:

```bash
# Бэк (нужен Go 1.25+)
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/initmedia \
JWT_SECRET=dev \
CORS_ORIGINS=http://localhost:5173 \
go run ./cmd/api

# Фронт (нужен Node 20+)
cd frontend
npm install
npm run dev
```

Postgres всё равно поднимай через docker compose (`docker compose up -d db`).

## Что делать если...

**Порт 5173 / 8080 / 5432 уже занят**
```bash
sudo lsof -i :5173    # узнать, кто держит порт
```
Останови этот процесс или поменяй порт в `docker-compose.yml` (поле `ports:`).

**`./scripts/migrate.sh` пишет `Connection refused`**

БД ещё не успела стартовать. Подожди 5 секунд и повтори.

**Login возвращает 401, хотя пароль верный**

Скорее всего применились не все миграции. Запусти `./scripts/migrate.sh` ещё раз и посмотри вывод.

**CORS-ошибка в консоли браузера**

Проверь, что в `.env` нет `CORS_ORIGINS` со старым IP `5.35.99.120`. Дефолт из `.env.example` (`http://localhost:5173,http://127.0.0.1:5173`) подходит для локалки.

**`vite build` упал с «out of memory»**

```bash
docker compose build --memory=2g frontend
```
