-- FreshOrder DB 초기화 스크립트
-- 컨테이너 최초 기동 시 1회 실행됨 (postgres 공식 이미지의 /docker-entrypoint-initdb.d 규칙)

-- UUID 생성 함수 (uuid_generate_v4 등) 사용을 위한 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 대소문자 무시 검색/조회용 (이메일, 이름 등)
CREATE EXTENSION IF NOT EXISTS "citext";
