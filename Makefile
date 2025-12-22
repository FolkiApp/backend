.PHONY: up down rebuild clean test

up:
	docker-compose up

down:
	docker-compose down

rebuild:
	docker-compose up --build -d

clean:
	docker-compose down -v

test:
	npm test