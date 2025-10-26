// 단어 데이터베이스
const wordsByDifficulty = {
    easy: [
        'if', 'for', 'var', 'let', 'int', 'new', 'try', 'get', 'set', 'add',
        'del', 'map', 'key', 'val', 'obj', 'arr', 'str', 'num', 'def', 'end'
    ],
    medium: [
        'while', 'class', 'const', 'async', 'await', 'break', 'catch', 'throw',
        'import', 'export', 'return', 'switch', 'typeof', 'delete', 'static'
    ],
    hard: [
        'function', 'variable', 'interface', 'prototype', 'constructor', 'namespace',
        'implements', 'instanceof', 'addEventListener', 'setTimeout', 'debugger'
    ]
};

// 게임 상태
let game = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: 5,
    maxLives: 5,
    level: 1,
    exp: 0,
    expToNext: 100,
    activeWords: [],
    wordId: 0,
    gameActive: false,
    wordsTyped: 0,
    wordsMissed: 0,
    totalCharacters: 0,
    correctCharacters: 0,
    spawnInterval: null,
    moveInterval: null,
    difficulty: 'medium',
    baseSpeed: 0.5,
    currentSpeed: 0.5,
    spawnRate: 2000,
    startTime: null,
    streak: 0,
    maxStreak: 0,
    bonusWordsHit: 0,
    powerUps: {
        slowTime: 0,
        doublePoints: 0,
        shield: 0
    }
};

const input = document.getElementById('input');
const gameArea = document.getElementById('gameArea');

// 초기화
function init() {
    attachEventListeners();
    loadHighScore();
}

// 이벤트 리스너
function attachEventListeners() {
    document.getElementById('easyBtn').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('mediumBtn').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('hardBtn').addEventListener('click', () => setDifficulty('hard'));
    
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
}

