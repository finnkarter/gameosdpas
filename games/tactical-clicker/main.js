// 메인 게임 클래스
class TacticalClicker {
    constructor() {
        // 시스템 초기화
        this.gameState = new GameState();
        this.skillSystem = new SkillSystem();
        this.traderSystem = new TraderSystem();
        this.questSystem = new QuestSystem();
        this.weaponSystem = new WeaponSystem();
        this.attachmentSystem = new AttachmentSystem();
        this.uiManager = new UIManager();
        
        // DOM 요소
        this.gameArea = document.getElementById('game-area');
        this.targetsContainer = document.getElementById('targets-container');
        this.crosshair = document.querySelector('.crosshair');
        
        // 타겟 시스템
        this.targetSystem = new TargetSystem(this.gameArea, this.targetsContainer);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateAllUI();
        this.targetSystem.startSpawning();
    }
    
    setupEventListeners() {
        // 크로스헤어
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 사격
        this.gameArea.addEventListener('click', (e) => this.handleGameAreaClick(e));
        
        // 타겟 클릭 (이벤트 위임)
        this.targetsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('target')) {
                e.stopPropagation();
                this.handleTargetClick(e, e.target);
            }
        });
        
        // 재장전
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.handleReload();
            }
        });
        
        // 메뉴 버튼
        ['weapons', 'attachments', 'skills', 'traders', 'quests', 'stats'].forEach(panel => {
            document.getElementById(`btn-${panel}`).addEventListener('click', () => {
                this.uiManager.showPanel(panel);
            });
        });
        
        // 무기 선택
        document.querySelectorAll('.weapon-card').forEach(card => {
            card.addEventListener('click', () => {
                this.handleWeaponSelect(card.dataset.weapon);
            });
        });
        
        // 퀘스트 버튼
        document.querySelectorAll('.quest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const questCard = e.target.closest('.quest-card');
                const questId = questCard.dataset.quest;
                const action = e.target.dataset.questAction;
                
                if (action === 'accept') {
                    this.handleQuestAccept(questId);
                } else if (action === 'complete') {
                    this.handleQuestComplete(questId);
                }
            });
        });
        
        // 부착물 버튼
        document.querySelectorAll('.attachment-card').forEach(card => {
            card.querySelector('.attachment-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const attachmentId = card.dataset.attachment;
                this.handleAttachmentAction(attachmentId, card);
            });
        });
        
        // 부착물 해제 버튼
        document.querySelectorAll('.unequip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.handleAttachmentUnequip(type);
            });
        });
    }
    
    handleMouseMove(e) {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        if (e.clientX > gameAreaRect.left && 
            e.clientX < gameAreaRect.right &&
            e.clientY > gameAreaRect.top && 
            e.clientY < gameAreaRect.bottom) {
            this.crosshair.style.display = 'block';
            this.crosshair.style.left = e.clientX + 'px';
            this.crosshair.style.top = e.clientY + 'px';
        } else {
            this.crosshair.style.display = 'none';
        }
    }
    
    handleGameAreaClick(e) {
        if (e.target === this.gameArea || e.target === this.targetsContainer) {
            this.shoot(e, null);
        }
    }
    
    handleTargetClick(e, target) {
        this.shoot(e, target);
    }
    
    handleReload() {
        if (this.weaponSystem.reload()) {
            this.skillSystem.gainExp('reload', 1);
            this.updateAllUI();
        }
    }
    
    handleWeaponSelect(weaponId) {
        const weapon = this.weaponSystem.getWeapon(weaponId);
        
        if (!weapon.unlocked) {
            if (this.gameState.score >= weapon.price) {
                this.gameState.score -= weapon.price;
                this.weaponSystem.unlockWeapon(weaponId);
                this.weaponSystem.equipWeapon(weaponId);
                this.updateAllUI();
            } else {
                alert(`루블이 부족합니다! 필요: ₽${weapon.price.toLocaleString()}`);
            }
        } else {
            this.weaponSystem.equipWeapon(weaponId);
            this.updateAllUI();
        }
    }
    
    shoot(event, target) {
        if (!this.weaponSystem.shoot()) {
            return; // 탄약 없음
        }
        
        this.gameState.totalShots++;
        
        if (target) {
            const weapon = this.weaponSystem.getCurrentWeapon();
            const hitChance = Math.random() * 100;
            
            if (hitChance <= weapon.accuracy) {
                this.hitTarget(target, event);
            } else {
                this.miss();
            }
        } else {
            this.miss();
        }
        
        this.updateAllUI();
    }
    
    hitTarget(target, event) {
        const targetData = target.targetData;
        const weapon = this.weaponSystem.getCurrentWeapon();
        
        if (weapon.damage >= targetData.hp) {
            this.gameState.totalHits++;
            this.gameState.totalKills++;
            this.gameState.incrementCombo();
            
            // 점수 계산
            let points = targetData.points;
            const comboBonus = Math.floor(this.gameState.combo / 5);
            points += comboBonus;
            
            // 스킬 보너스
            const lootingBonus = this.skillSystem.getBonus('looting');
            points = Math.floor(points * (1 + lootingBonus / 100));
            
            this.gameState.addScore(points);
            
            // 경험치
            const baseExp = Math.floor(targetData.points / 2);
            const combatBonus = this.skillSystem.getBonus('combat');
            const expGain = Math.floor(baseExp * (1 + combatBonus / 100));
            const levelsGained = this.gameState.gainExp(expGain);
            
            // 레벨업 처리
            levelsGained.forEach(level => {
                this.uiManager.showHitMarker(window.innerWidth / 2, 100, `레벨 ${level}!`);
                const unlockedQuests = this.questSystem.checkUnlocks(level);
                unlockedQuests.forEach(questId => {
                    this.uiManager.unlockQuestUI(`quest-${this.questSystem.getQuest(questId).id}`);
                });
            });
            
            // 스킬 경험치
            this.skillSystem.gainExp('accuracy', 1);
            this.skillSystem.gainExp('combat', 1);
            
            // 퀘스트 진행
            this.updateQuests();
            
            // 히트 마커
            this.uiManager.showHitMarker(event.clientX, event.clientY, `+${points}`);
            
            // 타겟 제거
            this.targetSystem.removeTarget(target, false);
        }
    }
    
    miss() {
        this.gameState.totalMisses++;
        this.gameState.resetCombo();
    }
    
    handleQuestAccept(questId) {
        if (this.questSystem.acceptQuest(questId)) {
            const quest = this.questSystem.getQuest(questId);
            const questCard = document.getElementById(`quest-${quest.id}`);
            
            questCard.classList.remove('available');
            questCard.classList.add('active');
            questCard.querySelector('.quest-status').textContent = '🔄 진행중';
            
            const btn = questCard.querySelector('.quest-btn');
            btn.textContent = '진행중';
            btn.classList.remove('accept-btn');
            btn.classList.add('in-progress-btn');
            btn.disabled = true;
            
            this.uiManager.showHitMarker(window.innerWidth / 2, 150, '퀘스트 수락!');
        }
    }
    
    handleQuestComplete(questId) {
        this.completeQuest(questId);
    }
    
    handleAttachmentAction(attachmentId, card) {
        const attachment = this.attachmentSystem.getAttachment(attachmentId);
        
        if (!attachment.unlocked) {
            // 구매
            if (this.gameState.score >= attachment.price) {
                this.gameState.score -= attachment.price;
                this.attachmentSystem.buyAttachment(attachmentId);
                card.classList.remove('locked');
                card.classList.add('unlocked');
                card.querySelector('.attachment-btn').textContent = '장착';
                this.updateAllUI();
                this.uiManager.showHitMarker(window.innerWidth / 2, 150, '부착물 구매!');
            } else {
                alert(`루블이 부족합니다! 필요: ₽${attachment.price.toLocaleString()}`);
            }
        } else if (!attachment.equipped) {
            // 장착
            this.attachmentSystem.equipAttachment(attachmentId);
            this.updateAttachmentUI();
            this.uiManager.showHitMarker(window.innerWidth / 2, 150, '부착물 장착!');
        }
    }
    
    handleAttachmentUnequip(type) {
        if (this.attachmentSystem.unequipAttachment(type)) {
            this.updateAttachmentUI();
            this.uiManager.showHitMarker(window.innerWidth / 2, 150, '부착물 해제!');
        }
    }
    
    updateAttachmentUI() {
        // 장착된 부착물 표시
        Object.entries(this.attachmentSystem.equipped).forEach(([type, attachmentId]) => {
            const slotElement = document.getElementById(`equipped-${type}`);
            if (slotElement) {
                if (attachmentId) {
                    const attachment = this.attachmentSystem.getAttachment(attachmentId);
                    slotElement.textContent = attachment.name;
                    slotElement.style.color = '#ffd700';
                } else {
                    slotElement.textContent = '없음';
                    slotElement.style.color = '#4ecdc4';
                }
            }
        });
        
        // 총 스탯 표시
        const totalStats = this.attachmentSystem.getTotalStats();
        document.getElementById('total-accuracy').textContent = totalStats.accuracy > 0 ? `+${totalStats.accuracy}` : totalStats.accuracy;
        document.getElementById('total-recoil').textContent = totalStats.recoil;
        document.getElementById('total-ergo').textContent = totalStats.ergo > 0 ? `+${totalStats.ergo}` : totalStats.ergo;
        
        // 카드 상태 업데이트
        document.querySelectorAll('.attachment-card').forEach(card => {
            const attachmentId = card.dataset.attachment;
            const attachment = this.attachmentSystem.getAttachment(attachmentId);
            const btn = card.querySelector('.attachment-btn');
            
            card.classList.remove('locked', 'unlocked', 'equipped');
            
            if (attachment.equipped) {
                card.classList.add('equipped');
                btn.textContent = '장착됨';
            } else if (attachment.unlocked) {
                card.classList.add('unlocked');
                btn.textContent = '장착';
            } else {
                card.classList.add('locked');
                btn.textContent = '구매';
            }
        });
    }
    
    updateQuests() {
        // 퀘스트 1: 킬 카운트
        if (this.questSystem.updateProgress('quest1', this.gameState.totalKills)) {
            this.showQuestComplete('quest1');
        }
        
        // 퀘스트 2: 명중률
        if (this.questSystem.updateProgress('quest2', this.gameState.getAccuracy())) {
            this.showQuestComplete('quest2');
        }
        
        // 퀘스트 3: 콤보
        if (this.questSystem.updateProgress('quest3', this.gameState.combo)) {
            this.showQuestComplete('quest3');
        }
        
        // UI 업데이트
        this.updateQuestUI();
    }
    
    showQuestComplete(questId) {
        if (!this.questSystem.canComplete(questId)) return;
        
        const quest = this.questSystem.getQuest(questId);
        const questCard = document.getElementById(`quest-${quest.id}`);
        
        questCard.querySelector('.quest-status').textContent = '✅ 완료 가능';
        
        const btn = questCard.querySelector('.quest-btn');
        btn.textContent = '완료하기';
        btn.classList.remove('in-progress-btn');
        btn.classList.add('complete-btn');
        btn.disabled = false;
        btn.dataset.questAction = 'complete';
    }
    
    updateQuestUI() {
        Object.entries(this.questSystem.getAllQuests()).forEach(([questId, quest]) => {
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
    
    completeQuest(questId) {
        const reward = this.questSystem.completeQuest(questId);
        if (!reward) return;
        
        // 보상 지급
        this.gameState.addScore(reward.money);
        this.gameState.gainExp(reward.exp);
        
        const leveledUp = this.traderSystem.addRep(reward.trader, reward.rep);
        if (leveledUp) {
            const trader = this.traderSystem.getTrader(reward.trader);
            this.uiManager.showHitMarker(window.innerWidth / 2, 200, `${trader.name} 레벨업!`);
        }
        
        // UI 업데이트
        this.uiManager.completeQuestUI(this.questSystem.getQuest(questId).id);
        this.uiManager.showHitMarker(window.innerWidth / 2, 150, `퀘스트 완료!`);
    }
    
    updateAllUI() {
        this.uiManager.updateHUD(this.gameState, this.weaponSystem);
        this.uiManager.updateSkills(this.skillSystem);
        this.uiManager.updateTraders(this.traderSystem);
        this.updateQuestUI();
        this.updateAttachmentUI();
        this.uiManager.updateStats(this.gameState);
        this.uiManager.updateWeaponCards(this.weaponSystem);
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    new TacticalClicker();
});
