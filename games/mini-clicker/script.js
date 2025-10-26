// 게임 상태
const game = {
    points: 0,
    pointsPerClick: 1,
    totalClicks: 0,
    totalEarned: 0,
    startTime: Date.now(),
    clickPower: 1,
    critChance: 0.05,
    critMultiplier: 2,
    goldenClicks: 0,
    prestigeLevel: 0,
    prestigePoints: 0,
    upgrades: [
        { id: 1, cost: 10, baseCost: 10, count: 0, rate: 0.1, name: 'Auto-Script', multiplier: 1 },
        { id: 2, cost: 50, baseCost: 50, count: 0, rate: 0.5, name: 'CPU Thread', multiplier: 1 },
        { id: 3, cost: 200, baseCost: 200, count: 0, rate: 2, name: 'RAM Module', multiplier: 1 },
        { id: 4, cost: 1000, baseCost: 1000, count: 0, rate: 10, name: 'GPU Core', multiplier: 1 },
        { id: 5, cost: 5000, baseCost: 5000, count: 0, rate: 50, name: 'Quantum AI', multiplier: 1 },
        { id: 6, cost: 25000, baseCost: 25000, count: 0, rate: 250, name: 'Datacenter', multiplier: 1 },
        { id: 7, cost: 100000, baseCost: 100000, count: 0, rate: 1000, name: 'Server Farm', multiplier: 1 },
        { id: 8, cost: 500000, baseCost: 500000, count: 0, rate: 5000, name: 'Supercomputer', multiplier: 1 }
    ],
    achievements: {
        firstClick: false,
        hundredPoints: false,
        thousandPoints: false,
        millionPoints: false,
        firstUpgrade: false,
        allUpgrades: false,
        hundredClicks: false,
        goldenClick: false,
        speedDemon: false,
        bigSpender: false
    },
    settings: {
        particles: true,
        sound: false,
        autoSave: true,
        notifications: true
    }
};

// 요소 참조
const pointsEl = document.getElementById('points');
const rateEl = document.getElementById('rate');
const clickBtn = document.getElementById('clickBtn');
const totalClicksEl = document.getElementById('totalClicks');
const cpsEl = document.getElementById('cps');
const prestigeEl = document.getElementById('prestige');

// 초기화
function init() {
    loadGame();
    updateDisplay();
    startAutoProduction();
    startAutoSave();
    startCPSCalculator();
    attachEventListeners();
}

// 이벤트 리스너 등록
function attachEventListeners() {
    clickBtn.addEventListener('click', handleClick);
    
    // 업그레이드 버튼
    game.upgrades.forEach((upgrade, index) => {
        const btn = document.getElementById(`upgrade${upgrade.id}`);
        if (btn) {
            btn.addEventListener('click', () => buyUpgrade(index));
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                buyMaxUpgrade(index);
            });
        }
    });
    
    // 헤더 버튼
    document.getElementById('statsBtn')?.addEventListener('click', toggleStats);
    document.getElementById('settingsBtn')?.addEventListener('click', toggleSettings);
    document.getElementById('resetBtn')?.addEventListener('click', confirmReset);
}

// 클릭 처리
function handleClick(e) {
    game.totalClicks++;
    
    // 골든 클릭 (1% 확률로 10배)
    const isGolden = Math.random() < 0.01;
    // 크리티컬 히트
    const isCrit = Math.random() < game.critChance;
    
    let clickValue = game.pointsPerClick * game.clickPower;
    
    if (isGolden) {
        clickValue *= 10;
        game.goldenClicks++;
        createGoldenEffect(e.clientX, e.clientY);
        if (!game.achievements.goldenClick) {
            game.achievements.goldenClick = true;
            showNotification('🌟 Achievement: Golden Touch!', 'achievement');
        }
    } else if (isCrit) {
        clickValue *= game.critMultiplier;
    }
    
    game.points += clickValue;
    game.totalEarned += clickValue;
    
    // 버튼 애니메이션
    clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickBtn.style.transform = 'scale(1)';
    }, 100);
    
    // 시각 효과
    createFloatingText(e.clientX, e.clientY, 
        isGolden ? `+${formatNumber(clickValue)} ⭐` : `+${formatNumber(clickValue)}`, 
        isGolden ? 'crit' : (isCrit ? 'crit' : 'normal'));
    
    if (game.settings.particles) {
        createParticles(e.clientX, e.clientY, isGolden ? 15 : (isCrit ? 8 : 5));
    }
    
    checkAchievements();
    updateDisplay();
}

