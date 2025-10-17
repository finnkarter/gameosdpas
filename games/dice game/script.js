// 게임 상태
let credits = 1000;
let bet = 10;
let isRolling = false;
let selectedBet = null;

// 통계
let stats = {
    totalGames: 0,
    totalWins: 0,
    winStreak: 0,
    biggestWin: 0,
    doubleCount: 0
};

// 게임 히스토리
let history = [];
const MAX_HISTORY = 10;

// DOM 요소
const creditsEl = document.getElementById('credits');
const betEl = document.getElementById('bet');
const winEl = document.getElementById('win');
const messageEl = document.getElementById('message');
const rollBtn = document.getElementById('rollBtn');
const increaseBetBtn = document.getElementById('increaseBet');
const decreaseBetBtn = document.getElementById('decreaseBet');
const maxBetBtn = document.getElementById('maxBet');
const resetBtn = document.getElementById('resetBtn');
const dice1El = document.getElementById('dice1');
const dice2El = document.getElementById('dice2');
const totalSumEl = document.getElementById('totalSum');
const diceValuesEl = document.getElementById('diceValues');

// 통계 DOM 요소
const totalGamesEl = document.getElementById('totalGames');
const totalWinsEl = document.getElementById('totalWins');
const winRateEl = document.getElementById('winRate');
const winStreakEl = document.getElementById('winStreak');
const biggestWinEl = document.getElementById('biggestWin');
const doubleCountEl = document.getElementById('doubleCount');
const historyList = document.getElementById('historyList');

// 베팅 옵션 버튼들
const betOptions = document.querySelectorAll('.bet-option');

// Web Audio API를 사용한 간단한 효과음
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playRoll() {
    playSound(300, 0.1);
    setTimeout(() => playSound(400, 0.1), 100);
}

function playWin() {
    playSound(523.25, 0.2);
    setTimeout(() => playSound(659.25, 0.2), 100);
    setTimeout(() => playSound(783.99, 0.3), 200);
}

function playBigWin() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            playSound(523.25 + i * 100, 0.2);
        }, i * 100);
    }
}

function playLose() {
    playSound(200, 0.3, 'sawtooth');
}

// 초기화
function init() {
    updateDisplay();
    updateStats();
    addEventListeners();
    updateHistoryDisplay();
}

// 이벤트 리스너 추가
function addEventListeners() {
    rollBtn.addEventListener('click', rollDice);
    increaseBetBtn.addEventListener('click', increaseBet);
    decreaseBetBtn.addEventListener('click', decreaseBet);
    maxBetBtn.addEventListener('click', setMaxBet);
    resetBtn.addEventListener('click', resetGame);
    
    betOptions.forEach(option => {
        option.addEventListener('click', () => selectBet(option));
    });
}

// 베팅 선택
function selectBet(option) {
    if (isRolling) return;
    
    betOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    selectedBet = option.dataset.type;
    rollBtn.disabled = false;
}

// 디스플레이 업데이트
function updateDisplay() {
    creditsEl.textContent = credits;
    betEl.textContent = bet;
}

// 통계 업데이트
function updateStats() {
    totalGamesEl.textContent = stats.totalGames;
    totalWinsEl.textContent = stats.totalWins;
    const winRate = stats.totalGames > 0 ? ((stats.totalWins / stats.totalGames) * 100).toFixed(1) : 0;
    winRateEl.textContent = winRate + '%';
    winStreakEl.textContent = stats.winStreak;
    biggestWinEl.textContent = stats.biggestWin;
    doubleCountEl.textContent = stats.doubleCount;
}

// 히스토리 추가
function addToHistory(dice1, dice2, sum, betType, result, amount) {
    const historyItem = {
        dice: `🎲 ${dice1} + ${dice2} = ${sum}`,
        bet: betType,
        result: result,
        amount: amount,
        timestamp: new Date().toLocaleTimeString()
    };
    
    history.unshift(historyItem);
    if (history.length > MAX_HISTORY) {
        history.pop();
    }
    
    updateHistoryDisplay();
}

