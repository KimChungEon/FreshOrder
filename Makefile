.PHONY: help up up-build down restart logs logs-api logs-web logs-admin logs-nginx \
        ps migrate seed reset psql redis api-shell \
        db-up db-down db-logs db-reset db-psql db-redis

# 기본 타겟
help:
	@echo "FreshOrder Docker Compose 타겟"
	@echo ""
	@echo "  make up          — 전체 스택 기동 (기존 이미지 재사용)"
	@echo "  make up-build    — 이미지 재빌드 후 기동"
	@echo "  make down        — 전체 스택 중지 (볼륨 유지)"
	@echo "  make restart     — 전체 재기동"
	@echo "  make logs        — 모든 컨테이너 로그 follow"
	@echo "  make logs-api    — API 로그만 follow"
	@echo "  make logs-web    — web 로그만 follow"
	@echo "  make logs-admin  — admin 로그만 follow"
	@echo "  make logs-nginx  — nginx 로그만 follow"
	@echo "  make ps          — 컨테이너 상태 확인"
	@echo "  make migrate     — Prisma migrate deploy 실행"
	@echo "  make seed        — Prisma DB seed 실행"
	@echo "  make reset       — 모든 컨테이너+볼륨 삭제 후 재구축 (데이터 전부 삭제)"
	@echo "  make psql        — Postgres 컨테이너 psql 접속"
	@echo "  make redis       — Redis 컨테이너 redis-cli 접속"
	@echo "  make api-shell   — API 컨테이너 sh 접속"
	@echo ""
	@echo "  make db-up       — DB+Redis만 (개발용 백엔드 따로 띄울 때)"
	@echo "  make db-down     — DB+Redis 중지"

# ─────────────────── 통합 스택 ───────────────────

up:
	docker compose up -d

up-build:
	docker compose up --build -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f --tail=200

logs-api:
	docker compose logs -f --tail=200 api

logs-web:
	docker compose logs -f --tail=200 web

logs-admin:
	docker compose logs -f --tail=200 admin

logs-nginx:
	docker compose logs -f --tail=200 nginx

ps:
	docker compose ps

migrate:
	docker compose exec api npx prisma migrate deploy --schema prisma/schema.prisma

seed:
	docker compose exec api npx prisma db seed --schema prisma/schema.prisma

reset:
	docker compose down -v
	docker compose up --build -d
	@echo "기동 후 'make migrate && make seed' 실행"

psql:
	docker exec -it freshorder-db psql -U $$(grep ^DB_USER .env | cut -d= -f2) -d $$(grep ^DB_NAME .env | cut -d= -f2)

redis:
	docker exec -it freshorder-redis redis-cli -a $$(grep ^REDIS_PASSWORD .env | cut -d= -f2)

api-shell:
	docker exec -it freshorder-api sh

# ─────────────────── DB만 기동 (구 모드 — 개발 편의) ───────────────────

db-up:
	docker compose -f docker-compose.db.yml --env-file .env.db up -d

db-down:
	docker compose -f docker-compose.db.yml down

db-logs:
	docker compose -f docker-compose.db.yml logs -f

db-reset:
	docker compose -f docker-compose.db.yml down -v

db-psql:
	docker exec -it freshorder-db psql -U freshorder -d freshorder

db-redis:
	docker exec -it freshorder-redis redis-cli -a $$(grep ^REDIS_PASSWORD .env.db | cut -d= -f2)