// 업그레이드 구매
function buyUpgrade(index) {
    const upgrade = game.upgrades[index];
    
    if (game.points >= upgrade.cost) {
        game.points -= upgrade.cost;
        upgrade.count++;
        upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
        
        // 구매 효과
        const btn = document.getElementById(`upgrade${upgrade.id}`);
        btn.style.animation = 'pulse 0.3s';
        setTimeout(() => {
            btn.style.animation = '';
        }, 300);
        
        // 첫 구매 도전과제
        if (!game.achievements.firstUpgrade) {
            game.achievements.firstUpgrade = true;
            showNotification('🎉 Achievement: First Upgrade!', 'achievement');
        }
        
        checkAchievements();
        updateDisplay();
    }
}

// 최대 구매
function buyMaxUpgrade(index) {
    const upgrade = game.upgrades[index];
    let totalCost = 0;
    let count = 0;
    let currentCost = upgrade.cost;
    let tempPoints = game.points;
    
    while (tempPoints >= currentCost && count < 100) {
        tempPoints -= currentCost;
        totalCost += currentCost;
        count++;
        currentCost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count + count));
    }
    
    if (count > 0) {
        game.points -= totalCost;
        upgrade.count += count;
        upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
        
        showNotification(`Bought ${count}x ${upgrade.name}!`, 'normal');
        updateDisplay();
    }
}

// 자동 생산
function startAutoProduction() {
    setInterval(() => {
        const totalRate = calculateTotalRate();
        const earned = totalRate / 10;
        game.points += earned;
        game.totalEarned += earned;
        checkAchievements();
        updateDisplay();
    }, 100);
}

// 총 생산량 계산
function calculateTotalRate() {
    return game.upgrades.reduce((sum, u) => 
        sum + (u.count * u.rate * u.multiplier * (1 + game.prestigeLevel * 0.1)), 0);
}

// CPS 계산기
let lastPoints = 0;
let cps = 0;
function startCPSCalculator() {
    setInterval(() => {
        cps = (game.points - lastPoints) * 2; // 0.5초마다 체크하므로 *2
        lastPoints = game.points;
    }, 500);
}

// 도전과제 체크
function checkAchievements() {
    if (!game.achievements.firstClick && game.totalClicks >= 1) {
        game.achievements.firstClick = true;
        showNotification('🎯 Achievement: First Click!', 'achievement');
    }
    if (!game.achievements.hundredClicks && game.totalClicks >= 100) {
        game.achievements.hundredClicks = true;
        showNotification('💯 Achievement: Century of Clicks!', 'achievement');
    }
    if (!game.achievements.hundredPoints && game.totalEarned >= 100) {
        game.achievements.hundredPoints = true;
        showNotification('💰 Achievement: 100 Resources!', 'achievement');
    }
    if (!game.achievements.thousandPoints && game.totalEarned >= 1000) {
        game.achievements.thousandPoints = true;
        showNotification('💎 Achievement: 1K Resources!', 'achievement');
    }
    if (!game.achievements.millionPoints && game.totalEarned >= 1000000) {
        game.achievements.millionPoints = true;
        showNotification('👑 Achievement: Millionaire!', 'achievement');
    }
    if (!game.achievements.allUpgrades && game.upgrades.every(u => u.count > 0)) {
        game.achievements.allUpgrades = true;
        showNotification('🌟 Achievement: Diversified!', 'achievement');
    }
    if (!game.achievements.bigSpender && game.totalEarned >= 100000) {
        game.achievements.bigSpender = true;
        showNotification('💸 Achievement: Big Spender!', 'achievement');
    }
}

// 플로팅 텍스트 생성
function createFloatingText(x, y, text, type = 'normal') {
    const floatingText = document.createElement('div');
    floatingText.textContent = text;
    floatingText.className = `floating-text ${type}`;
    floatingText.style.left = x + 'px';
    floatingText.style.top = y + 'px';
    document.body.appendChild(floatingText);
    
    setTimeout(() => floatingText.remove(), 1000);
}

// 파티클 생성
function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        
        const tx = (Math.random() - 0.5) * 100;
        const ty = (Math.random() - 0.5) * 100;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

// 골든 효과
function createGoldenEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = '#ffd700';
        
        const tx = (Math.random() - 0.5) * 150;
        const ty = (Math.random() - 0.5) * 150;
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
    }
}

