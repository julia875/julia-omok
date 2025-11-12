// 게임 상태
let board = [];
const BOARD_SIZE = 15;
let currentPlayer = 'black'; // 'black' 또는 'white'
let gameOver = false;
let winningCells = [];
let isAIMode = true; // AI 모드 활성화
const HUMAN_PLAYER = 'black'; // 사용자는 흑돌
const AI_PLAYER = 'white'; // AI는 백돌

// 보드 초기화
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = null;
        }
    }
}

// SVG 바둑돌 생성
function createStoneSVG(type, isWinning = false) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('class', `stone-svg ${type}-stone ${isWinning ? 'winning' : ''}`);
    
    // 고유한 그라데이션 ID 생성
    const uniqueId = `${type}Gradient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 그라데이션 정의
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    if (type === 'black') {
        // 흑돌 그라데이션
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', uniqueId);
        gradient.setAttribute('cx', '30%');
        gradient.setAttribute('cy', '30%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#4a4a4a');
        gradient.appendChild(stop1);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#1a1a1a');
        gradient.appendChild(stop2);
        
        defs.appendChild(gradient);
    } else {
        // 백돌 그라데이션
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', uniqueId);
        gradient.setAttribute('cx', '30%');
        gradient.setAttribute('cy', '30%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ffffff');
        gradient.appendChild(stop1);
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#e8e8e8');
        gradient.appendChild(stop2);
        
        defs.appendChild(gradient);
    }
    
    svg.appendChild(defs);
    
    // 원 그리기
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '45');
    
    if (type === 'black') {
        circle.setAttribute('fill', `url(#${uniqueId})`);
    } else {
        circle.setAttribute('fill', `url(#${uniqueId})`);
        circle.setAttribute('stroke', '#ccc');
        circle.setAttribute('stroke-width', '1');
    }
    
    svg.appendChild(circle);
    
    // 반사 효과 (하이라이트)
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    highlight.setAttribute('cx', '35');
    highlight.setAttribute('cy', '35');
    highlight.setAttribute('rx', '15');
    highlight.setAttribute('ry', '20');
    highlight.setAttribute('fill', type === 'black' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)');
    highlight.setAttribute('opacity', '0.8');
    svg.appendChild(highlight);
    
    return svg;
}

// 보드 렌더링
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            if (board[i][j]) {
                cell.classList.add(board[i][j]);
                const isWinning = winningCells.some(([r, c]) => r === i && c === j);
                const stone = createStoneSVG(board[i][j], isWinning);
                cell.appendChild(stone);
            }
            
            cell.addEventListener('click', () => handleCellClick(i, j));
            boardElement.appendChild(cell);
        }
    }
}

// 셀 클릭 처리
function handleCellClick(row, col) {
    // AI 모드에서 AI 차례일 때는 클릭 무시
    if (isAIMode && currentPlayer === AI_PLAYER) {
        return;
    }
    
    if (gameOver || board[row][col]) {
        return;
    }
    
    // 돌 놓기
    placeStone(row, col);
}

// 돌 놓기 (공통 함수)
function placeStone(row, col) {
    if (gameOver || board[row][col]) {
        return false;
    }
    
    board[row][col] = currentPlayer;
    renderBoard();
    
    // 승리 확인
    if (checkWin(row, col)) {
        gameOver = true;
        const playerName = currentPlayer === 'black' ? '흑돌' : '백돌';
        showMessage(`${playerName} 승리!`);
        highlightWinningCells();
        return true;
    }
    
    // 무승부 확인 (보드가 가득 찬 경우)
    if (isBoardFull()) {
        gameOver = true;
        showMessage('무승부입니다!');
        return true;
    }
    
    // 다음 플레이어로 전환
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateCurrentPlayer();
    
    // AI 모드이고 AI 차례면 AI가 돌 놓기
    if (isAIMode && currentPlayer === AI_PLAYER && !gameOver) {
        setTimeout(() => {
            aiMakeMove();
        }, 500); // 0.5초 후 AI가 돌 놓기
    }
    
    return true;
}

// 승리 조건 확인
function checkWin(row, col) {
    const directions = [
        [[0, 1], [0, -1]],   // 가로
        [[1, 0], [-1, 0]],   // 세로
        [[1, 1], [-1, -1]],  // 대각선 (왼쪽 위에서 오른쪽 아래)
        [[1, -1], [-1, 1]]   // 대각선 (오른쪽 위에서 왼쪽 아래)
    ];
    
    for (let dir of directions) {
        let count = 1; // 현재 돌 포함
        let cells = [[row, col]];
        
        // 양방향으로 확인
        for (let [dx, dy] of dir) {
            let newRow = row + dx;
            let newCol = col + dy;
            
            while (
                newRow >= 0 && newRow < BOARD_SIZE &&
                newCol >= 0 && newCol < BOARD_SIZE &&
                board[newRow][newCol] === currentPlayer
            ) {
                count++;
                cells.push([newRow, newCol]);
                newRow += dx;
                newCol += dy;
            }
        }
        
        if (count >= 5) {
            winningCells = cells;
            return true;
        }
    }
    
    return false;
}

