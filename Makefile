.PHONY: up down rebuild clean test test-cov db-migrate db-seed

up:
	docker compose up --build -d

down:
	docker compose down

rebuild:
	@echo "Rebuilding containers from scratch..."
	docker compose down
	docker compose up --build -d
	@echo "Rebuild completed successfully!"

clean:
	docker compose down -v

test:
	npm test

test-cov:
	npm run test:cov
	@echo "\nAbrindo relatório de cobertura..."
	open coverage/lcov-report/index.html

db-migrate:
	@read -p "Nome da migration: " name; \
	npm run prisma:migrate -- --name $$name

db-seed:
	@echo "Checking if database is running..."
	@docker compose up -d postgres
	@echo "Waiting for database to be ready..."
	@sleep 2
	@echo "Running database seed..."
	docker compose exec -T postgres psql -U postgres -d folki < prisma/seed.sql
	@echo "Seed completed successfully!"

lint:
	npm run lint