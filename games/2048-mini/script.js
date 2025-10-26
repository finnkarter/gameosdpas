// 게임 상태
let grid = [];
let score = 0;
let bestScore = 0;
let previousState = null;
const gridSize = 4;
let moveCount = 0;
let mergedCells = [];
let hasWon2048 = false;
let animating = false;
let comboCount = 0;
let highestTile = 0;
let gameStartTime = Date.now();
let undoCount = 3;

// 초기화
function initGame() {
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    score = 0;
    moveCount = 0;
    previousState = null;
    hasWon2048 = false;
    animating = false;
    comboCount = 0;
    highestTile = 0;
    gameStartTime = Date.now();
    undoCount = 3;
    
    document.getElementById('gameOver').classList.remove('show');
    addRandomTile();
    addRandomTile();
    updateDisplay();
    updateUndoButton();
}

// 랜덤 타일 추가
function addRandomTile() {
    const emptyCells = [];
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({i, j});
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        // 10% 확률로 4, 나머지는 2
        grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        return {i, j};
    }
    return null;
}

// 그리드 회전
function rotateGrid(times) {
    for (let t = 0; t < times; t++) {
        const newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                newGrid[j][gridSize - 1 - i] = grid[i][j];
            }
        }
        grid = newGrid;
    }
}

// 왼쪽으로 이동 및 합치기
function moveLeft() {
    let moved = false;
    let mergeThisTurn = 0;
    mergedCells = [];
    
    for (let i = 0; i < gridSize; i++) {
        const row = grid[i].filter(val => val !== 0);
        const newRow = [];
        
        for (let j = 0; j < row.length; j++) {
            if (j < row.length - 1 && row[j] === row[j + 1]) {
                const mergedValue = row[j] * 2;
                newRow.push(mergedValue);
                score += mergedValue;
                mergedCells.push({i, j: newRow.length - 1, value: mergedValue});
                j++;
                moved = true;
                mergeThisTurn++;
                
                // 최고 타일 업데이트
                if (mergedValue > highestTile) {
                    highestTile = mergedValue;
                }
                
                // 2048 달성!
                if (mergedValue === 2048 && !hasWon2048) {
                    hasWon2048 = true;
                    setTimeout(() => {
                        showCustomAlert('🎉 You reached 2048! Keep going!');
                    }, 300);
                }
            } else {
                newRow.push(row[j]);
            }
        }
        
        while (newRow.length < gridSize) {
            newRow.push(0);
        }
        
        if (JSON.stringify(grid[i]) !== JSON.stringify(newRow)) {
            moved = true;
        }
        
        grid[i] = newRow;
    }
    
    // 콤보 체크
    if (mergeThisTurn >= 2) {
        comboCount++;
        showCombo(mergeThisTurn);
    } else {
        comboCount = 0;
    }
    
    return moved;
}

// 이동
function move(direction) {
    if (animating) return;
    
    previousState = {
        grid: JSON.parse(JSON.stringify(grid)),
        score: score,
        moveCount: moveCount,
        highestTile: highestTile
    };

    const rotations = {
        'left': 0,
        'up': 1,
        'right': 2,
        'down': 3
    };

    const rotation = rotations[direction];
    rotateGrid(rotation);
    const moved = moveLeft();
    rotateGrid(4 - rotation);

    if (moved) {
        moveCount++;
        animating = true;
        
        // 스코어 하이라이트
        document.getElementById('score').parentElement.classList.add('highlight');
        setTimeout(() => {
            document.getElementById('score').parentElement.classList.remove('highlight');
        }, 500);
        
        setTimeout(() => {
            const newTile = addRandomTile();
            updateDisplay(newTile);
            animating = false;
            
            if (isGameOver()) {
                endGame();
            }
        }, 150);
    }
}

// 게임 오버 체크
function isGameOver() {
    // 빈 칸이 있으면 게임 계속
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === 0) return false;
        }
    }
    
    // 합칠 수 있는 타일이 있으면 게임 계속
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const current = grid[i][j];
            if ((j < gridSize - 1 && current === grid[i][j + 1]) ||
                (i < gridSize - 1 && current === grid[i + 1][j])) {
                return false;
            }
        }
    }
    
    return true;
}

// 게임 종료
function endGame() {
    const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const minutes = Math.floor(playTime / 60);
    const seconds = playTime % 60;
    
    const efficiency = moveCount > 0 ? Math.floor(score / moveCount) : 0;
    
    document.getElementById('gameOverScore').textContent = score;
    document.getElementById('gameOverMoves').textContent = moveCount;
    document.getElementById('gameOverTile').textContent = highestTile;
    document.getElementById('gameOverTime').textContent = `${minutes}m ${seconds}s`;
    document.getElementById('gameOverEfficiency').textContent = efficiency;
    
    document.getElementById('gameOver').classList.add('show');
    
    // 하이스코어 저장
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048Best', bestScore);
    }
    
    // 게임 기록 저장
    saveGameStats();
}

