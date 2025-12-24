.PHONY: up down rebuild clean test test-cov db-migrate

up:
	docker-compose up --build -d

down:
	docker-compose down

clean:
	docker-compose down -v

test:
	npm test

test-cov:
	npm run test:cov
	@echo "\nAbrindo relatório de cobertura..."
	open coverage/lcov-report/index.html

db-migrate:
	@read -p "Nome da migration: " name; \
	npm run prisma:migrate -- --name $$name