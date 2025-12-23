.PHONY: up down rebuild clean test db-migrate

up:
	docker-compose up --build -d

down:
	docker-compose down

clean:
	docker-compose down -v

test:
	npm test

db-migrate:
	@read -p "Nome da migration: " name; \
	npm run prisma:migrate -- --name $$name