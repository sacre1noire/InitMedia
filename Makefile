.PHONY: help up down restart logs migrate migration shell test clean

help:
	@echo "InitMedia - Makefile команды"
	@echo ""
	@echo "  make up          - Запустить проект в docker-compose"
	@echo "  make down        - Остановить все контейнеры"
	@echo "  make restart     - Перезапустить контейнеры"
	@echo "  make logs        - Показать логи"
	@echo "  make migrate     - Применить миграции"
	@echo "  make migration   - Создать новую миграцию (использовать: make migration msg='описание')"
	@echo "  make shell       - Войти в shell backend контейнера"
	@echo "  make test        - Запустить тесты"
	@echo "  make clean       - Остановить и удалить все контейнеры и volumes"

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

migrate:
	docker-compose exec backend alembic upgrade head

migration:
	@if [ -z "$(msg)" ]; then \
		echo "Ошибка: укажите описание миграции. Пример: make migration msg='add users table'"; \
		exit 1; \
	fi
	docker-compose exec backend alembic revision --autogenerate -m "$(msg)"

shell:
	docker-compose exec backend /bin/sh

test:
	docker-compose exec backend pytest

clean:
	docker-compose down -v
	docker system prune -f
