// 게임 상태 변수
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameOver = false;
let gameInProgress = false;
let currentBet = 0;
let coins = 1000;
let wins = 0;
let losses = 0;
let draws = 0;
let canDoubleDown = false;

// 카드 정의
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 덱 생성 및 셔플
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// 카드 값 계산
function getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;

    for (let card of hand) {
        score += getCardValue(card);
        if (card.value === 'A') aces++;
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }

    return score;
}

function isBlackjack(hand) {
    return hand.length === 2 && calculateScore(hand) === 21;
}

// 카드 렌더링
function renderCard(card, hidden = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    if (hidden) {
        cardDiv.classList.add('card-back');
    } else {
        const isRed = card.suit === '♥' || card.suit === '♦';
        cardDiv.classList.add(isRed ? 'red' : 'black');
        cardDiv.innerHTML = `
            <div>${card.value}</div>
            <div class="suit">${card.suit}</div>
        `;
    }
    
    return cardDiv;
}

// 화면 업데이트
function updateDisplay() {
    const playerCardsDiv = document.getElementById('player-cards');
    const dealerCardsDiv = document.getElementById('dealer-cards');
    
    playerCardsDiv.innerHTML = '';
    dealerCardsDiv.innerHTML = '';

    playerHand.forEach(card => {
        playerCardsDiv.appendChild(renderCard(card));
    });

    dealerHand.forEach((card, index) => {
        const hideCard = !gameOver && index === 0;
        dealerCardsDiv.appendChild(renderCard(card, hideCard));
    });

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    document.getElementById('player-score').textContent = `점수: ${playerScore}`;
    
    if (gameOver) {
        document.getElementById('dealer-score').textContent = `점수: ${dealerScore}`;
    } else {
        document.getElementById('dealer-score').textContent = `점수: ?`;
    }

    document.getElementById('coins').textContent = coins;
}

function updateStats() {
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('draws').textContent = draws;
}

// 카드 딜
function dealCard(hand) {
    if (deck.length === 0) {
        createDeck();
    }
    hand.push(deck.pop());
}

// 배팅 관련 함수
function addBet(amount) {
    const betInput = document.getElementById('bet-input');
    let newBet = parseInt(betInput.value) + amount;
    if (newBet > coins) {
        newBet = coins;
    }
    betInput.value = newBet;
}

function betAll() {
    document.getElementById('bet-input').value = coins;
}

function clearBet() {
    document.getElementById('bet-input').value = 10;
}

// 게임 시작
function dealCards() {
    const betInput = document.getElementById('bet-input');
    const betAmount = parseInt(betInput.value);

    if (betAmount < 10) {
        showMessage('최소 배팅 금액은 10 코인입니다!', '');
        return;
    }

    if (betAmount > coins) {
        showMessage('보유 코인이 부족합니다!', '');
        return;
    }

    currentBet = betAmount;
    coins -= currentBet;
    gameOver = false;
    gameInProgress = true;
    canDoubleDown = true;
    playerHand = [];
    dealerHand = [];

    document.getElementById('betting-area').style.display = 'none';
    document.getElementById('current-bet-display').classList.remove('hidden');
    document.getElementById('current-bet-display').textContent = `배팅: ${currentBet}`;

    if (deck.length < 20) {
        createDeck();
    }

    dealCard(dealerHand);
    dealCard(dealerHand);
    dealCard(playerHand);
    dealCard(playerHand);

    updateDisplay();

    document.getElementById('hit-btn').disabled = false;
    document.getElementById('stand-btn').disabled = false;
    document.getElementById('double-btn').disabled = false;

    // 블랙잭 체크
    const playerBlackjack = isBlackjack(playerHand);
    const dealerBlackjack = isBlackjack(dealerHand);

    if (playerBlackjack && dealerBlackjack) {
        endGame('양쪽 모두 블랙잭! 무승부입니다.', 'draw', currentBet);
    } else if (playerBlackjack) {
        endGame('🎉 블랙잭! 🎉', 'blackjack', Math.floor(currentBet * 2.5));
    } else if (dealerBlackjack) {
        endGame('딜러가 블랙잭! 패배했습니다.', 'lose', 0);
    } else {
        showMessage('게임 진행 중... 히트 또는 스탠드를 선택하세요.', '');
    }
}

