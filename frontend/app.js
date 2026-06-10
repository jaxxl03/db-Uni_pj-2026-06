// 백엔드가 배포된 주소 (로컬 테스트: http://localhost:5000, 배포 후에는 백엔드 URL로 수정 필요)
const BACKEND_URL = 'https://db-uni-pj-2026-06.onrender.com'; 

let currentUserId = null;

// 초기 로드 시 사용자 목록 가져오기
async function loadUsers() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users`);
        const users = await response.json();
        
        const select = document.getElementById('user-select');
        select.innerHTML = '<option value="">계정 선택</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.innerText = `${user.username} (잔액: ${user.balance.toLocaleString()}원)`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('사용자 목록을 가져오는 중 오류 발생:', error);
    }
}

// 선택된 사용자의 정보 및 내역 업데이트
async function loadUserAccountInfo() {
    const select = document.getElementById('user-select');
    currentUserId = select.value;

    if (!currentUserId) {
        document.getElementById('balance').innerText = '0';
        document.getElementById('history').innerHTML = '';
        return;
    }

    try {
        // 사용자 잔액 정보 업데이트 (목록 재요청 또는 특정 API)
        const userResponse = await fetch(`${BACKEND_URL}/api/users`);
        const users = await userResponse.json();
        const user = users.find(u => u.id == currentUserId);
        
        if (user) {
            document.getElementById('balance').innerText = user.balance.toLocaleString();
        }

        // 거래 내역 조회
        const historyResponse = await fetch(`${BACKEND_URL}/api/users/${currentUserId}/history`);
        const history = await historyResponse.json();
        
        const historyList = document.getElementById('history');
        historyList.innerHTML = '';
        history.forEach(log => {
            const li = document.createElement('li');
            const date = new Date(log.created_at).toLocaleString();
            li.innerText = `[${date}] ${log.type === 'deposit' ? '입금' : '출금'}: ${log.amount.toLocaleString()}원`;
            historyList.appendChild(li);
        });
    } catch (error) {
        console.error('데이터 조회 중 오류 발생:', error);
    }
}

// 입출금 요청 함수
async function handleTransaction(type) {
    if (!currentUserId) return alert('먼저 계정을 선택하세요.');
    
    const amountInput = document.getElementById('amount');
    const amount = amountInput.value;

    if (!amount || amount <= 0) return alert('유효한 금액을 입력하세요.');

    try {
        const response = await fetch(`${BACKEND_URL}/api/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, type, amount })
        });

        const result = await response.json();
        alert(result.message);

        if (result.success) {
            amountInput.value = '';
            loadUsers(); // 목록 갱신 (잔액 포함)
            loadUserAccountInfo(); // 내역 갱신
        }
    } catch (error) {
        alert('서버와 통신 중 오류가 발생했습니다.');
    }
}

// 초기 로드
window.onload = loadUsers;