// 게임 상태
let credits = 1000;
let bet = 10;
let isSpinning = false;
let isAutoSpinning = false;
let autoSpinRemaining = 0;

// 통계
let stats = {
    totalGames: 0,
    totalWins: 0,
    winStreak: 0,
    biggestWin: 0,
    jackpot: 5000
};

// 게임 히스토리
let history = [];
const MAX_HISTORY = 10;

// 슬롯 심볼들
const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '7️⃣'];

// DOM 요소
const creditsEl = document.getElementById('credits');
const betEl = document.getElementById('bet');
const winEl = document.getElementById('win');
const messageEl = document.getElementById('message');
const spinBtn = document.getElementById('spinBtn');
const increaseBetBtn = document.getElementById('increaseBet');
const decreaseBetBtn = document.getElementById('decreaseBet');
const maxBetBtn = document.getElementById('maxBet');
const resetBtn = document.getElementById('resetBtn');
const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');

// 새로운 기능 DOM 요소
const autoSpinBtn = document.getElementById('autoSpinBtn');
const stopAutoBtn = document.getElementById('stopAutoBtn');
const autoSpinCount = document.getElementById('autoSpinCount');
const autoInfo = document.getElementById('autoInfo');
const totalGamesEl = document.getElementById('totalGames');
const totalWinsEl = document.getElementById('totalWins');
const winRateEl = document.getElementById('winRate');
const winStreakEl = document.getElementById('winStreak');
const biggestWinEl = document.getElementById('biggestWin');
const jackpotEl = document.getElementById('jackpot');
const historyList = document.getElementById('historyList');

// 배당표 (높은 순서대로)
const payouts = {
    '7️⃣': 'JACKPOT',
    '⭐': 20,
    '🔔': 15,
    '🍇': 12,
    '🍊': 10,
    '🍋': 8,
    '🍒': 5
};

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

function playSpin() {
    playSound(200, 0.1);
}

function playWin() {
    playSound(523.25, 0.2);
    setTimeout(() => playSound(659.25, 0.2), 100);
    setTimeout(() => playSound(783.99, 0.3), 200);
}

function playJackpot() {
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
}

// 이벤트 리스너 추가
function addEventListeners() {
    spinBtn.addEventListener('click', spin);
    increaseBetBtn.addEventListener('click', increaseBet);
    decreaseBetBtn.addEventListener('click', decreaseBet);
    maxBetBtn.addEventListener('click', setMaxBet);
    resetBtn.addEventListener('click', resetGame);
    autoSpinBtn.addEventListener('click', startAutoSpin);
    stopAutoBtn.addEventListener('click', stopAutoSpin);
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
    jackpotEl.textContent = stats.jackpot;
}

// 히스토리 추가
function addToHistory(symbols, result, amount) {
    const historyItem = {
        symbols: symbols.join(' '),
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
        const itemClass = item.result === 'jackpot' ? 'jackpot' : (item.amount > 0 ? 'win' : 'lose');
        const amountText = item.amount > 0 ? `+${item.amount}` : item.amount;
        
        return `
            <div class="history-item ${itemClass}">
                <span class="history-symbols">${item.symbols}</span>
                <span class="history-amount ${amountClass}">${amountText}</span>
            </div>
        `;
    }).join('');
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

// 랜덤 심볼 선택
function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// 릴 업데이트
function updateReel(reelElement, symbol) {
    const symbolEl = reelElement.querySelector('.symbol');
    symbolEl.textContent = symbol;
}

// 스핀 애니메이션
function animateReel(reelElement, duration, finalSymbol) {
    return new Promise((resolve) => {
        reelElement.classList.add('spinning');
        const symbolEl = reelElement.querySelector('.symbol');
        
        const interval = setInterval(() => {
            symbolEl.textContent = getRandomSymbol();
        }, 100);
        
        setTimeout(() => {
            clearInterval(interval);
            symbolEl.textContent = finalSymbol; // 최종 심볼로 설정
            reelElement.classList.remove('spinning');
            resolve();
        }, duration);
    });
}

// 연속 승리 보너스 계산
function getStreakBonus() {
    if (stats.winStreak >= 10) return 1.5;
    if (stats.winStreak >= 5) return 1.25;
    if (stats.winStreak >= 3) return 1.1;
    return 1;
}

// 승리 확인
function checkWin(results) {
    const [symbol1, symbol2, symbol3] = results;
    
    // 잭팟! 7️⃣ 3개
    if (symbol1 === '7️⃣' && symbol2 === '7️⃣' && symbol3 === '7️⃣') {
        const jackpotAmount = stats.jackpot;
        stats.jackpot = 5000; // 잭팟 리셋
        return {
            win: true,
            amount: jackpotAmount,
            message: `🎰🎰🎰 잭팟!!! ${jackpotAmount} 크레딧 획득! 🎰🎰🎰`,
            isJackpot: true
        };
    }
    
    // 3개 모두 일치
    if (symbol1 === symbol2 && symbol2 === symbol3) {
        const multiplier = payouts[symbol1] || 5;
        const baseAmount = bet * multiplier;
        const streakBonus = getStreakBonus();
        const finalAmount = Math.floor(baseAmount * streakBonus);
        
        let message = `🎉 대박! ${symbol1} 3개 일치! ${finalAmount} 크레딧 획득!`;
        if (streakBonus > 1) {
            message += ` (${stats.winStreak}연승 보너스 +${Math.round((streakBonus - 1) * 100)}%)`;
        }
        
        return {
            win: true,
            amount: finalAmount,
            message: message,
            isJackpot: false
        };
    }
    
    // 2개 일치
    if (symbol1 === symbol2 || symbol2 === symbol3 || symbol1 === symbol3) {
        const baseAmount = Math.floor(bet * 1.5);
        const streakBonus = getStreakBonus();
        const finalAmount = Math.floor(baseAmount * streakBonus);
        
        let message = `👍 좋아요! 2개 일치! ${finalAmount} 크레딧 획득!`;
        if (streakBonus > 1) {
            message += ` (${stats.winStreak}연승 보너스)`;
        }
        
        return {
            win: true,
            amount: finalAmount,
            message: message,
            isJackpot: false
        };
    }
    
    // 패배
    return {
        win: false,
        amount: 0,
        message: '아쉽네요... 다시 도전해보세요!',
        isJackpot: false
    };
}

