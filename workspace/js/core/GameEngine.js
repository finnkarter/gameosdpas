/**
 * Game Engine Core
 * Manages game state, logic, and coordination between systems
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameEngine extends EventEmitter {
    constructor(systems) {
        super();
        
        // System references
        this.weaponSystem = systems.weaponSystem;
        this.saveSystem = systems.saveSystem;
        this.audioManager = systems.audioManager;
        this.notificationSystem = systems.notificationSystem;
        this.uiManager = systems.uiManager;
        
        // Game state
        this.gameState = {
            player: {
                money: 1000,
                xp: 0,
                level: 1,
                shotsFired: 0,
                shotsHit: 0,
                headshotCount: 0,
                totalDamage: 0,
                playTime: 0,
                prestige: 0
            },
            currentWeapon: null,
            currentRange: 'factory',
            isAutoFire: false,
            autoFireInterval: null,
            gameSpeed: 1.0,
            isPaused: false,
            lastSaveTime: Date.now(),
            statistics: {
                totalClicks: 0,
                totalMoney: 0,
                weaponsUnlocked: 0,
                upgradesPurchased: 0,
                targetsDestroyed: 0
            }
        };
        
        // Combat settings
        this.combatSettings = {
            baseAccuracy: 0.7,
            headshotChance: 0.1,
            criticalChance: 0.05,
            targetValues: {
                'factory': { base: 10, multiplier: 1.0 },
                'woods': { base: 15, multiplier: 1.2 },
                'customs': { base: 20, multiplier: 1.5 }
            }
        };
        
        // Auto-save settings
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastAutoSave = Date.now();
        
        // Performance tracking
        this.frameCount = 0;
        this.fpsCounter = 0;
        this.lastFpsUpdate = 0;
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize the game engine
     */
    async initialize() {
        try {
            console.log('🎮 Initializing Game Engine...');
            
            // Initialize with default weapon
            await this.initializeDefaultWeapon();
            
            // Start auto-save timer
            this.startAutoSave();
            
            // Calculate initial DPS
            this.updateDPS();
            
            this.isInitialized = true;
            
            console.log('✅ Game Engine initialized');
            this.emit('engineInitialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Game Engine:', error);
            throw error;
        }
    }
    
    /**
     * Initialize with default weapon
     */
    async initializeDefaultWeapon() {
        const defaultWeapon = await this.weaponSystem.getWeapon('pistol');
        if (defaultWeapon) {
            this.gameState.currentWeapon = defaultWeapon;
            this.emit('weaponChanged', defaultWeapon);
        }
    }
    
    /**
     * Main update loop
     */
    update(deltaTime) {
        if (!this.isInitialized || this.gameState.isPaused) return;
        
        // Update frame counter
        this.frameCount++;
        this.updateFPS(deltaTime);
        
        // Update play time
        this.gameState.player.playTime += deltaTime;
        
        // Handle auto-fire
        if (this.gameState.isAutoFire) {
            this.handleAutoFire(deltaTime);
        }
        
        // Auto-save check
        this.checkAutoSave();
        
        // Update weapon system
        this.weaponSystem.update(deltaTime);
        
        // Emit stats update less frequently
        if (this.frameCount % 30 === 0) { // Every 0.5 seconds at 60fps
            this.emit('playerStatsChanged', this.gameState.player);
        }
    }
    
    /**
     * Handle firing weapon
     */
    handleFire(targetX = null, targetY = null) {
        if (!this.gameState.currentWeapon || this.gameState.isPaused) return;
        
        const weapon = this.gameState.currentWeapon;
        
        // Check if weapon can fire (rate of fire limit)
        if (!this.weaponSystem.canFire(weapon)) return;
        
        // Update statistics
        this.gameState.player.shotsFired++;
        this.gameState.statistics.totalClicks++;
        
        // Calculate hit chance
        const hitChance = this.calculateHitChance(weapon, targetX, targetY);
        const isHit = Math.random() < hitChance;
        
        if (isHit) {
            this.handleHit(weapon, targetX, targetY);
        } else {
            this.handleMiss(weapon, targetX, targetY);
        }
        
        // Fire weapon
        this.weaponSystem.fireWeapon(weapon);
        
        // Emit fire event
        this.emit('weaponFired', {
            weapon: weapon,
            isHit: isHit,
            targetX: targetX,
            targetY: targetY
        });
    }
    
    /**
     * Handle successful hit
     */
    handleHit(weapon, targetX, targetY) {
        this.gameState.player.shotsHit++;
        
        // Calculate damage and special hits
        const damage = this.calculateDamage(weapon);
        const isHeadshot = Math.random() < this.combatSettings.headshotChance;
        const isCritical = Math.random() < this.combatSettings.criticalChance;
        
        let finalDamage = damage;
        let hitType = 'normal';
        
        if (isHeadshot) {
            finalDamage *= 3;
            hitType = 'headshot';
            this.gameState.player.headshotCount++;
        } else if (isCritical) {
            finalDamage *= 2;
            hitType = 'critical';
        }
        
        // Calculate money reward
        const baseReward = this.combatSettings.targetValues[this.gameState.currentRange].base;
        const multiplier = this.combatSettings.targetValues[this.gameState.currentRange].multiplier;
        const moneyReward = Math.floor(finalDamage * baseReward * multiplier);
        
        // Add money and XP
        this.addMoney(moneyReward);
        this.addXP(Math.floor(finalDamage / 10));
        
        // Update statistics
        this.gameState.player.totalDamage += finalDamage;
        
        // Emit hit event
        this.emit('targetHit', {
            damage: finalDamage,
            moneyReward: moneyReward,
            hitType: hitType,
            targetX: targetX,
            targetY: targetY,
            weapon: weapon
        });
        
        if (isHeadshot) {
            this.emit('headshotHit', { damage: finalDamage, weapon: weapon });
        }
        
        if (isCritical) {
            this.emit('criticalHit', { damage: finalDamage, weapon: weapon });
        }
    }
    
    /**
     * Handle missed shot
     */
    handleMiss(weapon, targetX, targetY) {
        this.emit('targetMiss', {
            weapon: weapon,
            targetX: targetX,
            targetY: targetY
        });
    }
    
    /**
     * Calculate hit chance based on weapon accuracy and target position
     */
    calculateHitChance(weapon, targetX, targetY) {
        let baseAccuracy = weapon.stats.accuracy / 100;
        
        // Add range-specific modifiers
        const rangeModifier = this.combatSettings.targetValues[this.gameState.currentRange].multiplier;
        baseAccuracy *= rangeModifier;
        
        // Add player skill modifiers
        const skillModifier = 1 + (this.gameState.player.level * 0.01);
        baseAccuracy *= skillModifier;
        
        // Cap accuracy between 0.1 and 0.95
        return MathUtils.clamp(baseAccuracy, 0.1, 0.95);
    }
    
    /**
     * Calculate damage based on weapon and modifiers
     */
    calculateDamage(weapon) {
        let baseDamage = weapon.stats.damage;
        
        // Add weapon level modifiers
        baseDamage *= (1 + weapon.level * 0.1);
        
        // Add random variance (±10%)
        const variance = 0.1;
        const randomMultiplier = 1 + (Math.random() - 0.5) * variance * 2;
        
        return Math.floor(baseDamage * randomMultiplier);
    }
    
    /**
     * Handle auto-fire
     */
    handleAutoFire(deltaTime) {
        if (!this.gameState.autoFireInterval) {
            this.gameState.autoFireInterval = 0;
        }
        
        this.gameState.autoFireInterval += deltaTime;
        
        const fireRate = this.gameState.currentWeapon.stats.rateOfFire / 60; // Convert RPM to RPS
        const fireInterval = 1 / fireRate;
        
        if (this.gameState.autoFireInterval >= fireInterval) {
            this.handleFire();
            this.gameState.autoFireInterval = 0;
        }
    }
    
    /**
     * Add money to player
     */
    addMoney(amount) {
        this.gameState.player.money += amount;
        this.gameState.statistics.totalMoney += amount;
        this.emit('moneyChanged', {
            amount: amount,
            total: this.gameState.player.money
        });
    }
    
    /**
     * Spend money
     */
    spendMoney(amount) {
        if (this.gameState.player.money >= amount) {
            this.gameState.player.money -= amount;
            this.emit('moneyChanged', {
                amount: -amount,
                total: this.gameState.player.money
            });
            return true;
        }
        return false;
    }
    
    /**
     * Add XP to player
     */
    addXP(amount) {
        const oldLevel = this.gameState.player.level;
        this.gameState.player.xp += amount;
        
        // Check for level up
        const newLevel = this.calculateLevel(this.gameState.player.xp);
        if (newLevel > oldLevel) {
            this.handleLevelUp(oldLevel, newLevel);
        }
        
        this.emit('xpChanged', {
            amount: amount,
            total: this.gameState.player.xp,
            level: this.gameState.player.level
        });
    }
    
    /**
     * Calculate level from XP
     */
    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
    
    /**
     * Calculate XP required for next level
     */
    getXPForNextLevel(level) {
        return Math.pow(level, 2) * 100;
    }
    
    /**
     * Handle level up
     */
    handleLevelUp(oldLevel, newLevel) {
        this.gameState.player.level = newLevel;
        
        // Give level up rewards
        const moneyReward = newLevel * 500;
        this.addMoney(moneyReward);
        
        this.emit('levelUp', {
            oldLevel: oldLevel,
            newLevel: newLevel,
            moneyReward: moneyReward
        });
        
        this.notificationSystem.show({
            type: 'achievement',
            title: 'LEVEL UP!',
            message: `PMC Level ${newLevel} reached! +${moneyReward} roubles`,
            duration: 4000
        });
    }
    
    /**
     * Upgrade weapon
     */
    async upgradeWeapon(upgradeType) {
        if (!this.gameState.currentWeapon) return false;
        
        const weapon = this.gameState.currentWeapon;
        const cost = this.weaponSystem.getUpgradeCost(weapon, upgradeType);
        
        if (this.spendMoney(cost)) {
            const success = await this.weaponSystem.upgradeWeapon(weapon, upgradeType);
            
            if (success) {
                this.gameState.statistics.upgradesPurchased++;
                this.updateDPS();
                
                this.emit('weaponUpgraded', {
                    weapon: weapon,
                    upgradeType: upgradeType,
                    cost: cost
                });
                
                return true;
            } else {
                // Refund money if upgrade failed
                this.addMoney(cost);
            }
        }
        
        return false;
    }
    
    /**
     * Evolve to new weapon
     */
    async evolveWeapon(newWeaponId) {
        const cost = this.weaponSystem.getEvolutionCost(newWeaponId);
        
        if (this.spendMoney(cost)) {
            const newWeapon = await this.weaponSystem.evolveWeapon(this.gameState.currentWeapon, newWeaponId);
            
            if (newWeapon) {
                this.gameState.currentWeapon = newWeapon;
                this.gameState.statistics.weaponsUnlocked++;
                this.updateDPS();
                
                this.emit('weaponEvolved', {
                    oldWeapon: this.gameState.currentWeapon,
                    newWeapon: newWeapon,
                    cost: cost
                });
                
                this.emit('weaponChanged', newWeapon);
                
                return true;
            } else {
                // Refund money if evolution failed
                this.addMoney(cost);
            }
        }
        
        return false;
    }
    
    /**
     * Change shooting range
     */
    changeRange(rangeName) {
        if (this.combatSettings.targetValues[rangeName]) {
            this.gameState.currentRange = rangeName;
            this.emit('rangeChanged', rangeName);
        }
    }
    
    /**
     * Toggle auto-fire
     */
    toggleAutoFire() {
        this.gameState.isAutoFire = !this.gameState.isAutoFire;
        this.gameState.autoFireInterval = 0;
        
        this.emit('autoFireChanged', this.gameState.isAutoFire);
    }
    
    /**
     * Update DPS calculation
     */
    updateDPS() {
        if (!this.gameState.currentWeapon) return;
        
        const weapon = this.gameState.currentWeapon;
        const damage = weapon.stats.damage * (1 + weapon.level * 0.1);
        const fireRate = weapon.stats.rateOfFire / 60; // Convert RPM to RPS
        const accuracy = weapon.stats.accuracy / 100;
        
        const dps = damage * fireRate * accuracy;
        
        this.emit('dpsChanged', dps);
    }
    
    /**
     * Handle reload
     */
    handleReload() {
        if (this.gameState.currentWeapon) {
            this.weaponSystem.reloadWeapon(this.gameState.currentWeapon);
            this.emit('weaponReloaded', this.gameState.currentWeapon);
        }
    }
    
    /**
     * Update FPS counter
     */
    updateFPS(deltaTime) {
        this.fpsCounter += deltaTime;
        
        if (this.fpsCounter >= 1.0) {
            const fps = this.frameCount / this.fpsCounter;
            this.emit('fpsUpdated', Math.round(fps));
            
            this.frameCount = 0;
            this.fpsCounter = 0;
        }
    }
    
    /**
     * Auto-save game state
     */
    startAutoSave() {
        setInterval(() => {
            if (Date.now() - this.lastAutoSave >= this.autoSaveInterval) {
                this.saveGame();
                this.lastAutoSave = Date.now();
            }
        }, 5000); // Check every 5 seconds
    }
    
    /**
     * Check if auto-save is needed
     */
    checkAutoSave() {
        if (Date.now() - this.lastAutoSave >= this.autoSaveInterval) {
            this.saveGame();
            this.lastAutoSave = Date.now();
        }
    }
    
    /**
     * Save game state
     */
    saveGame() {
        this.gameState.lastSaveTime = Date.now();
        this.saveSystem.saveGameState(this.gameState);
        this.emit('gameSaved');
    }
    
    /**
     * Load game state
     */
    loadGameState(savedState) {
        if (savedState) {
            this.gameState = { ...this.gameState, ...savedState };
            
            // Restore current weapon
            if (savedState.currentWeapon) {
                this.weaponSystem.restoreWeapon(savedState.currentWeapon).then(weapon => {
                    this.gameState.currentWeapon = weapon;
                    this.emit('weaponChanged', weapon);
                    this.updateDPS();
                });
            }
            
            this.emit('gameLoaded', this.gameState);
        }
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        return { ...this.gameState };
    }
    
    /**
     * Pause/Resume game
     */
    pause() {
        this.gameState.isPaused = true;
        this.emit('gamePaused');
    }
    
    resume() {
        this.gameState.isPaused = false;
        this.emit('gameResumed');
    }
    
    togglePause() {
        if (this.gameState.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    /**
     * Reset game (prestige)
     */
    prestige() {
        const currentPrestige = this.gameState.player.prestige;
        
        // Save prestige stats
        const prestigeBonus = {
            level: currentPrestige + 1,
            moneyMultiplier: 1 + (currentPrestige * 0.1),
            xpMultiplier: 1 + (currentPrestige * 0.05)
        };
        
        // Reset player stats but keep prestige
        this.gameState.player = {
            money: 1000,
            xp: 0,
            level: 1,
            shotsFired: 0,
            shotsHit: 0,
            headshotCount: 0,
            totalDamage: 0,
            playTime: this.gameState.player.playTime,
            prestige: currentPrestige + 1
        };
        
        // Reset to default weapon
        this.initializeDefaultWeapon();
        
        this.emit('prestigeActivated', prestigeBonus);
        
        this.notificationSystem.show({
            type: 'achievement',
            title: 'PRESTIGE ACTIVATED!',
            message: `Prestige Level ${prestigeBonus.level} - Permanent bonuses unlocked!`,
            duration: 6000
        });
    }
    
    /**
     * Handle weapon fired event
     */
    handleWeaponFired(data) {
        // Update weapon statistics if needed
        console.log('Weapon fired:', data.weapon?.name || 'Unknown weapon');
    }
    
    /**
     * Handle weapon upgraded event
     */
    handleWeaponUpgraded(data) {
        // Update game state for weapon upgrade
        console.log('Weapon upgraded:', data.weapon?.name || 'Unknown weapon');
    }
    
    /**
     * Handle weapon evolved event
     */
    handleWeaponEvolved(data) {
        // Update game state for weapon evolution
        console.log('Weapon evolved:', data.newWeapon?.name || 'Unknown weapon');
    }
    
    /**
     * Get player statistics
     */
    getStatistics() {
        const stats = { ...this.gameState.statistics };
        
        // Calculate derived stats
        stats.accuracy = this.gameState.player.shotsFired > 0 
            ? (this.gameState.player.shotsHit / this.gameState.player.shotsFired * 100).toFixed(1)
            : 0;
        
        stats.headshotRatio = this.gameState.player.shotsHit > 0
            ? (this.gameState.player.headshotCount / this.gameState.player.shotsHit * 100).toFixed(1)
            : 0;
        
        stats.damagePerShot = this.gameState.player.shotsFired > 0
            ? (this.gameState.player.totalDamage / this.gameState.player.shotsFired).toFixed(1)
            : 0;
        
        return stats;
    }
}

export default GameEngine;
