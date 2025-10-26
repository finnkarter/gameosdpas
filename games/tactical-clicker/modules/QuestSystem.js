// 퀘스트 시스템
class QuestSystem {
    constructor() {
        this.quests = {
            quest1: { 
                id: 1,
                name: '사격 훈련 I',
                desc: '타겟 20개 처치',
                giver: '프라퍼',
                active: false,
                completed: false, 
                progress: 0, 
                goal: 20,
                type: 'kill',
                locked: false,
                reward: { money: 2000, exp: 500, trader: 'prapor', rep: 0.5 }
            },
            quest2: { 
                id: 2,
                name: '정확한 사수',
                desc: '명중률 80% 이상 달성',
                giver: '스키어',
                active: false,
                completed: false, 
                progress: 0, 
                goal: 80,
                type: 'accuracy',
                locked: false,
                reward: { money: 3000, exp: 800, trader: 'skier', rep: 0.5 }
            },
            quest3: { 
                id: 3,
                name: '콤보 마스터',
                desc: '10 콤보 달성',
                giver: '프라퍼',
                active: false,
                completed: false, 
                progress: 0, 
                goal: 10,
                type: 'combo',
                locked: true,
                unlockLevel: 3,
                reward: { money: 5000, exp: 1200, trader: 'prapor', rep: 1.0 }
            }
        };
    }
    
    acceptQuest(questId) {
        const quest = this.quests[questId];
        if (!quest || quest.completed || quest.locked || quest.active) return false;
        
        quest.active = true;
        quest.progress = 0;
        return true;
    }
    
    updateProgress(questId, value) {
        const quest = this.quests[questId];
        if (!quest || quest.completed || quest.locked || !quest.active) return false;
        
        quest.progress = value;
        
        if (quest.progress >= quest.goal) {
            quest.progress = quest.goal;
            return true; // 완료 가능
        }
        
        return false;
    }
    
    canComplete(questId) {
        const quest = this.quests[questId];
        return quest && quest.active && !quest.completed && quest.progress >= quest.goal;
    }
    
    completeQuest(questId) {
        const quest = this.quests[questId];
        if (!quest || quest.completed) return null;
        
        quest.completed = true;
        return quest.reward;
    }
    
    unlockQuest(questId) {
        const quest = this.quests[questId];
        if (quest) {
            quest.locked = false;
        }
    }
    
    checkUnlocks(level) {
        const unlocked = [];
        
        Object.entries(this.quests).forEach(([questId, quest]) => {
            if (quest.locked && quest.unlockLevel && level >= quest.unlockLevel) {
                this.unlockQuest(questId);
                unlocked.push(questId);
            }
        });
        
        return unlocked;
    }
    
    getQuest(questId) {
        return this.quests[questId];
    }
    
    getAllQuests() {
        return this.quests;
    }
}
