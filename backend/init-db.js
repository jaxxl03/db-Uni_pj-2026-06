const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Render/Heroku 등 클라우드 DB 연결 시 필요
    }
});

const initQuery = `
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
    type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 샘플 데이터 (데이터가 없을 때만 삽입)
INSERT INTO users (username, balance)
SELECT 'Alice', 10000 WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'Alice');

INSERT INTO users (username, balance)
SELECT 'Bob', 5000 WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'Bob');
`;

async function initialize() {
    try {
        await pool.query(initQuery);
        console.log('✅ 데이터베이스 초기화 완료');
        process.exit(0);
    } catch (err) {
        console.error('❌ 데이터베이스 초기화 실패:', err);
        process.exit(1);
    }
}

initialize();