// 히스토리 표시 업데이트
function updateHistoryDisplay() {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">아직 게임 기록이 없습니다</div>';
        return;
    }
    
    historyList.innerHTML = history.map(item => {
        const amountClass = item.amount > 0 ? 'positive' : 'negative';
        const itemClass = item.result === 'double' ? 'double' : (item.amount > 0 ? 'win' : 'lose');
        const amountText = item.amount > 0 ? `+${item.amount}` : item.amount;
        
        return `
            <div class="history-item ${itemClass}">
                <div>
                    <div class="history-dice">${item.dice}</div>
                    <div class="history-bet">${getBetName(item.bet)}</div>
                </div>
                <span class="history-amount ${amountClass}">${amountText}</span>
            </div>
        `;
    }).join('');
}

// 베팅 타입 이름 가져오기
function getBetName(type) {
    const names = {
        'low': 'LOW (2-6)',
        'seven': 'SEVEN (7)',
        'high': 'HIGH (8-12)',
        'double': '더블',
        'odd': '홀수',
        'even': '짝수'
    };
    return names[type] || type;
}

// 베팅 증가
function increaseBet() {
    if (bet < credits && bet < 100) {
        bet += 10;
        updateDisplay();
    }
}

// 베팅 감소
function decreaseBet() {
    if (bet > 10) {
        bet -= 10;
        updateDisplay();
    }
}

// 최대 베팅
function setMaxBet() {
    bet = Math.min(100, credits);
    updateDisplay();
}

// 랜덤 주사위 값
function getRandomDiceValue() {
    return Math.floor(Math.random() * 6) + 1;
}

// 주사위 표시
function displayDice(diceElement, value) {
    const diceFace = diceElement.querySelector('.dice-face');
    diceFace.className = 'dice-face face-' + value;
    
    // 점 제거
    diceFace.innerHTML = '';
    
    // 점 추가
    for (let i = 0; i < value; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        diceFace.appendChild(dot);
    }
}

// 주사위 굴리기 애니메이션
function animateDice(diceElement, finalValue) {
    return new Promise((resolve) => {
        diceElement.classList.add('rolling');
        
        let count = 0;
        const interval = setInterval(() => {
            displayDice(diceElement, getRandomDiceValue());
            count++;
            
            if (count >= 10) {
                clearInterval(interval);
                displayDice(diceElement, finalValue);
                diceElement.classList.remove('rolling');
                resolve();
            }
        }, 100);
    });
}

// 승리 확인
function checkWin(dice1, dice2, sum, betType) {
    const isDouble = dice1 === dice2;
    let win = false;
    let multiplier = 0;
    let message = '';
    
    // 베팅 타입에 따른 승리 확인
    switch(betType) {
        case 'low':
            win = sum >= 2 && sum <= 6;
            multiplier = 2;
            message = win ? `LOW 승리! (합: ${sum})` : `LOW 패배... (합: ${sum})`;
            break;
        case 'seven':
            win = sum === 7;
            multiplier = 5;
            message = win ? `SEVEN 대박! (합: ${sum})` : `SEVEN 패배... (합: ${sum})`;
            break;
        case 'high':
            win = sum >= 8 && sum <= 12;
            multiplier = 2;
            message = win ? `HIGH 승리! (합: ${sum})` : `HIGH 패배... (합: ${sum})`;
            break;
        case 'double':
            win = isDouble;
            multiplier = 10;
            message = win ? `더블 대박! (${dice1}, ${dice2})` : `더블 패배... (${dice1}, ${dice2})`;
            break;
        case 'odd':
            win = sum % 2 === 1;
            multiplier = 2;
            message = win ? `홀수 승리! (합: ${sum})` : `홀수 패배... (합: ${sum})`;
            break;
        case 'even':
            win = sum % 2 === 0;
            multiplier = 2;
            message = win ? `짝수 승리! (합: ${sum})` : `짝수 패배... (합: ${sum})`;
            break;
    }
    
    // 더블 보너스 (다른 베팅에서 이기고 더블도 나온 경우)
    let doubleBonus = 0;
    if (win && isDouble && betType !== 'double') {
        doubleBonus = bet * 5;
        message += ` + 더블 보너스!`;
    }
    
    const amount = win ? (bet * multiplier) + doubleBonus : 0;
    
    return {
        win: win,
        amount: amount,
        message: message,
        isDouble: isDouble
    };
}