// 난이도 설정
function setDifficulty(level) {
    game.difficulty = level;
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${level}Btn`).classList.add('active');
    
    // 난이도별 설정
    const settings = {
        easy: { baseSpeed: 0.3, spawnRate: 2500, maxLives: 7 },
        medium: { baseSpeed: 0.5, spawnRate: 2000, maxLives: 5 },
        hard: { baseSpeed: 0.8, spawnRate: 1500, maxLives: 3 }
    };
    
    const config = settings[level];
    game.baseSpeed = config.baseSpeed;
    game.spawnRate = config.spawnRate;
    game.maxLives = config.maxLives;
    
    if (game.gameActive) {
        startGame();
    }
}

// 게임 시작
function startGame() {
    game = {
        ...game,
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: game.maxLives,
        level: 1,
        exp: 0,
        expToNext: 100,
        activeWords: [],
        wordId: 0,
        gameActive: true,
        wordsTyped: 0,
        wordsMissed: 0,
        totalCharacters: 0,
        correctCharacters: 0,
        currentSpeed: game.baseSpeed,
        startTime: Date.now(),
        streak: 0,
        maxStreak: 0,
        bonusWordsHit: 0,
        powerUps: {
            slowTime: 0,
            doublePoints: 0,
            shield: 0
        }
    };

    document.getElementById('gameOver').classList.remove('show');
    gameArea.innerHTML = '';
    input.value = '';
    input.disabled = false;
    input.focus();
    updateDisplay();

    // 단어 생성
    if (game.spawnInterval) clearInterval(game.spawnInterval);
    game.spawnInterval = setInterval(spawnWord, game.spawnRate);
    
    // 단어 이동
    if (game.moveInterval) clearInterval(game.moveInterval);
    game.moveInterval = setInterval(moveWords, 50);
    
    // 레벨 업 시스템
    setInterval(() => {
        if (game.gameActive && game.exp >= game.expToNext) {
            levelUp();
        }
    }, 100);
}

// 단어 생성
function spawnWord() {
    if (!game.gameActive) return;

    // 10% 확률로 보너스 단어
    const isBonus = Math.random() < 0.1;
    
    let word;
    if (isBonus) {
        word = '⭐BONUS⭐';
    } else {
        const words = wordsByDifficulty[game.difficulty];
        word = words[Math.floor(Math.random() * words.length)];
    }
    
    const wordEl = document.createElement('div');
    wordEl.className = 'word';
    if (isBonus) wordEl.classList.add('bonus');
    wordEl.textContent = word;
    wordEl.id = `word-${game.wordId}`;
    wordEl.style.left = Math.random() * (gameArea.offsetWidth - 100) + 'px';
    wordEl.style.top = '0px';

    game.activeWords.push({
        id: game.wordId,
        text: word.toLowerCase().replace(/⭐/g, ''),
        displayText: word,
        element: wordEl,
        y: 0,
        isBonus: isBonus
    });

    gameArea.appendChild(wordEl);
    game.wordId++;
}

// 단어 이동
function moveWords() {
    if (!game.gameActive) return;

    const speedMultiplier = game.powerUps.slowTime > 0 ? 0.5 : 1;
    
    game.activeWords.forEach(word => {
        word.y += game.currentSpeed * speedMultiplier;
        word.element.style.top = word.y + 'px';

        // 하단에 도달
        if (word.y > gameArea.offsetHeight - 20) {
            removeWord(word.id, true);
            
            // 실드가 있으면 생명 보호
            if (game.powerUps.shield > 0) {
                game.powerUps.shield--;
                showPowerUpEffect('🛡️ Shield Protected!');
            } else {
                game.lives--;
                game.streak = 0;
            }
            
            game.combo = 0;
            game.wordsMissed++;
            
            // 화면 흔들기
            gameArea.style.animation = 'shake 0.3s';
            setTimeout(() => {
                gameArea.style.animation = '';
            }, 300);
            
            if (game.lives <= 0) {
                endGame();
            }
            
            updateDisplay();
        }
    });
    
    // 파워업 시간 감소
    if (game.powerUps.slowTime > 0) game.powerUps.slowTime -= 50;
    if (game.powerUps.doublePoints > 0) game.powerUps.doublePoints -= 50;
}

// 입력 처리
function handleInput(e) {
    const typed = e.target.value.trim().toLowerCase();
    
    if (typed === '') {
        game.activeWords.forEach(word => {
            word.element.style.color = '';
            word.element.classList.remove('partial');
        });
        return;
    }

    // 부분 일치 하이라이트
    let hasPartialMatch = false;
    game.activeWords.forEach(word => {
        if (word.text.startsWith(typed)) {
            word.element.classList.add('partial');
            hasPartialMatch = true;
        } else {
            word.element.classList.remove('partial');
        }
    });

    // 완전 일치
    const match = game.activeWords.find(w => w.text === typed);
    
    if (match) {
        handleWordTyped(match);
    }
}

// 키 입력 처리
function handleKeyDown(e) {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const typed = input.value.trim().toLowerCase();
        const match = game.activeWords.find(w => w.text === typed);
        
        if (match) {
            handleWordTyped(match);
        }
    }
}

// 단어 입력 성공
function handleWordTyped(match) {
    // 점수 계산
    let baseScore = match.text.length * 10;
    const comboBonus = game.combo * 5;
    const speedBonus = Math.floor((gameArea.offsetHeight - match.y) / 10);
    const levelBonus = game.level * 2;
    
    // 보너스 단어
    if (match.isBonus) {
        baseScore *= 5;
        game.bonusWordsHit++;
        spawnRandomPowerUp();
    }
    
    // 더블 포인트 파워업
    if (game.powerUps.doublePoints > 0) {
        baseScore *= 2;
    }
    
    let totalScore = baseScore + comboBonus + speedBonus + levelBonus;
    
    game.score += totalScore;
    game.combo++;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    game.wordsTyped++;
    game.correctCharacters += match.text.length;
    game.totalCharacters += match.text.length;
    game.exp += match.text.length * 5;
    game.streak++;
    game.maxStreak = Math.max(game.maxStreak, game.streak);
    
    // 시각 효과
    showFloatingScore(match.element, totalScore, match.isBonus);
    input.classList.add('correct');
    setTimeout(() => input.classList.remove('correct'), 300);
    
    // 콤보 표시
    if (game.combo >= 3) {
        updateComboIndicator();
    }
    
    removeWord(match.id, false);
    input.value = '';
    updateDisplay();
}

// 파워업 생성
function spawnRandomPowerUp() {
    const powerUps = ['slowTime', 'doublePoints', 'shield'];
    const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
    
    game.powerUps[powerUp] = 5000; // 5초
    
    const messages = {
        slowTime: '⏰ Slow Time!',
        doublePoints: '💎 Double Points!',
        shield: '🛡️ Shield!',
    };
    
    showPowerUpEffect(messages[powerUp]);
}

// 파워업 효과 표시
function showPowerUpEffect(message) {
    const powerUp = document.createElement('div');
    powerUp.className = 'power-up';
    powerUp.textContent = message;
    powerUp.style.left = '50%';
    powerUp.style.top = '50%';
    powerUp.style.transform = 'translate(-50%, -50%)';
    gameArea.appendChild(powerUp);
    
    setTimeout(() => powerUp.remove(), 3000);
}

// 레벨업
function levelUp() {
    game.level++;
    game.exp -= game.expToNext;
    game.expToNext = Math.floor(game.expToNext * 1.3);
    game.lives = Math.min(game.maxLives, game.lives + 1);
    game.currentSpeed = game.baseSpeed * (1 + game.level * 0.1);
    
    showPowerUpEffect(`🎉 Level ${game.level}!`);
}

// 콤보 표시 업데이트
function updateComboIndicator() {
    const indicator = document.getElementById('comboIndicator');
    indicator.textContent = `${game.combo}x COMBO!`;
    indicator.classList.add('show');
    
    clearTimeout(updateComboIndicator.timeout);
    updateComboIndicator.timeout = setTimeout(() => {
        indicator.classList.remove('show');
    }, 1000);
}

// 플로팅 스코어
function showFloatingScore(element, score, isBonus = false) {
    const rect = element.getBoundingClientRect();
    const floating = document.createElement('div');
    floating.textContent = `+${score}`;
    floating.className = 'floating-score';
    floating.style.left = rect.left + 'px';
    floating.style.top = rect.top + 'px';
    floating.style.color = isBonus ? '#ffd700' : '#4ec9b0';
    floating.style.fontSize = isBonus ? '16px' : '12px';
    floating.style.fontWeight = 'bold';
    document.body.appendChild(floating);
    
    setTimeout(() => floating.remove(), 1000);
}

// 단어 제거
function removeWord(id, missed = false) {
    const index = game.activeWords.findIndex(w => w.id === id);
    if (index !== -1) {
        const word = game.activeWords[index];
        
        if (missed) {
            word.element.classList.add('missed');
        } else {
            word.element.classList.add('typed');
        }
        
        setTimeout(() => {
            word.element.remove();
        }, 200);
        
        game.activeWords.splice(index, 1);
    }
}

// 화면 업데이트
function updateDisplay() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('combo').textContent = game.combo;
    document.getElementById('lives').textContent = game.lives;
    document.getElementById('level').textContent = game.level;
    document.getElementById('streak').textContent = game.streak;
    
    // HP 바
    const hpPercent = (game.lives / game.maxLives) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    
    // EXP 바
    const expPercent = (game.exp / game.expToNext) * 100;
    document.getElementById('expBar').style.width = expPercent + '%';
    
    // Lives 색상
    const livesEl = document.getElementById('lives');
    if (game.lives <= 1) {
        livesEl.classList.add('danger');
    } else if (game.lives <= 2) {
        livesEl.classList.add('warning');
        livesEl.classList.remove('danger');
    } else {
        livesEl.classList.remove('warning', 'danger');
    }
    
    // 연속 성공 표시
    const streakEl = document.getElementById('streakIndicator');
    if (game.streak >= 5) {
        streakEl.classList.add('hot');
        streakEl.textContent = `🔥 ${game.streak} Streak!`;
    } else {
        streakEl.classList.remove('hot');
        streakEl.textContent = `Streak: ${game.streak}`;
    }
}

// 게임 종료
function endGame() {
    game.gameActive = false;
    clearInterval(game.spawnInterval);
    clearInterval(game.moveInterval);
    input.disabled = true;

    const playTime = Math.floor((Date.now() - game.startTime) / 1000);
    const minutes = Math.floor(playTime / 60);
    const seconds = playTime % 60;
    
    const accuracy = game.totalCharacters > 0
        ? Math.round((game.correctCharacters / game.totalCharacters) * 100)
        : 0;
    
    const wpm = game.correctCharacters > 0 && playTime > 0
        ? Math.round((game.correctCharacters / 5) / (playTime / 60))
        : 0;

    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('finalWords').textContent = game.wordsTyped;
    document.getElementById('finalAccuracy').textContent = accuracy;
    document.getElementById('finalWPM').textContent = wpm;
    document.getElementById('finalCombo').textContent = game.maxCombo;
    document.getElementById('finalLevel').textContent = game.level;
    document.getElementById('finalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('gameOver').classList.add('show');
    
    // 하이스코어 저장
    saveHighScore();
}

// 하이스코어 저장
function saveHighScore() {
    const highScore = parseInt(localStorage.getItem('typingHighScore')) || 0;
    if (game.score > highScore) {
        localStorage.setItem('typingHighScore', game.score);
        document.getElementById('newRecord').style.display = 'block';
    }
}

// 하이스코어 불러오기
function loadHighScore() {
    const highScore = parseInt(localStorage.getItem('typingHighScore')) || 0;
    // 필요시 표시
}

// 게임 시작
init();