// 승리한 돌 강조 표시
function highlightWinningCells() {
    // 보드를 다시 렌더링하여 승리한 돌에 애니메이션 적용
    renderBoard();
    winningCells.forEach(([row, col]) => {
        const cell = document.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
            cell.style.backgroundColor = '#ffd700';
            cell.style.transition = 'background-color 0.3s';
        }
    });
}

// 보드가 가득 찬지 확인
function isBoardFull() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board[i][j]) {
                return false;
            }
        }
    }
    return true;
}

// 현재 플레이어 업데이트
function updateCurrentPlayer() {
    const currentPlayerElement = document.getElementById('currentPlayer');
    currentPlayerElement.textContent = currentPlayer === 'black' ? '흑돌' : '백돌';
    currentPlayerElement.style.color = currentPlayer === 'black' ? '#1a1a1a' : '#667eea';
}

// 메시지 표시
function showMessage(text) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.classList.add('winner');
}

// AI가 돌을 놓을 위치 평가
function evaluatePosition(row, col, player) {
    if (board[row][col] !== null) return -1;
    
    let score = 0;
    const directions = [
        [[0, 1], [0, -1]],   // 가로
        [[1, 0], [-1, 0]],   // 세로
        [[1, 1], [-1, -1]],  // 대각선 (왼쪽 위에서 오른쪽 아래)
        [[1, -1], [-1, 1]]   // 대각선 (오른쪽 위에서 왼쪽 아래)
    ];
    
    // 임시로 돌 놓기
    board[row][col] = player;
    
    for (let dir of directions) {
        let count = 1;
        
        // 양방향으로 확인
        for (let [dx, dy] of dir) {
            let newRow = row + dx;
            let newCol = col + dy;
            
            while (
                newRow >= 0 && newRow < BOARD_SIZE &&
                newCol >= 0 && newCol < BOARD_SIZE &&
                board[newRow][newCol] === player
            ) {
                count++;
                newRow += dx;
                newCol += dy;
            }
        }
        
        // 점수 계산
        if (count >= 5) {
            score += 10000; // 승리
        } else if (count === 4) {
            score += 1000; // 4개 연속
        } else if (count === 3) {
            score += 100; // 3개 연속
        } else if (count === 2) {
            score += 10; // 2개 연속
        }
    }
    
    // 임시 돌 제거
    board[row][col] = null;
    
    return score;
}

// AI가 최선의 수 찾기
function findBestMove() {
    let bestScore = -1;
    let bestMoves = [];
    
    // 중앙에 가까운 곳에 가중치 부여
    const center = Math.floor(BOARD_SIZE / 2);
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== null) continue;
            
            // 공격 점수 (AI가 이길 수 있는 곳)
            let attackScore = evaluatePosition(i, j, AI_PLAYER);
            
            // 방어 점수 (상대가 이길 수 있는 곳 막기)
            let defenseScore = evaluatePosition(i, j, HUMAN_PLAYER);
            
            // 중앙 거리 가중치
            const distanceFromCenter = Math.abs(i - center) + Math.abs(j - center);
            const centerWeight = (BOARD_SIZE - distanceFromCenter) * 2;
            
            // 최종 점수 (방어가 더 중요하지만 공격도 고려)
            let totalScore = attackScore * 1.2 + defenseScore * 1.5 + centerWeight;
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMoves = [[i, j]];
            } else if (totalScore === bestScore) {
                bestMoves.push([i, j]);
            }
        }
    }
    
    // 최선의 수 중에서 랜덤 선택
    if (bestMoves.length > 0) {
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    
    // 빈 곳이 없으면 null 반환
    return null;
}

// AI가 돌 놓기
function aiMakeMove() {
    if (gameOver || currentPlayer !== AI_PLAYER) {
        return;
    }
    
    const bestMove = findBestMove();
    
    if (bestMove) {
        const [row, col] = bestMove;
        placeStone(row, col);
    }
}

// 게임 재시작
function resetGame() {
    initBoard();
    currentPlayer = 'black';
    gameOver = false;
    winningCells = [];
    renderBoard();
    updateCurrentPlayer();
    document.getElementById('message').textContent = '';
    document.getElementById('message').classList.remove('winner');
}

// 초기화
function init() {
    initBoard();
    renderBoard();
    updateCurrentPlayer();
    
    document.getElementById('resetBtn').addEventListener('click', resetGame);
}

// 페이지 로드 시 게임 시작
init();