// 메시지 표시
function showMessage(message, isWin) {
    messageEl.textContent = message;
    messageEl.className = 'message';
    if (isWin) {
        messageEl.classList.add('win');
    } else {
        messageEl.classList.add('lose');
    }
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 3000);
}

// 주사위 굴리기
async function rollDice() {
    if (isRolling || !selectedBet) return;
    
    if (credits < bet) {
        showMessage('크레딧이 부족합니다!', false);
        return;
    }
    
    isRolling = true;
    credits -= bet;
    winEl.textContent = '0';
    updateDisplay();
    
    // 버튼 비활성화
    disableButtons();
    
    messageEl.textContent = '주사위 굴리는 중...';
    messageEl.className = 'message';
    
    playRoll();
    
    // 최종 주사위 값 결정
    const finalDice1 = getRandomDiceValue();
    const finalDice2 = getRandomDiceValue();
    
    // 주사위 애니메이션
    await Promise.all([
        animateDice(dice1El, finalDice1),
        animateDice(dice2El, finalDice2)
    ]);
    
    const sum = finalDice1 + finalDice2;
    
    // 결과 표시
    totalSumEl.textContent = `합계: ${sum}`;
    diceValuesEl.textContent = `🎲 ${finalDice1} + ${finalDice2}`;
    
    // 승리 확인
    const result = checkWin(finalDice1, finalDice2, sum, selectedBet);
    
    // 통계 업데이트
    stats.totalGames++;
    
    if (result.win) {
        stats.totalWins++;
        stats.winStreak++;
        credits += result.amount;
        winEl.textContent = result.amount;
        
        if (result.amount > stats.biggestWin) {
            stats.biggestWin = result.amount;
        }
        
        if (result.isDouble) {
            stats.doubleCount++;
        }
        
        if (result.amount >= bet * 5) {
            playBigWin();
        } else {
            playWin();
        }
        
        addToHistory(finalDice1, finalDice2, sum, selectedBet, result.isDouble ? 'double' : 'win', result.amount);
        showMessage(result.message, true);
    } else {
        stats.winStreak = 0;
        playLose();
        addToHistory(finalDice1, finalDice2, sum, selectedBet, 'lose', -bet);
        showMessage(result.message, false);
    }
    
    updateDisplay();
    updateStats();
    
    // 버튼 활성화
    enableButtons();
    
    isRolling = false;
    
    // 크레딧이 0이 되면 게임 오버
    if (credits === 0) {
        showMessage('게임 오버! 리셋 버튼을 눌러주세요.', false);
        rollBtn.disabled = true;
        return;
    }
}

// 버튼 비활성화
function disableButtons() {
    rollBtn.disabled = true;
    increaseBetBtn.disabled = true;
    decreaseBetBtn.disabled = true;
    maxBetBtn.disabled = true;
    betOptions.forEach(opt => opt.style.pointerEvents = 'none');
}

// 버튼 활성화
function enableButtons() {
    if (selectedBet) {
        rollBtn.disabled = false;
    }
    increaseBetBtn.disabled = false;
    decreaseBetBtn.disabled = false;
    maxBetBtn.disabled = false;
    betOptions.forEach(opt => opt.style.pointerEvents = 'auto');
}

// 게임 리셋
function resetGame() {
    credits = 1000;
    bet = 10;
    winEl.textContent = '0';
    selectedBet = null;
    
    stats = {
        totalGames: 0,
        totalWins: 0,
        winStreak: 0,
        biggestWin: 0,
        doubleCount: 0
    };
    
    history = [];
    
    updateDisplay();
    updateStats();
    updateHistoryDisplay();
    
    // 주사위 초기화
    displayDice(dice1El, 1);
    displayDice(dice2El, 1);
    
    totalSumEl.textContent = '합계: -';
    diceValuesEl.textContent = '';
    
    messageEl.textContent = '베팅을 선택하고 주사위를 굴려보세요!';
    messageEl.className = 'message';
    
    betOptions.forEach(opt => opt.classList.remove('selected'));
    rollBtn.disabled = true;
}

// 게임 시작 - DOM이 완전히 로드된 후에 실행
document.addEventListener('DOMContentLoaded', init);

