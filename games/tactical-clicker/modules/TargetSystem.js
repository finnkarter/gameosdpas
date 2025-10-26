// 타겟 시스템
class TargetSystem {
    constructor(gameArea, targetsContainer) {
        this.gameArea = gameArea;
        this.targetsContainer = targetsContainer;
        this.targets = [];
        this.spawnRate = 2000;
        this.spawnTimer = null;
    }
    
    startSpawning() {
        this.spawnTimer = setInterval(() => {
            this.spawnTarget();
        }, this.spawnRate);
    }
    
    stopSpawning() {
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    }
    
    spawnTarget() {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const padding = 80;
        
        // 랜덤 위치
        const x = Math.random() * (gameAreaRect.width - padding * 2) + padding;
        const y = Math.random() * (gameAreaRect.height - padding * 2) + padding;
        
        // 타겟 타입 결정
        const targetData = this.getRandomTargetType();
        
        // 타겟 생성
        const target = document.createElement('div');
        target.className = `target ${targetData.type}`;
        target.textContent = targetData.emoji;
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        
        target.targetData = targetData;
        
        this.targetsContainer.appendChild(target);
        this.targets.push(target);
        
        // 시간 초과 시 제거
        setTimeout(() => {
            this.removeTarget(target, true);
        }, targetData.duration);
        
        return target;
    }
    
    getRandomTargetType() {
        const rand = Math.random();
        
        if (rand < 0.6) {
            // 일반 타겟 (60%)
            return {
                type: 'normal',
                emoji: '🎯',
                hp: 30,
                points: 10,
                duration: 3000
            };
        } else if (rand < 0.85) {
            // 빠른 타겟 (25%)
            return {
                type: 'fast',
                emoji: '⚡',
                hp: 20,
                points: 20,
                duration: 1500
            };
        } else if (rand < 0.95) {
            // 황금 타겟 (10%)
            return {
                type: 'golden',
                emoji: '💎',
                hp: 40,
                points: 50,
                duration: 2000
            };
        } else {
            // 폭탄 (5%)
            return {
                type: 'bomb',
                emoji: '💣',
                hp: 10,
                points: -50,
                duration: 2500
            };
        }
    }
    
    removeTarget(target, missed = false) {
        if (target.parentElement) {
            target.remove();
            const index = this.targets.indexOf(target);
            if (index > -1) {
                this.targets.splice(index, 1);
            }
        }
        return missed;
    }
    
    clearAllTargets() {
        this.targets.forEach(target => target.remove());
        this.targets = [];
    }
}
