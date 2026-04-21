# InitMedia

Карьерная платформа для студентов и начинающих специалистов медиасферы.

> 📋 Подробная спецификация проекта находится в [REQUIREMENTS.md](REQUIREMENTS.md)

## Технологии

**Backend:**
- Python 3.11 + FastAPI
- PostgreSQL + SQLAlchemy + Alembic
- JWT аутентификация (bcrypt + python-jose)

**Frontend:**
- TypeScript + React 18
- Vite
- React Router + React Hook Form + Zod

**Инфраструктура:**
- Docker + docker-compose

## Быстрый старт

### Требования
- Docker & Docker Compose
- Git

### Установка и запуск

1. Клонировать репозиторий:
```bash
git clone <repository-url>
cd InitMedia
```

2. Создать `.env` файлы:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Запустить проект:
```bash
make up
```

Или без make:
```bash
docker-compose up -d
```

4. Применить миграции (если не применились автоматически):
```bash
make migrate
```

### Доступы

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432

## Makefile команды

```bash
make up          # Запустить проект
make down        # Остановить проект
make restart     # Перезапустить
make logs        # Показать логи
make migrate     # Применить миграции
make migration   # Создать миграцию (msg='описание')
make shell       # Войти в backend shell
make test        # Запустить тесты
make clean       # Очистить все (удалить volumes)
```

## Структура проекта

```
InitMedia/
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── api/      # API routes
│   │   │   ├── routes/
│   │   │   │   └── auth.py
│   │   │   └── deps.py
│   │   ├── core/     # Конфиги, security, database
│   │   ├── models/   # SQLAlchemy модели
│   │   ├── schemas/  # Pydantic схемы
│   │   └── main.py   # Entry point
│   ├── alembic/      # Миграции
│   └── requirements.txt
├── frontend/         # React приложение
│   ├── src/
│   │   ├── components/  # AuthGuard
│   │   ├── contexts/    # AuthContext
│   │   ├── pages/       # Login, Register, Home
│   │   ├── services/    # API сервисы
│   │   ├── types/       # TypeScript типы
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
├── Makefile
└── REQUIREMENTS.md    # Полная спецификация проекта
```

## Реализованный функционал

### ✅ Аутентификация и профиль (Соискатель)
- [x] Регистрация пользователей (соискатель/работодатель/админ)
- [x] Вход с JWT токенами (access + refresh)
- [x] Автоматическое обновление токена
- [x] Protected routes с AuthGuard
- [x] Logout и управление сессией
- [x] Middleware для проверки JWT токена
- [x] Dependencies для защищённых роутов
- [x] Валидация форм (React Hook Form + Zod)
- [x] Хранение токенов в localStorage
- [x] AuthContext для управления состоянием

### 🔜 В разработке
- [ ] Расширенный профиль соискателя
- [ ] Вакансии и стажировки
- [ ] Конструктор резюме и портфолио
- [ ] База компаний
- [ ] Мини-курсы
- [ ] Карьерное сопровождение
- [ ] И многое другое...

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход (получение токенов)
- `POST /api/auth/refresh` - Обновление access токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Получение текущего пользователя (protected)

## Разработка без Docker

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Создать .env и настроить DATABASE_URL
cp .env.example .env

# Применить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install

# Создать .env
cp .env.example .env

# Запустить dev сервер
npm run dev
```

## Работа с миграциями

### Создание новой миграции
```bash
cd backend/migrations

# пример: следующая после 000005
touch 000006_add_some_table.up.sql
```

### Применение миграций
```bash
cd /home/sacre1noire/Projects/InitMedia

# применить один файл
docker exec -i initmedia_db \
  psql -U postgres -d initmedia -v ON_ERROR_STOP=1 -f /dev/stdin \
  < backend/migrations/000006_add_some_table.up.sql

# применить все миграции по порядку
for f in backend/migrations/*.up.sql; do
  echo "Applying $f"
  docker exec -i initmedia_db \
    psql -U postgres -d initmedia -v ON_ERROR_STOP=1 -f /dev/stdin < "$f"
done
```

### Проверка
```bash
docker exec -it initmedia_db psql -U postgres -d initmedia -c "\\dt"
```

## Тестирование

### Регистрация
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "applicant"
  }'
```

### Вход
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## License

MIT
