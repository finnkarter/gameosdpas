/**
 * Save System
 * Handles game state persistence using localStorage
 */

import { EventEmitter } from '../utils/EventEmitter.js';

export class SaveSystem extends EventEmitter {
    constructor() {
        super();
        
        this.saveKey = 'eft_gun_evolution_save';
        this.compressionEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.lastSaveTime = 0;
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize save system
     */
    async initialize() {
        try {
            console.log('💾 Initializing Save System...');
            
            // Check localStorage availability
            this.checkLocalStorageSupport();
            
            // Migrate old saves if needed
            await this.migrateSaveData();
            
            this.isInitialized = true;
            console.log('✅ Save System initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Save System:', error);
            throw error;
        }
    }
    
    /**
     * Check if localStorage is supported
     */
    checkLocalStorageSupport() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('localStorage not available, save system disabled');
            return false;
        }
    }
    
    /**
     * Save game state
     */
    saveGameState(gameState) {
        try {
            if (!this.checkLocalStorageSupport()) {
                return false;
            }
            
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                gameState: this.sanitizeGameState(gameState)
            };
            
            const serialized = this.compressionEnabled 
                ? this.compressData(JSON.stringify(saveData))
                : JSON.stringify(saveData);
            
            localStorage.setItem(this.saveKey, serialized);
            this.lastSaveTime = Date.now();
            
            this.emit('gameSaved', { timestamp: this.lastSaveTime });
            console.log('💾 Game saved successfully');
            
            return true;
            
        } catch (error) {
            console.error('Failed to save game:', error);
            this.emit('saveError', error);
            return false;
        }
    }
    
    /**
     * Load game state
     */
    async loadGameState() {
        try {
            if (!this.checkLocalStorageSupport()) {
                return null;
            }
            
            const saved = localStorage.getItem(this.saveKey);
            if (!saved) {
                console.log('No save data found');
                return null;
            }
            
            const decompressed = this.compressionEnabled 
                ? this.decompressData(saved)
                : saved;
            
            const saveData = JSON.parse(decompressed);
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                console.warn('Invalid save data detected');
                return null;
            }
            
            console.log(`💾 Game loaded (saved: ${new Date(saveData.timestamp).toLocaleString()})`);
            this.emit('gameLoaded', saveData);
            
            return saveData.gameState;
            
        } catch (error) {
            console.error('Failed to load game:', error);
            this.emit('loadError', error);
            return null;
        }
    }
    
    /**
     * Delete save data
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            this.emit('saveDeleted');
            console.log('💾 Save data deleted');
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    
    /**
     * Export save data
     */
    exportSave() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (!saved) return null;
            
            const saveData = {
                game: 'Escape From Training',
                exported: Date.now(),
                data: saved
            };
            
            return btoa(JSON.stringify(saveData));
            
        } catch (error) {
            console.error('Failed to export save:', error);
            return null;
        }
    }
    
    /**
     * Import save data
     */
    importSave(importString) {
        try {
            const decoded = JSON.parse(atob(importString));
            
            if (decoded.game !== 'Escape From Training') {
                throw new Error('Invalid save file');
            }
            
            localStorage.setItem(this.saveKey, decoded.data);
            this.emit('saveImported');
            console.log('💾 Save imported successfully');
            
            return true;
            
        } catch (error) {
            console.error('Failed to import save:', error);
            this.emit('importError', error);
            return false;
        }
    }
    
    /**
     * Sanitize game state before saving
     */
    sanitizeGameState(gameState) {
        const sanitized = JSON.parse(JSON.stringify(gameState));
        
        // Remove non-serializable data
        delete sanitized.autoFireInterval;
        delete sanitized.isPaused;
        
        // Remove temporary UI state
        if (sanitized.ui) {
            delete sanitized.ui.animations;
            delete sanitized.ui.activeModals;
        }
        
        return sanitized;
    }
    
    /**
     * Validate save data integrity
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }
        
        if (!saveData.version || !saveData.timestamp || !saveData.gameState) {
            return false;
        }
        
        if (typeof saveData.gameState !== 'object') {
            return false;
        }
        
        // Check required fields
        const required = ['player', 'currentWeapon', 'statistics'];
        for (const field of required) {
            if (!saveData.gameState[field]) {
                console.warn(`Missing required field: ${field}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Migrate old save data to new format
     */
    async migrateSaveData() {
        // Check for old save formats and migrate them
        const oldKeys = ['gun_evolution_save', 'weapon_clicker_save'];
        
        for (const oldKey of oldKeys) {
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                console.log(`Migrating save data from ${oldKey}`);
                
                try {
                    const migrated = this.migrateOldFormat(JSON.parse(oldData));
                    if (migrated) {
                        localStorage.setItem(this.saveKey, JSON.stringify(migrated));
                        localStorage.removeItem(oldKey);
                        console.log('✅ Save data migrated successfully');
                    }
                } catch (error) {
                    console.warn('Failed to migrate old save data:', error);
                }
            }
        }
    }
    
    /**
     * Migrate old save format
     */
    migrateOldFormat(oldData) {
        // Convert old format to new format
        const migrated = {
            version: '1.0.0',
            timestamp: Date.now(),
            gameState: {
                player: {
                    money: oldData.money || 1000,
                    xp: oldData.xp || 0,
                    level: oldData.level || 1,
                    shotsFired: oldData.shotsFired || 0,
                    shotsHit: oldData.shotsHit || 0,
                    headshotCount: oldData.headshotCount || 0,
                    totalDamage: oldData.totalDamage || 0,
                    playTime: oldData.playTime || 0,
                    prestige: oldData.prestige || 0
                },
                currentWeapon: oldData.currentWeapon || null,
                currentRange: oldData.currentRange || 'factory',
                statistics: oldData.statistics || {
                    totalClicks: 0,
                    totalMoney: 0,
                    weaponsUnlocked: 0,
                    upgradesPurchased: 0,
                    targetsDestroyed: 0
                }
            }
        };
        
        return migrated;
    }
    
    /**
     * Simple data compression
     */
    compressData(data) {
        try {
            // Simple RLE compression for repeated characters
            return data.replace(/(.)\1{2,}/g, (match, char) => {
                return `${char}*${match.length}`;
            });
        } catch (error) {
            return data; // Return original if compression fails
        }
    }
    
    /**
     * Simple data decompression
     */
    decompressData(data) {
        try {
            // Decompress RLE
            return data.replace(/(.)\*(\d+)/g, (match, char, count) => {
                return char.repeat(parseInt(count));
            });
        } catch (error) {
            return data; // Return original if decompression fails
        }
    }
    
    /**
     * Get save file info
     */
    getSaveInfo() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (!saved) return null;
            
            const decompressed = this.compressionEnabled 
                ? this.decompressData(saved)
                : saved;
            
            const saveData = JSON.parse(decompressed);
            
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                lastSaved: new Date(saveData.timestamp).toLocaleString(),
                size: saved.length,
                player: saveData.gameState?.player || null
            };
            
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }
    
    /**
     * Auto-save functionality
     */
    startAutoSave(gameEngine) {
        setInterval(() => {
            if (gameEngine && Date.now() - this.lastSaveTime > this.autoSaveInterval) {
                this.saveGameState(gameEngine.getGameState());
            }
        }, 5000); // Check every 5 seconds
    }
    
    /**
     * Create backup save
     */
    createBackup() {
        try {
            const current = localStorage.getItem(this.saveKey);
            if (current) {
                const backupKey = `${this.saveKey}_backup_${Date.now()}`;
                localStorage.setItem(backupKey, current);
                
                // Keep only last 3 backups
                this.cleanupBackups();
                
                return backupKey;
            }
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
        return null;
    }
    
    /**
     * Cleanup old backups
     */
    cleanupBackups() {
        try {
            const backups = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.saveKey}_backup_`)) {
                    const timestamp = parseInt(key.split('_').pop());
                    backups.push({ key, timestamp });
                }
            }
            
            // Sort by timestamp and keep only newest 3
            backups.sort((a, b) => b.timestamp - a.timestamp);
            
            for (let i = 3; i < backups.length; i++) {
                localStorage.removeItem(backups[i].key);
            }
            
        } catch (error) {
            console.error('Failed to cleanup backups:', error);
        }
    }
    
    /**
     * Get available backups
     */
    getBackups() {
        const backups = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.saveKey}_backup_`)) {
                    const timestamp = parseInt(key.split('_').pop());
                    backups.push({
                        key,
                        timestamp,
                        date: new Date(timestamp).toLocaleString()
                    });
                }
            }
            
            return backups.sort((a, b) => b.timestamp - a.timestamp);
            
        } catch (error) {
            console.error('Failed to get backups:', error);
            return [];
        }
    }
    
    /**
     * Restore from backup
     */
    restoreBackup(backupKey) {
        try {
            const backup = localStorage.getItem(backupKey);
            if (backup) {
                // Create backup of current save
                this.createBackup();
                
                // Restore from backup
                localStorage.setItem(this.saveKey, backup);
                
                this.emit('backupRestored', { backupKey });
                console.log('💾 Backup restored successfully');
                
                return true;
            }
        } catch (error) {
            console.error('Failed to restore backup:', error);
            this.emit('restoreError', error);
        }
        
        return false;
    }
}

export default SaveSystem;
