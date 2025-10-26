// 상인 시스템
class TraderSystem {
    constructor() {
        this.traders = {
            prapor: { 
                level: 1, 
                rep: 0, 
                repNeeded: 5,
                name: '프라퍼',
                specialty: '러시아 무기'
            },
            skier: { 
                level: 1, 
                rep: 0, 
                repNeeded: 5,
                name: '스키어',
                specialty: '부착물'
            },
            peacekeeper: { 
                level: 1, 
                rep: 0, 
                repNeeded: 5,
                name: '피스키퍼',
                specialty: '서방 무기'
            }
        };
    }
    
    addRep(traderName, amount) {
        const trader = this.traders[traderName];
        if (!trader) return false;
        
        trader.rep += amount;
        
        // 레벨업 체크
        if (trader.rep >= trader.repNeeded) {
            trader.level++;
            trader.rep -= trader.repNeeded;
            trader.repNeeded += 5;
            return true; // 레벨업 발생
        }
        
        return false;
    }
    
    getTrader(traderName) {
        return this.traders[traderName];
    }
    
    getAllTraders() {
        return this.traders;
    }
}
