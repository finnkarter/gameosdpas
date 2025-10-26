// UI 관리자
class UIManager {
    constructor() {
        this.elements = {
            level: document.getElementById('level'),
            expText: document.getElementById('exp-text'),
            expFill: document.getElementById('exp-fill'),
            score: document.getElementById('score'),
            accuracy: document.getElementById('accuracy'),
            combo: document.getElementById('combo'),
            weaponName: document.getElementById('weapon-name'),
            currentAmmo: document.getElementById('current-ammo'),
            reserveAmmo: document.getElementById('reserve-ammo')
        };
    }
    
    updateHUD(gameState, weaponSystem) {
        // 레벨 & 경험치
        this.elements.level.textContent = gameState.level;
        this.elements.expText.textContent = `${gameState.exp}/${gameState.expNeeded}`;
        this.elements.expFill.style.width = `${(gameState.exp / gameState.expNeeded) * 100}%`;
        
        // 점수
        this.elements.score.textContent = `₽${gameState.score.toLocaleString()}`;
        
        // 명중률
        this.elements.accuracy.textContent = gameState.getAccuracy() + '%';
        
        // 콤보
        this.elements.combo.textContent = 'x' + gameState.combo;
        
        // 무기 정보
        const weapon = weaponSystem.getCurrentWeapon();
        this.elements.weaponName.textContent = weapon.name;
        this.elements.currentAmmo.textContent = weaponSystem.currentAmmo;
        this.elements.reserveAmmo.textContent = weaponSystem.reserveAmmo;
    }
    
    updateSkills(skillSystem) {
        // 정밀 사격
        const accuracySkill = skillSystem.getSkill('accuracy');
        document.getElementById('skill-accuracy-level').textContent = accuracySkill.level;
        document.getElementById('skill-accuracy-fill').style.width = `${(accuracySkill.exp / accuracySkill.expNeeded) * 100}%`;
        document.getElementById('skill-accuracy-bonus').textContent = skillSystem.getBonus('accuracy');
        
        // 빠른 손
        const reloadSkill = skillSystem.getSkill('reload');
        document.getElementById('skill-reload-level').textContent = reloadSkill.level;
        document.getElementById('skill-reload-fill').style.width = `${(reloadSkill.exp / reloadSkill.expNeeded) * 100}%`;
        document.getElementById('skill-reload-bonus').textContent = skillSystem.getBonus('reload');
        
        // 수색
        const lootingSkill = skillSystem.getSkill('looting');
        document.getElementById('skill-looting-level').textContent = lootingSkill.level;
        document.getElementById('skill-looting-fill').style.width = `${(lootingSkill.exp / lootingSkill.expNeeded) * 100}%`;
        document.getElementById('skill-looting-bonus').textContent = skillSystem.getBonus('looting');
        
        // 전투 경험
        const combatSkill = skillSystem.getSkill('combat');
        document.getElementById('skill-combat-level').textContent = combatSkill.level;
        document.getElementById('skill-combat-fill').style.width = `${(combatSkill.exp / combatSkill.expNeeded) * 100}%`;
        document.getElementById('skill-combat-bonus').textContent = skillSystem.getBonus('combat');
    }
    
    updateTraders(traderSystem) {
        Object.entries(traderSystem.getAllTraders()).forEach(([traderId, trader]) => {
            document.getElementById(`trader-${traderId}-level`).textContent = trader.level;
            document.getElementById(`trader-${traderId}-rep`).textContent = trader.rep.toFixed(2);
            document.getElementById(`trader-${traderId}-fill`).style.width = `${(trader.rep / trader.repNeeded) * 100}%`;
        });
    }
    
    updateQuests(questSystem) {
        Object.entries(questSystem.getAllQuests()).forEach(([questId, quest]) => {
            const progressElement = document.getElementById(`quest-${quest.id}-progress`);
            const barElement = document.getElementById(`quest-${quest.id}-bar`);
            
            if (progressElement) {
                progressElement.textContent = quest.progress;
            }
            
            if (barElement) {
                const percentage = (quest.progress / quest.goal) * 100;
                barElement.style.width = Math.min(percentage, 100) + '%';
            }
        });
    }
    
    updateStats(gameState) {
        document.getElementById('total-shots').textContent = gameState.totalShots;
        document.getElementById('total-hits').textContent = gameState.totalHits;
        document.getElementById('total-misses').textContent = gameState.totalMisses;
        document.getElementById('best-combo').textContent = gameState.bestCombo;
        document.getElementById('total-headshots').textContent = gameState.totalHeadshots;
        document.getElementById('total-roubles').textContent = gameState.score;
    }
    
    updateWeaponCards(weaponSystem) {
        document.querySelectorAll('.weapon-card').forEach(card => {
            const weaponId = card.dataset.weapon;
            const weapon = weaponSystem.getWeapon(weaponId);
            
            if (weapon.unlocked) {
                card.classList.remove('locked');
            }
            
            if (weaponId === weaponSystem.currentWeapon) {
                card.classList.add('equipped');
            } else {
                card.classList.remove('equipped');
            }
        });
    }
    
    showHitMarker(x, y, text) {
        const marker = document.createElement('div');
        marker.className = 'hit-marker';
        marker.textContent = text;
        marker.style.left = x + 'px';
        marker.style.top = y + 'px';
        
        document.body.appendChild(marker);
        
        setTimeout(() => marker.remove(), 500);
    }
    
    showPanel(panelName) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        
        document.getElementById(`${panelName}-panel`).classList.add('active');
        document.getElementById(`btn-${panelName}`).classList.add('active');
    }
    
    completeQuestUI(questId) {
        const questCard = document.getElementById(`quest-${questId}`);
        if (questCard) {
            questCard.classList.remove('available');
            questCard.classList.add('completed');
            const btn = questCard.querySelector('.quest-btn');
            if (btn) btn.textContent = '완료';
        }
    }
    
    unlockQuestUI(questId) {
        const questCard = document.getElementById(`quest-${questId}`);
        if (questCard) {
            questCard.classList.remove('locked');
            questCard.classList.add('available');
        }
    }
}
