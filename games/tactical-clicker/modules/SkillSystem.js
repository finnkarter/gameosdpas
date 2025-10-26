// 스킬 시스템
class SkillSystem {
    constructor() {
        this.skills = {
            accuracy: { level: 1, exp: 0, expNeeded: 100 },
            reload: { level: 1, exp: 0, expNeeded: 100 },
            looting: { level: 1, exp: 0, expNeeded: 100 },
            combat: { level: 1, exp: 0, expNeeded: 100 }
        };
    }
    
    gainExp(skillName, amount) {
        const skill = this.skills[skillName];
        if (!skill) return false;
        
        skill.exp += amount;
        const levelsGained = [];
        
        while (skill.exp >= skill.expNeeded) {
            skill.exp -= skill.expNeeded;
            skill.level++;
            skill.expNeeded = Math.floor(skill.expNeeded * 1.3);
            levelsGained.push(skill.level);
        }
        
        return levelsGained.length > 0;
    }
    
    getBonus(skillName) {
        const skill = this.skills[skillName];
        if (!skill) return 0;
        
        switch(skillName) {
            case 'accuracy':
                return skill.level;
            case 'reload':
                return (skill.level - 1) * 5;
            case 'looting':
                return (skill.level - 1) * 2;
            case 'combat':
                return (skill.level - 1) * 3;
            default:
                return 0;
        }
    }
    
    getSkill(skillName) {
        return this.skills[skillName];
    }
}