// 알림 표시
function showNotification(message, type = 'normal') {
    if (!game.settings.notifications) return;
    
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.className = `notification ${type}`;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

// 화면 업데이트
function updateDisplay() {
    pointsEl.textContent = formatNumber(Math.floor(game.points));
    
    const totalRate = calculateTotalRate();
    rateEl.textContent = formatNumber(totalRate.toFixed(1));
    
    if (totalClicksEl) totalClicksEl.textContent = formatNumber(game.totalClicks);
    if (cpsEl) cpsEl.textContent = formatNumber(cps.toFixed(1));
    if (prestigeEl) prestigeEl.textContent = game.prestigeLevel;

    // 업그레이드 버튼 업데이트
    game.upgrades.forEach((upgrade, index) => {
        const btn = document.getElementById(`upgrade${upgrade.id}`);
        if (!btn) return;
        
        const costEl = document.getElementById(`cost${upgrade.id}`);
        const countEl = document.getElementById(`count${upgrade.id}`);
        const prodEl = document.getElementById(`prod${upgrade.id}`);
        
        if (costEl) costEl.textContent = formatNumber(upgrade.cost);
        if (countEl) countEl.textContent = upgrade.count;
        if (prodEl) prodEl.textContent = formatNumber((upgrade.count * upgrade.rate).toFixed(1));
        
        btn.disabled = game.points < upgrade.cost;
        
        if (game.points >= upgrade.cost) {
            btn.classList.add('affordable');
        } else {
            btn.classList.remove('affordable');
        }
    });
}

// 숫자 포맷
function formatNumber(num) {
    const n = parseFloat(num);
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return Math.floor(n).toLocaleString();
}

// 통계 토글
function toggleStats() {
    const panel = document.getElementById('statsPanel');
    if (panel) {
        panel.classList.toggle('show');
        
        if (panel.classList.contains('show')) {
            updateStatsPanel();
        }
    }
}

// 통계 패널 업데이트
function updateStatsPanel() {
    const playTime = Math.floor((Date.now() - game.startTime) / 1000);
    const hours = Math.floor(playTime / 3600);
    const minutes = Math.floor((playTime % 3600) / 60);
    const seconds = playTime % 60;
    
    document.getElementById('statPlayTime').textContent = 
        `${hours}h ${minutes}m ${seconds}s`;
    document.getElementById('statTotalClicks').textContent = formatNumber(game.totalClicks);
    document.getElementById('statTotalEarned').textContent = formatNumber(game.totalEarned);
    document.getElementById('statGoldenClicks').textContent = game.goldenClicks;
    document.getElementById('statAchievements').textContent = 
        `${Object.values(game.achievements).filter(a => a).length}/10`;
}

// 설정 토글
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) panel.classList.toggle('show');
}

// 리셋 확인
function confirmReset() {
    if (confirm('Reset all progress? This cannot be undone!')) {
        localStorage.removeItem('miniClicker');
        location.reload();
    }
}

// 저장
function saveGame() {
    if (!game.settings.autoSave) return;
    
    const saveData = {
        ...game,
        lastSave: Date.now()
    };
    localStorage.setItem('miniClicker', JSON.stringify(saveData));
}

// 불러오기
function loadGame() {
    const saved = localStorage.getItem('miniClicker');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            game.points = data.points || 0;
            game.upgrades = data.upgrades || game.upgrades;
            game.totalClicks = data.totalClicks || 0;
            game.totalEarned = data.totalEarned || 0;
            game.achievements = data.achievements || game.achievements;
            game.prestigeLevel = data.prestigeLevel || 0;
            game.goldenClicks = data.goldenClicks || 0;
            game.settings = data.settings || game.settings;
            
            if (data.startTime) game.startTime = data.startTime;
            
            // 오프라인 진행
            if (data.lastSave) {
                const offlineTime = (Date.now() - data.lastSave) / 1000;
                const totalRate = calculateTotalRate();
                const offlineEarnings = Math.floor(totalRate * Math.min(offlineTime, 3600)); // 최대 1시간
                
                if (offlineEarnings > 0) {
                    game.points += offlineEarnings;
                    showNotification(`⏰ Offline: +${formatNumber(offlineEarnings)}`, 'normal');
                }
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
    }
}

// 자동 저장
function startAutoSave() {
    setInterval(saveGame, 5000);
}

// 페이지 떠날 때 저장
window.addEventListener('beforeunload', saveGame);

// 게임 시작
init();
