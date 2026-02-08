.PHONY: dev up down logs clean

dev:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile dev up --build

up:
	docker compose -f docker/docker-compose.yml up --build -d

down:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile dev down

logs:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f

clean:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml --profile dev down -v --remove-orphans
