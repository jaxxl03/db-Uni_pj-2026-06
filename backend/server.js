const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL 연결 설정
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 1. 전체 사용자 목록 및 잔액 조회 API
app.get('/api/users', async (req, res) => {
    res.json({ status: "healthy", message: "Bank Service API Server is running." });
    try {
        const result = await pool.query('SELECT id, username, balance FROM users ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, message: '사용자 조회 실패' });
    }
});

// 2. 특정 사용자의 거래 내역 조회 API (JOIN 활용)
app.get('/api/users/:userId/history', async (req, res) => {
    const { userId } = req.params;
    try {
        const queryText = `
            SELECT t.id, t.type, t.amount, t.created_at 
            FROM transactions t
            WHERE t.user_id = $1 
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(queryText, [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, message: '내역 조회 실패' });
    }
});

// 3. 입출금 처리 API (★핵심: DB 트랜잭션 적용)
app.post('/api/transaction', async (req, res) => {
    const { userId, type, amount } = req.body;
    const parsedAmount = parseInt(amount);

    if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: '유효하지 않은 요청 데이터입니다.' });
    }

    // 커넥션 풀에서 하나의 클라이언트 세션 확보
    const client = await pool.connect();

    try {
        // [트랜잭션 시작]
        await client.query('BEGIN');

        // 단계 1: 해당 사용자의 현재 잔액 조회 (FOR UPDATE로 동시성 제어 - Row Lock)
        const userCheck = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
        if (userCheck.rows.length === 0) {
            throw new Error('존재하지 않는 계정입니다.');
        }

        const currentBalance = parseInt(userCheck.rows[0].balance);

        // 단계 2: 출금 시 잔액 검증
        if (type === 'withdraw' && currentBalance < parsedAmount) {
            throw new Error('잔액이 부족하여 출금할 수 없습니다.');
        }

        // 단계 3: 사용자 잔액 계산 및 업데이트
        let newBalance = currentBalance;
        if (type === 'deposit') {
            newBalance += parsedAmount;
        } else if (type === 'withdraw') {
            newBalance -= parsedAmount;
        }

        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);

        // 단계 4: 거래 내역(Transaction Log) 저장
        await client.query(
            'INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)',
            [userId, type, parsedAmount]
        );

        // [트랜잭션 성공 반영]
        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${type === 'deposit' ? '입금' : '출금'} 처리가 완료되었습니다.`,
            balance: newBalance
        });

    } catch (error) {
        // [트랜잭션 실패 시 모든 작업 취소]
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: error.message });
    } finally {
        // 사용한 클라이언트 반환
        client.release();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버 실행 중: 포트 ${PORT}`));