// 화면 업데이트
function updateDisplay(newTilePos = null) {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';
    
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const value = grid[i][j];
            
            if (value !== 0) {
                cell.textContent = value;
                cell.setAttribute('data-value', value);
                
                // 새로 생성된 타일 애니메이션
                if (newTilePos && newTilePos.i === i && newTilePos.j === j) {
                    cell.classList.add('new');
                }
                
                // 합쳐진 타일 애니메이션
                const merged = mergedCells.find(m => m.i === i && m.j === j);
                if (merged) {
                    cell.classList.add('merged');
                    
                    // 콤보 시각 효과
                    if (comboCount > 0) {
                        cell.classList.add('combo');
                    }
                }
            }
            gridEl.appendChild(cell);
        }
    }
    
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moveCount;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048Best', bestScore);
    }
    document.getElementById('best').textContent = bestScore;
}

// 콤보 표시
function showCombo(mergeCount) {
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.textContent = `${mergeCount}x COMBO!`;
    comboDisplay.classList.add('show');
    
    setTimeout(() => {
        comboDisplay.classList.remove('show');
    }, 800);
}

// 커스텀 알림
function showCustomAlert(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const alert = document.createElement('div');
    alert.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        color: #776e65;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    alert.textContent = message;
    
    overlay.appendChild(alert);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
    }, 2000);
}

// Undo 기능
function undo() {
    if (previousState && undoCount > 0) {
        grid = JSON.parse(JSON.stringify(previousState.grid));
        score = previousState.score;
        moveCount = previousState.moveCount;
        highestTile = previousState.highestTile;
        previousState = null;
        undoCount--;
        
        updateDisplay();
        updateUndoButton();
    }
}

// Undo 버튼 업데이트
function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.textContent = `Undo (${undoCount})`;
        undoBtn.disabled = undoCount === 0 || !previousState;
    }
}

// 힌트 표시
function showHint() {
    const bestMove = calculateBestMove();
    if (bestMove) {
        const arrows = {
            'left': '← Left',
            'right': '→ Right',
            'up': '↑ Up',
            'down': '↓ Down'
        };
        showCustomAlert(`Hint: Try ${arrows[bestMove]}`);
    }
}

// 최적 이동 계산 (간단한 휴리스틱)
function calculateBestMove() {
    const moves = ['left', 'up', 'right', 'down'];
    let bestMove = null;
    let bestScore = -1;
    
    for (const direction of moves) {
        const tempGrid = JSON.parse(JSON.stringify(grid));
        const tempState = { grid: tempGrid, score: 0 };
        
        // 시뮬레이션
        const rotations = { 'left': 0, 'up': 1, 'right': 2, 'down': 3 };
        const rotation = rotations[direction];
        
        // 간단한 평가: 빈 칸 수
        let emptyCount = 0;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (tempGrid[i][j] === 0) emptyCount++;
            }
        }
        
        if (emptyCount > bestScore) {
            bestScore = emptyCount;
            bestMove = direction;
        }
    }
    
    return bestMove;
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    const keyMap = {
        'ArrowLeft': 'left',
        'ArrowUp': 'up',
        'ArrowRight': 'right',
        'ArrowDown': 'down',
        'a': 'left',
        'w': 'up',
        'd': 'right',
        's': 'down'
    };
    
    if (keyMap[e.key]) {
        e.preventDefault();
        move(keyMap[e.key]);
    }
    
    // Undo: Z키
    if (e.key === 'z' && !e.ctrlKey) {
        e.preventDefault();
        undo();
    }
});

// 터치 스와이프 지원
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        move(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) > 50) {
        move(dy > 0 ? 'down' : 'up');
    }
});

// 게임 통계 저장
function saveGameStats() {
    const stats = {
        totalGames: parseInt(localStorage.getItem('2048TotalGames') || 0) + 1,
        totalScore: parseInt(localStorage.getItem('2048TotalScore') || 0) + score,
        totalMoves: parseInt(localStorage.getItem('2048TotalMoves') || 0) + moveCount
    };
    
    localStorage.setItem('2048TotalGames', stats.totalGames);
    localStorage.setItem('2048TotalScore', stats.totalScore);
    localStorage.setItem('2048TotalMoves', stats.totalMoves);
}

// 버튼 이벤트
document.getElementById('newGame').addEventListener('click', initGame);
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('hintBtn')?.addEventListener('click', showHint);

// 로컬 스토리지에서 베스트 스코어 불러오기
bestScore = parseInt(localStorage.getItem('2048Best')) || 0;

// 게임 시작
initGame();
