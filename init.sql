-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    balance INTEGER DEFAULT 0
);

-- transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'deposit' or 'withdraw'
    amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 샘플 데이터 삽입
INSERT INTO users (username, balance) VALUES ('Alice', 10000);
INSERT INTO users (username, balance) VALUES ('Bob', 5000);
