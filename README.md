# FreshOrder

프렌차이즈 업체 본사와 직영점 간 물품 발주 서비스 구축.

Claude Code를 사용한 바이브 코딩. 

---

## 플로우차트

<img width="617" height="597" alt="image (25)" src="https://github.com/user-attachments/assets/f66b6651-b11d-4716-8bad-ea6030e72970" />

## 배포 아키텍처

<img width="641" height="513" alt="image (26)" src="https://github.com/user-attachments/assets/646a49fb-5096-4a4b-8a86-3f37a6c8d4aa" />

---

## 로컬 개발 — DB 서버 (Docker)

PostgreSQL 16 + Redis 7 을 Docker 로 띄워 사용합니다.
네트워크명은 `freshorder-network` 로 통일되어 있어, 추후 web/admin compose 와 합치기 쉽습니다.

### 사전 준비
- `.env.db` 파일이 프로젝트 루트에 있어야 합니다 (gitignore 처리됨).
  - `DB_USER`, `DB_PASSWORD`, `REDIS_PASSWORD`

### 실행 명령어

| 동작 | Make | 원본 명령어 |
| --- | --- | --- |
| DB 시작 | `make db-up` | `docker compose -f docker-compose.db.yml --env-file .env.db up -d` |
| DB 중지 | `make db-down` | `docker compose -f docker-compose.db.yml down` |
| DB 로그 | `make db-logs` | `docker compose -f docker-compose.db.yml logs -f` |
| DB 초기화 (볼륨 삭제) | `make db-reset` | `docker compose -f docker-compose.db.yml down -v` |
| psql 접속 | `make db-psql` | `docker exec -it freshorder-db psql -U freshorder -d freshorder` |
| redis-cli 접속 | `make db-redis` | `docker exec -it freshorder-redis redis-cli -a <REDIS_PASSWORD>` |

### 접속 정보 (로컬)
- PostgreSQL: `localhost:5432` / DB `freshorder` / user `freshorder`
- Redis: `localhost:6379` (password 필요)
