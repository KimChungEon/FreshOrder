.PHONY: db-up db-down db-logs db-reset db-psql db-redis

# DB 시작 (postgres + redis)
db-up:
	docker compose -f docker-compose.db.yml --env-file .env.db up -d

# DB 중지 (볼륨은 유지)
db-down:
	docker compose -f docker-compose.db.yml down

# DB 로그 follow
db-logs:
	docker compose -f docker-compose.db.yml logs -f

# DB 초기화 (볼륨까지 제거 — 데이터 전부 삭제)
db-reset:
	docker compose -f docker-compose.db.yml down -v

# psql 접속 (freshorder DB)
db-psql:
	docker exec -it freshorder-db psql -U freshorder -d freshorder

# redis-cli 접속 (.env.db의 REDIS_PASSWORD 사용)
db-redis:
	docker exec -it freshorder-redis redis-cli -a $$(grep ^REDIS_PASSWORD .env.db | cut -d= -f2)