// 히트
function hit() {
    if (gameOver || !gameInProgress) return;

    canDoubleDown = false;
    document.getElementById('double-btn').disabled = true;

    dealCard(playerHand);
    updateDisplay();

    const playerScore = calculateScore(playerHand);
    if (playerScore > 21) {
        endGame('버스트! 패배했습니다.', 'lose', 0);
    } else if (playerScore === 21) {
        stand();
    }
}

// 스탠드
function stand() {
    if (gameOver || !gameInProgress) return;

    canDoubleDown = false;
    document.getElementById('double-btn').disabled = true;

    while (calculateScore(dealerHand) < 17) {
        dealCard(dealerHand);
    }

    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    if (dealerScore > 21) {
        endGame('딜러가 버스트! 승리했습니다!', 'win', currentBet * 2);
    } else if (playerScore > dealerScore) {
        endGame('승리했습니다!', 'win', currentBet * 2);
    } else if (playerScore < dealerScore) {
        endGame('패배했습니다.', 'lose', 0);
    } else {
        endGame('무승부입니다.', 'draw', currentBet);
    }
}

// 더블 다운
function doubleDown() {
    if (gameOver || !gameInProgress || !canDoubleDown) return;

    if (coins < currentBet) {
        showMessage('더블 다운을 위한 코인이 부족합니다!', '');
        return;
    }

    coins -= currentBet;
    currentBet *= 2;
    document.getElementById('current-bet-display').textContent = `배팅: ${currentBet}`;
    updateDisplay();

    canDoubleDown = false;
    document.getElementById('double-btn').disabled = true;

    dealCard(playerHand);
    updateDisplay();

    const playerScore = calculateScore(playerHand);
    if (playerScore > 21) {
        endGame('버스트! 패배했습니다.', 'lose', 0);
    } else {
        stand();
    }
}

// 게임 종료
function endGame(message, result, payout) {
    gameOver = true;
    gameInProgress = false;
    canDoubleDown = false;
    updateDisplay();

    coins += payout;
    let subMessage = '';

    if (result === 'win') {
        wins++;
        subMessage = `+${payout} 코인 획득!`;
    } else if (result === 'blackjack') {
        wins++;
        subMessage = `+${payout} 코인 획득! (배팅액 x2.5)`;
    } else if (result === 'lose') {
        losses++;
        subMessage = `${currentBet} 코인 손실`;
    } else if (result === 'draw') {
        draws++;
        subMessage = `${payout} 코인 반환`;
    }

    showMessage(message, subMessage, result);
    updateStats();
    updateDisplay();

    document.getElementById('hit-btn').disabled = true;
    document.getElementById('stand-btn').disabled = true;
    document.getElementById('double-btn').disabled = true;

    setTimeout(() => {
        if (coins < 10) {
            showGameOver();
        } else {
            resetForNewRound();
        }
    }, 3000);
}

// 메시지 표시
function showMessage(main, sub, className = '') {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `
        <div>${main}</div>
        ${sub ? `<div class="message-sub">${sub}</div>` : ''}
    `;
    messageDiv.className = 'message ' + className;
}

// 새 라운드 준비
function resetForNewRound() {
    document.getElementById('betting-area').style.display = 'block';
    document.getElementById('current-bet-display').classList.add('hidden');
    document.getElementById('bet-input').value = Math.min(10, coins);
    currentBet = 0;
    showMessage('새로운 라운드를 시작하세요!', '');
}

// 게임 오버 화면
function showGameOver() {
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    document.getElementById('total-games').textContent = totalGames;
    document.getElementById('final-wins').textContent = wins;
    document.getElementById('final-losses').textContent = losses;
    document.getElementById('final-draws').textContent = draws;
    document.getElementById('win-rate').textContent = winRate;
    
    document.getElementById('game-over-screen').style.display = 'flex';
}

// 게임 리셋
function resetGame() {
    coins = 1000;
    wins = 0;
    losses = 0;
    draws = 0;
    currentBet = 0;
    gameOver = false;
    gameInProgress = false;

    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('dealer-cards').innerHTML = '';
    
    updateStats();
    updateDisplay();
    resetForNewRound();
}

// 초기화
createDeck();
updateStats();

