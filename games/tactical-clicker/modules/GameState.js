// 게임 상태 관리
class GameState {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.exp = 0;
        this.expNeeded = 100;
        this.totalShots = 0;
        this.totalHits = 0;
        this.totalMisses = 0;
        this.totalHeadshots = 0;
        this.totalKills = 0;
        this.combo = 0;
        this.bestCombo = 0;
    }
    
    addScore(points) {
        this.score += points;
    }
    
    gainExp(amount) {
        this.exp += amount;
        const levelsGained = [];
        
        while (this.exp >= this.expNeeded) {
            this.exp -= this.expNeeded;
            this.level++;
            this.expNeeded = Math.floor(this.expNeeded * 1.5);
            levelsGained.push(this.level);
        }
        
        return levelsGained;
    }
    
    incrementCombo() {
        this.combo++;
        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }
    }
    
    resetCombo() {
        this.combo = 0;
    }
    
    getAccuracy() {
        return this.totalShots > 0 
            ? Math.round((this.totalHits / this.totalShots) * 100) 
            : 100;
    }
}