// 메시지 표시
function showMessage(message, isWin) {
    messageEl.textContent = message;
    messageEl.className = 'message';
    if (isWin) {
        messageEl.classList.add('win');
    } else if (message.includes('아쉽네요')) {
        messageEl.classList.add('lose');
    }
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 3000);
}

// 스핀
async function spin() {
    if (isSpinning) return;
    
    if (credits < bet) {
        showMessage('크레딧이 부족합니다!', false);
        return;
    }
    
    isSpinning = true;
    credits -= bet;
    winEl.textContent = '0';
    updateDisplay();
    
    // 버튼 비활성화
    disableButtons();
    
    messageEl.textContent = '스핀 중...';
    messageEl.className = 'message';
    
    playSpin();
    
    // 최종 결과를 먼저 결정
    const finalSymbol1 = getRandomSymbol();
    const finalSymbol2 = getRandomSymbol();
    const finalSymbol3 = getRandomSymbol();
    
    // 각 릴을 다른 시간에 멈추게 하여 더 현실적인 효과 (최종 심볼로 멈춤)
    const promise1 = animateReel(reel1, 1000, finalSymbol1);
    const promise2 = animateReel(reel2, 1500, finalSymbol2);
    const promise3 = animateReel(reel3, 2000, finalSymbol3);
    
    await Promise.all([promise1, promise2, promise3]);
    
    const results = [finalSymbol1, finalSymbol2, finalSymbol3];
    const result = checkWin(results);
    
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
        
        if (result.isJackpot) {
            playJackpot();
            addToHistory(results, 'jackpot', result.amount);
        } else {
            playWin();
            addToHistory(results, 'win', result.amount);
        }
        
        showMessage(result.message, true);
    } else {
        stats.winStreak = 0;
        playLose();
        addToHistory(results, 'lose', -bet);
        showMessage(result.message, false);
    }
    
    // 잭팟 자동 증가 (매 게임마다 베팅액의 5%가 잭팟에 추가)
    stats.jackpot += Math.floor(bet * 0.05);
    
    updateDisplay();
    updateStats();
    
    // 버튼 활성화
    enableButtons();
    
    isSpinning = false;
    
    // 크레딧이 0이 되면 게임 오버
    if (credits === 0) {
        showMessage('게임 오버! 리셋 버튼을 눌러주세요.', false);
        spinBtn.disabled = true;
        autoSpinBtn.disabled = true;
        return;
    }
    
    // 자동 스핀 중이면 계속
    if (isAutoSpinning && autoSpinRemaining > 0) {
        autoSpinRemaining--;
        updateAutoInfo();
        
        if (autoSpinRemaining > 0) {
            setTimeout(() => spin(), 1000);
        } else {
            stopAutoSpin();
        }
    }
}

// 자동 스핀 시작
function startAutoSpin() {
    const count = parseInt(autoSpinCount.value) || 10;
    autoSpinRemaining = count;
    isAutoSpinning = true;
    
    autoSpinBtn.style.display = 'none';
    stopAutoBtn.style.display = 'block';
    autoSpinCount.disabled = true;
    
    updateAutoInfo();
    spin();
}

// 자동 스핀 정지
function stopAutoSpin() {
    isAutoSpinning = false;
    autoSpinRemaining = 0;
    
    autoSpinBtn.style.display = 'block';
    stopAutoBtn.style.display = 'none';
    autoSpinCount.disabled = false;
    
    autoInfo.textContent = '';
}

// 자동 스핀 정보 업데이트
function updateAutoInfo() {
    if (isAutoSpinning && autoSpinRemaining > 0) {
        autoInfo.textContent = `남은 스핀: ${autoSpinRemaining}회`;
    } else {
        autoInfo.textContent = '';
    }
}

// 버튼 비활성화
function disableButtons() {
    spinBtn.disabled = true;
    increaseBetBtn.disabled = true;
    decreaseBetBtn.disabled = true;
    maxBetBtn.disabled = true;
    autoSpinBtn.disabled = true;
}

// 버튼 활성화
function enableButtons() {
    spinBtn.disabled = false;
    increaseBetBtn.disabled = false;
    decreaseBetBtn.disabled = false;
    maxBetBtn.disabled = false;
    autoSpinBtn.disabled = false;
}

// 게임 리셋
function resetGame() {
    stopAutoSpin();
    
    credits = 1000;
    bet = 10;
    winEl.textContent = '0';
    
    stats = {
        totalGames: 0,
        totalWins: 0,
        winStreak: 0,
        biggestWin: 0,
        jackpot: 5000
    };
    
    history = [];
    
    updateDisplay();
    updateStats();
    updateHistoryDisplay();
    
    updateReel(reel1, '🍒');
    updateReel(reel2, '🍒');
    updateReel(reel3, '🍒');
    
    messageEl.textContent = '행운을 빌어요!';
    messageEl.className = 'message';
    
    spinBtn.disabled = false;
    autoSpinBtn.disabled = false;
}

// 게임 시작
init();
