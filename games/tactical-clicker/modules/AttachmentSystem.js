// 부착물 시스템
class AttachmentSystem {
    constructor() {
        this.attachments = {
            // 조준경 (Optics)
            eotech553: {
                id: 'eotech553',
                name: 'EOTech 553',
                type: 'optic',
                stats: { accuracy: 5, ergo: -1 },
                price: 8000,
                unlocked: false,
                equipped: false
            },
            aimpoint: {
                id: 'aimpoint',
                name: 'Aimpoint Micro T-1',
                type: 'optic',
                stats: { accuracy: 7, ergo: 0 },
                price: 12000,
                unlocked: false,
                equipped: false
            },
            acog: {
                id: 'acog',
                name: 'Trijicon ACOG 4x',
                type: 'optic',
                stats: { accuracy: 15, ergo: -3 },
                price: 25000,
                unlocked: false,
                equipped: false
            },
            
            // 총구 (Muzzle)
            lantac: {
                id: 'lantac',
                name: 'Lantac Dragon',
                type: 'muzzle',
                stats: { recoil: -10, accuracy: 3 },
                price: 6000,
                unlocked: false,
                equipped: false
            },
            suppressor: {
                id: 'suppressor',
                name: 'Gemtech ONE',
                type: 'muzzle',
                stats: { recoil: -5, stealth: 20 },
                price: 15000,
                unlocked: false,
                equipped: false
            },
            
            // 그립 (Grip)
            magpulafg: {
                id: 'magpulafg',
                name: 'Magpul AFG',
                type: 'grip',
                stats: { recoil: -8, ergo: 5 },
                price: 5000,
                unlocked: false,
                equipped: false
            },
            rkgrip: {
                id: 'rkgrip',
                name: 'Zenit RK-6',
                type: 'grip',
                stats: { recoil: -12, ergo: 2 },
                price: 8000,
                unlocked: false,
                equipped: false
            },
            
            // 개머리판 (Stock)
            magpulctr: {
                id: 'magpulctr',
                name: 'Magpul CTR',
                type: 'stock',
                stats: { recoil: -5, ergo: 8 },
                price: 7000,
                unlocked: false,
                equipped: false
            },
            
            // 탄창 (Magazine)
            extmag: {
                id: 'extmag',
                name: '확장 탄창',
                type: 'magazine',
                stats: { magSize: 10, reload: 5 },
                price: 10000,
                unlocked: false,
                equipped: false
            }
        };
        
        this.equipped = {
            optic: null,
            muzzle: null,
            grip: null,
            stock: null,
            magazine: null
        };
    }
    
    buyAttachment(attachmentId) {
        const attachment = this.attachments[attachmentId];
        if (!attachment || attachment.unlocked) return false;
        
        attachment.unlocked = true;
        return true;
    }
    
    equipAttachment(attachmentId) {
        const attachment = this.attachments[attachmentId];
        if (!attachment || !attachment.unlocked) return false;
        
        const type = attachment.type;
        
        // 기존 장착 해제
        if (this.equipped[type]) {
            this.attachments[this.equipped[type]].equipped = false;
        }
        
        // 새 부착물 장착
        this.equipped[type] = attachmentId;
        attachment.equipped = true;
        
        return true;
    }
    
    unequipAttachment(type) {
        if (this.equipped[type]) {
            this.attachments[this.equipped[type]].equipped = false;
            this.equipped[type] = null;
            return true;
        }
        return false;
    }
    
    getTotalStats() {
        const stats = {
            accuracy: 0,
            recoil: 0,
            ergo: 0,
            stealth: 0,
            magSize: 0,
            reload: 0
        };
        
        Object.values(this.equipped).forEach(attachmentId => {
            if (attachmentId) {
                const attachment = this.attachments[attachmentId];
                Object.entries(attachment.stats).forEach(([stat, value]) => {
                    stats[stat] += value;
                });
            }
        });
        
        return stats;
    }
    
    getAttachment(attachmentId) {
        return this.attachments[attachmentId];
    }
    
    getAttachmentsByType(type) {
        return Object.values(this.attachments).filter(att => att.type === type);
    }
    
    getAllAttachments() {
        return this.attachments;
    }
}
