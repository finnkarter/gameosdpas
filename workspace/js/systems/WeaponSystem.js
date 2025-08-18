/**
 * Weapon System
 * Manages all weapon-related functionality including evolution, upgrades, and stats
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { MathUtils } from '../utils/MathUtils.js';

export class WeaponSystem extends EventEmitter {
    constructor() {
        super();
        
        this.weapons = new Map();
        this.weaponDatabase = null;
        this.lastFireTimes = new Map();
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize weapon system
     */
    async initialize() {
        try {
            console.log('🔫 Initializing Weapon System...');
            
            await this.loadWeaponDatabase();
            
            this.isInitialized = true;
            console.log('✅ Weapon System initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Weapon System:', error);
            throw error;
        }
    }
    
    /**
     * Load weapon database
     */
    async loadWeaponDatabase() {
        // Tarkov-inspired weapon database
        this.weaponDatabase = {
            // Tier 1: Pistols
            pistol: {
                id: 'pistol',
                name: 'PM Pistol',
                type: 'pistol',
                tier: 1,
                description: 'Standard issue sidearm. Reliable but limited firepower.',
                stats: {
                    damage: 35,
                    accuracy: 65,
                    rateOfFire: 300, // RPM
                    penetration: 1,
                    range: 50,
                    reliability: 95
                },
                upgrades: {
                    damage: { baseCost: 100, maxLevel: 10 },
                    accuracy: { baseCost: 150, maxLevel: 8 },
                    rateOfFire: { baseCost: 200, maxLevel: 5 },
                    penetration: { baseCost: 300, maxLevel: 3 }
                },
                evolution: {
                    cost: 2500,
                    requirements: { level: 5 },
                    unlocks: ['makarov', 'glock17']
                },
                level: 1,
                image: null,
                icon: '🔫',
                audioSettings: {
                    volume: 0.6,
                    pitch: 1.0
                }
            },
            
            makarov: {
                id: 'makarov',
                name: 'PM Makarov',
                type: 'pistol',
                tier: 1,
                description: 'Improved pistol with better accuracy and reliability.',
                stats: {
                    damage: 42,
                    accuracy: 72,
                    rateOfFire: 350,
                    penetration: 2,
                    range: 60,
                    reliability: 98
                },
                upgrades: {
                    damage: { baseCost: 200, maxLevel: 12 },
                    accuracy: { baseCost: 250, maxLevel: 10 },
                    rateOfFire: { baseCost: 300, maxLevel: 6 },
                    penetration: { baseCost: 400, maxLevel: 4 }
                },
                evolution: {
                    cost: 8000,
                    requirements: { level: 8 },
                    unlocks: ['ak74u', 'ppsh']
                },
                level: 1,
                image: null,
                audioSettings: {
                    volume: 0.7,
                    pitch: 1.1
                }
            },
            
            glock17: {
                id: 'glock17',
                name: 'Glock 17',
                type: 'pistol',
                tier: 1,
                description: 'Modern polymer pistol with high reliability.',
                stats: {
                    damage: 38,
                    accuracy: 75,
                    rateOfFire: 400,
                    penetration: 2,
                    range: 55,
                    reliability: 99
                },
                upgrades: {
                    damage: { baseCost: 180, maxLevel: 12 },
                    accuracy: { baseCost: 220, maxLevel: 10 },
                    rateOfFire: { baseCost: 280, maxLevel: 7 },
                    penetration: { baseCost: 350, maxLevel: 4 }
                },
                evolution: {
                    cost: 7500,
                    requirements: { level: 8 },
                    unlocks: ['mp5', 'ak74u']
                },
                level: 1,
                image: null,
                audioSettings: {
                    volume: 0.65,
                    pitch: 1.2
                }
            },
            
            // Tier 2: SMGs
            ppsh: {
                id: 'ppsh',
                name: 'PPSh-41',
                type: 'smg',
                tier: 2,
                description: 'Classic submachine gun with high rate of fire.',
                stats: {
                    damage: 28,
                    accuracy: 55,
                    rateOfFire: 900,
                    penetration: 2,
                    range: 100,
                    reliability: 85
                },
                upgrades: {
                    damage: { baseCost: 500, maxLevel: 15 },
                    accuracy: { baseCost: 600, maxLevel: 12 },
                    rateOfFire: { baseCost: 400, maxLevel: 8 },
                    penetration: { baseCost: 800, maxLevel: 5 }
                },
                evolution: {
                    cost: 25000,
                    requirements: { level: 12 },
                    unlocks: ['ak74m', 'sks']
                },
                level: 1,
                image: null,
                audioSettings: {
                    volume: 0.8,
                    pitch: 1.3
                }
            },
            
            mp5: {
                id: 'mp5',
                name: 'MP5',
                type: 'smg',
                tier: 2,
                description: 'Precision submachine gun favored by special forces.',
                stats: {
                    damage: 32,
                    accuracy: 68,
                    rateOfFire: 800,
                    penetration: 3,
                    range: 120,
                    reliability: 92
                },
                upgrades: {
                    damage: { baseCost: 600, maxLevel: 15 },
                    accuracy: { baseCost: 500, maxLevel: 12 },
                    rateOfFire: { baseCost: 450, maxLevel: 8 },
                    penetration: { baseCost: 750, maxLevel: 6 }
                },
                evolution: {
                    cost: 30000,
                    requirements: { level: 15 },
                    unlocks: ['m4a1', 'ak74m']
                },
                level: 1,
                image: null, // 'assets/weapons/mp5.png',
                audioSettings: {
                    volume: 0.75,
                    pitch: 1.4
                }
            },
            
            ak74u: {
                id: 'ak74u',
                name: 'AKS-74U',
                type: 'smg',
                tier: 2,
                description: 'Compact assault rifle with good penetration.',
                stats: {
                    damage: 45,
                    accuracy: 62,
                    rateOfFire: 650,
                    penetration: 4,
                    range: 150,
                    reliability: 88
                },
                upgrades: {
                    damage: { baseCost: 700, maxLevel: 18 },
                    accuracy: { baseCost: 650, maxLevel: 15 },
                    rateOfFire: { baseCost: 500, maxLevel: 10 },
                    penetration: { baseCost: 900, maxLevel: 7 }
                },
                evolution: {
                    cost: 35000,
                    requirements: { level: 18 },
                    unlocks: ['ak74m', 'ak105']
                },
                level: 1,
                image: null, // 'assets/weapons/aks74u.png',
                audioSettings: {
                    volume: 0.85,
                    pitch: 1.1
                }
            },
            
            // Tier 3: Assault Rifles
            sks: {
                id: 'sks',
                name: 'SKS',
                type: 'rifle',
                tier: 3,
                description: 'Semi-automatic rifle with high damage per shot.',
                stats: {
                    damage: 75,
                    accuracy: 78,
                    rateOfFire: 240,
                    penetration: 6,
                    range: 400,
                    reliability: 95
                },
                upgrades: {
                    damage: { baseCost: 1200, maxLevel: 20 },
                    accuracy: { baseCost: 1000, maxLevel: 18 },
                    rateOfFire: { baseCost: 800, maxLevel: 8 },
                    penetration: { baseCost: 1500, maxLevel: 10 }
                },
                evolution: {
                    cost: 75000,
                    requirements: { level: 25 },
                    unlocks: ['svd', 'ak74m']
                },
                level: 1,
                image: null, // 'assets/weapons/sks.png',
                audioSettings: {
                    volume: 0.9,
                    pitch: 0.9
                }
            },
            
            ak74m: {
                id: 'ak74m',
                name: 'AK-74M',
                type: 'rifle',
                tier: 3,
                description: 'Modernized assault rifle. Balanced stats.',
                stats: {
                    damage: 52,
                    accuracy: 72,
                    rateOfFire: 650,
                    penetration: 5,
                    range: 300,
                    reliability: 90
                },
                upgrades: {
                    damage: { baseCost: 1500, maxLevel: 25 },
                    accuracy: { baseCost: 1200, maxLevel: 20 },
                    rateOfFire: { baseCost: 1000, maxLevel: 12 },
                    penetration: { baseCost: 1800, maxLevel: 12 }
                },
                evolution: {
                    cost: 125000,
                    requirements: { level: 30 },
                    unlocks: ['ak105', 'm4a1', 'rpk']
                },
                level: 1,
                image: null, // 'assets/weapons/ak74m.png',
                audioSettings: {
                    volume: 0.95,
                    pitch: 1.0
                }
            },
            
            m4a1: {
                id: 'm4a1',
                name: 'M4A1',
                type: 'rifle',
                tier: 3,
                description: 'NATO assault rifle with excellent modularity.',
                stats: {
                    damage: 48,
                    accuracy: 82,
                    rateOfFire: 700,
                    penetration: 5,
                    range: 350,
                    reliability: 88
                },
                upgrades: {
                    damage: { baseCost: 1800, maxLevel: 25 },
                    accuracy: { baseCost: 1400, maxLevel: 22 },
                    rateOfFire: { baseCost: 1100, maxLevel: 15 },
                    penetration: { baseCost: 2000, maxLevel: 12 }
                },
                evolution: {
                    cost: 150000,
                    requirements: { level: 35 },
                    unlocks: ['hk416', 'm249']
                },
                level: 1,
                image: null, // 'assets/weapons/m4a1.png',
                audioSettings: {
                    volume: 0.9,
                    pitch: 1.2
                }
            },
            
            // Tier 4: Sniper Rifles
            svd: {
                id: 'svd',
                name: 'SVD',
                type: 'sniper',
                tier: 4,
                description: 'Designated marksman rifle with extreme range.',
                stats: {
                    damage: 180,
                    accuracy: 95,
                    rateOfFire: 120,
                    penetration: 12,
                    range: 800,
                    reliability: 93
                },
                upgrades: {
                    damage: { baseCost: 5000, maxLevel: 30 },
                    accuracy: { baseCost: 4000, maxLevel: 15 },
                    rateOfFire: { baseCost: 3000, maxLevel: 8 },
                    penetration: { baseCost: 6000, maxLevel: 15 }
                },
                evolution: {
                    cost: 500000,
                    requirements: { level: 50 },
                    unlocks: ['m107']
                },
                level: 1,
                image: null, // 'assets/weapons/svd.png',
                audioSettings: {
                    volume: 1.0,
                    pitch: 0.7
                }
            },
            
            // Tier 5: Heavy Weapons
            rpk: {
                id: 'rpk',
                name: 'RPK-16',
                type: 'lmg',
                tier: 5,
                description: 'Light machine gun with sustained fire capability.',
                stats: {
                    damage: 68,
                    accuracy: 65,
                    rateOfFire: 600,
                    penetration: 8,
                    range: 500,
                    reliability: 85
                },
                upgrades: {
                    damage: { baseCost: 8000, maxLevel: 35 },
                    accuracy: { baseCost: 6000, maxLevel: 25 },
                    rateOfFire: { baseCost: 5000, maxLevel: 15 },
                    penetration: { baseCost: 10000, maxLevel: 20 }
                },
                evolution: {
                    cost: 1000000,
                    requirements: { level: 60 },
                    unlocks: ['pkm']
                },
                level: 1,
                image: null, // 'assets/weapons/rpk16.png',
                audioSettings: {
                    volume: 1.0,
                    pitch: 0.8
                }
            }
        };
        
        console.log(`📚 Loaded ${Object.keys(this.weaponDatabase).length} weapons`);
    }
    
    /**
     * Get weapon by ID
     */
    async getWeapon(weaponId) {
        if (!this.weaponDatabase[weaponId]) {
            console.warn(`Weapon not found: ${weaponId}`);
            return null;
        }
        
        // Create a deep copy to avoid modifying the database
        const weapon = JSON.parse(JSON.stringify(this.weaponDatabase[weaponId]));
        
        return weapon;
    }
    
    /**
     * Fire weapon
     */
    fireWeapon(weapon) {
        if (!weapon) return false;
        
        const now = Date.now();
        const lastFireTime = this.lastFireTimes.get(weapon.id) || 0;
        const fireInterval = 60000 / weapon.stats.rateOfFire; // Convert RPM to ms
        
        if (now - lastFireTime < fireInterval) {
            return false; // Rate of fire limit
        }
        
        this.lastFireTimes.set(weapon.id, now);
        
        try {
            this.emit('weaponFired', {
                weapon: weapon,
                timestamp: now
            });
        } catch (error) {
            console.warn('Error emitting weaponFired event:', error);
        }
        
        return true;
    }
    
    /**
     * Check if weapon can fire
     */
    canFire(weapon) {
        if (!weapon) return false;
        
        const now = Date.now();
        const lastFireTime = this.lastFireTimes.get(weapon.id) || 0;
        const fireInterval = 60000 / weapon.stats.rateOfFire;
        
        return now - lastFireTime >= fireInterval;
    }
    
    /**
     * Reload weapon
     */
    reloadWeapon(weapon) {
        if (!weapon) return false;
        
        // Reset fire timing
        this.lastFireTimes.delete(weapon.id);
        
        this.emit('weaponReloaded', {
            weapon: weapon,
            timestamp: Date.now()
        });
        
        return true;
    }
    
    /**
     * Upgrade weapon stat
     */
    async upgradeWeapon(weapon, upgradeType) {
        if (!weapon || !weapon.upgrades[upgradeType]) {
            return false;
        }
        
        const upgrade = weapon.upgrades[upgradeType];
        const currentLevel = weapon[`${upgradeType}Level`] || 0;
        
        if (currentLevel >= upgrade.maxLevel) {
            return false; // Max level reached
        }
        
        // Apply upgrade
        const newLevel = currentLevel + 1;
        weapon[`${upgradeType}Level`] = newLevel;
        
        // Calculate stat increase
        const baseIncrease = this.calculateUpgradeIncrease(upgradeType, weapon.stats[upgradeType]);
        const levelMultiplier = 1 + (newLevel * 0.1);
        const statIncrease = Math.floor(baseIncrease * levelMultiplier);
        
        weapon.stats[upgradeType] += statIncrease;
        
        // Increase weapon level
        weapon.level = Math.max(weapon.level, Math.floor(this.getTotalUpgradeLevels(weapon) / 3));
        
        this.emit('weaponUpgraded', {
            weapon: weapon,
            upgradeType: upgradeType,
            newLevel: newLevel,
            statIncrease: statIncrease
        });
        
        return true;
    }
    
    /**
     * Calculate stat increase for upgrade
     */
    calculateUpgradeIncrease(upgradeType, baseStat) {
        const increases = {
            damage: Math.max(1, Math.floor(baseStat * 0.1)),
            accuracy: Math.max(1, Math.floor(baseStat * 0.05)),
            rateOfFire: Math.max(5, Math.floor(baseStat * 0.08)),
            penetration: 1
        };
        
        return increases[upgradeType] || 1;
    }
    
    /**
     * Get upgrade cost
     */
    getUpgradeCost(weapon, upgradeType) {
        if (!weapon || !weapon.upgrades[upgradeType]) {
            return Infinity;
        }
        
        const upgrade = weapon.upgrades[upgradeType];
        const currentLevel = weapon[`${upgradeType}Level`] || 0;
        
        return MathUtils.calculateUpgradeCost(upgrade.baseCost, currentLevel);
    }
    
    /**
     * Get total upgrade levels
     */
    getTotalUpgradeLevels(weapon) {
        let total = 0;
        for (const upgradeType of Object.keys(weapon.upgrades)) {
            total += weapon[`${upgradeType}Level`] || 0;
        }
        return total;
    }
    
    /**
     * Evolve weapon to new type
     */
    async evolveWeapon(currentWeapon, newWeaponId) {
        if (!currentWeapon || !this.weaponDatabase[newWeaponId]) {
            return null;
        }
        
        const evolution = currentWeapon.evolution;
        if (!evolution || !evolution.unlocks.includes(newWeaponId)) {
            return null;
        }
        
        // Check requirements
        if (currentWeapon.level < evolution.requirements.level) {
            return null;
        }
        
        // Get new weapon
        const newWeapon = await this.getWeapon(newWeaponId);
        if (!newWeapon) {
            return null;
        }
        
        this.emit('weaponEvolved', {
            oldWeapon: currentWeapon,
            newWeapon: newWeapon
        });
        
        return newWeapon;
    }
    
    /**
     * Get evolution cost
     */
    getEvolutionCost(weaponId) {
        const weapon = this.weaponDatabase[weaponId];
        if (!weapon) return Infinity;
        
        // Find which weapon can evolve to this one
        for (const [id, data] of Object.entries(this.weaponDatabase)) {
            if (data.evolution && data.evolution.unlocks.includes(weaponId)) {
                return data.evolution.cost;
            }
        }
        
        return Infinity;
    }
    
    /**
     * Get available evolutions for weapon
     */
    getAvailableEvolutions(weapon) {
        if (!weapon || !weapon.evolution) {
            return [];
        }
        
        const evolutions = [];
        for (const weaponId of weapon.evolution.unlocks) {
            const targetWeapon = this.weaponDatabase[weaponId];
            if (targetWeapon) {
                evolutions.push({
                    id: weaponId,
                    name: targetWeapon.name,
                    cost: weapon.evolution.cost,
                    requirements: weapon.evolution.requirements,
                    canAfford: false, // Will be set by game engine
                    meetsRequirements: weapon.level >= weapon.evolution.requirements.level
                });
            }
        }
        
        return evolutions;
    }
    
    /**
     * Get weapon stats with modifiers
     */
    getEffectiveStats(weapon) {
        if (!weapon) return null;
        
        const stats = { ...weapon.stats };
        
        // Apply upgrade bonuses
        for (const upgradeType of Object.keys(weapon.upgrades)) {
            const level = weapon[`${upgradeType}Level`] || 0;
            if (level > 0) {
                const bonus = this.calculateUpgradeIncrease(upgradeType, weapon.stats[upgradeType]) * level;
                stats[upgradeType] += bonus;
            }
        }
        
        return stats;
    }
    
    /**
     * Calculate DPS for weapon
     */
    calculateDPS(weapon) {
        const stats = this.getEffectiveStats(weapon);
        if (!stats) return 0;
        
        return MathUtils.calculateDPS(stats.damage, stats.rateOfFire, stats.accuracy / 100);
    }
    
    /**
     * Get weapon by tier
     */
    getWeaponsByTier(tier) {
        const weapons = [];
        for (const [id, weapon] of Object.entries(this.weaponDatabase)) {
            if (weapon.tier === tier) {
                weapons.push({ id, ...weapon });
            }
        }
        return weapons.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    /**
     * Get weapon by type
     */
    getWeaponsByType(type) {
        const weapons = [];
        for (const [id, weapon] of Object.entries(this.weaponDatabase)) {
            if (weapon.type === type) {
                weapons.push({ id, ...weapon });
            }
        }
        return weapons.sort((a, b) => a.tier - b.tier);
    }
    
    /**
     * Restore weapon from save data
     */
    async restoreWeapon(savedWeapon) {
        const baseWeapon = await this.getWeapon(savedWeapon.id);
        if (!baseWeapon) return null;
        
        // Restore upgrades and level
        baseWeapon.level = savedWeapon.level || 1;
        
        for (const upgradeType of Object.keys(baseWeapon.upgrades)) {
            const levelKey = `${upgradeType}Level`;
            if (savedWeapon[levelKey]) {
                baseWeapon[levelKey] = savedWeapon[levelKey];
            }
        }
        
        // Recalculate stats
        baseWeapon.stats = this.getEffectiveStats(baseWeapon);
        
        return baseWeapon;
    }
    
    /**
     * Update weapon system
     */
    update(deltaTime) {
        // Update any time-based weapon effects here
        // For now, just emit an update event
        this.emit('weaponSystemUpdate', { deltaTime });
    }
    
    /**
     * Get weapon database for UI
     */
    getWeaponDatabase() {
        return { ...this.weaponDatabase };
    }
    
    /**
     * Load weapon data (for loading screen)
     */
    async loadWeaponData() {
        // Quick validation of weapon database
        const weaponCount = Object.keys(this.weaponDatabase).length;
        console.log(`📚 Validated ${weaponCount} weapons`);
        
        return true;
    }
    
    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default WeaponSystem;
