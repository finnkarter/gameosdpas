/**
 * UI Manager
 * Handles all user interface interactions and updates
 */

import { EventEmitter } from '../utils/EventEmitter.js';
import { MathUtils } from '../utils/MathUtils.js';

export class UIManager extends EventEmitter {
    constructor() {
        super();
        
        this.gameEngine = null;
        this.elements = new Map();
        this.animations = new Map();
        this.damageNumbers = [];
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize UI Manager
     */
    async initialize() {
        try {
            console.log('🎨 Initializing UI Manager...');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize components
            this.initializeComponents();
            
            this.isInitialized = true;
            console.log('✅ UI Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize UI Manager:', error);
            throw error;
        }
    }
    
    /**
     * Cache frequently used DOM elements
     */
    cacheElements() {
        const elementIds = [
            'player-money', 'player-xp', 'player-dps', 'player-efficiency',
            'weapon-name', 'weapon-condition', 'current-weapon',
            'fire-button', 'modify-button', 'upgrade-button',
            'shots-fired', 'shots-hit', 'accuracy-percent', 'headshots',
            'damage-numbers', 'hit-effects', 'game-time'
        ];
        
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements.set(id, element);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
        
        // Cache element groups
        this.elements.set('range-buttons', document.querySelectorAll('.range-btn'));
        this.elements.set('nav-buttons', document.querySelectorAll('.nav-btn'));
        this.elements.set('targets', document.querySelectorAll('.target'));
        this.elements.set('stat-bars', document.querySelectorAll('.stat-fill'));
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Fire button
        const fireButton = this.elements.get('fire-button');
        if (fireButton) {
            fireButton.addEventListener('click', () => this.handleFireClick());
            fireButton.addEventListener('mousedown', () => this.addButtonPressEffect(fireButton));
        }
        
        // Modify button
        const modifyButton = this.elements.get('modify-button');
        if (modifyButton) {
            modifyButton.addEventListener('click', () => this.showModifyPanel());
        }
        
        // Upgrade button
        const upgradeButton = this.elements.get('upgrade-button');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => this.showUpgradePanel());
        }
        
        // Range selection
        this.elements.get('range-buttons')?.forEach(button => {
            button.addEventListener('click', () => this.handleRangeChange(button.dataset.range));
        });
        
        // Navigation
        this.elements.get('nav-buttons')?.forEach(button => {
            button.addEventListener('click', () => this.handleNavigation(button.dataset.section));
        });
        
        // Target clicking
        this.elements.get('targets')?.forEach((target, index) => {
            target.addEventListener('click', (e) => this.handleTargetClick(e, index));
        });
        
        // Shooting range click
        const shootingRange = document.querySelector('.range-background');
        if (shootingRange) {
            shootingRange.addEventListener('click', (e) => this.handleShootingRangeClick(e));
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Prevent right-click context menu on game elements
        document.querySelectorAll('.game-container *').forEach(element => {
            element.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }
    
    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Set initial weapon display
        this.updateWeaponDisplay();
        
        // Set initial stats
        this.updatePlayerStats({
            money: 1000,
            xp: 0,
            level: 1,
            shotsFired: 0,
            shotsHit: 0,
            headshotCount: 0
        });
        
        // Initialize range selection
        this.setActiveRange('factory');
        
        // Initialize navigation
        this.setActiveNavigation('stash');
    }
    
    /**
     * Set game engine reference
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Connect to game engine events
        this.gameEngine.on('targetHit', (data) => this.showDamageNumber(data));
        this.gameEngine.on('weaponChanged', (weapon) => this.updateWeaponDisplay(weapon));
        this.gameEngine.on('rangeChanged', (range) => this.setActiveRange(range));
    }
    
    /**
     * Handle fire button click
     */
    handleFireClick() {
        try {
            if (this.gameEngine && typeof this.gameEngine.handleFire === 'function') {
                this.gameEngine.handleFire();
                this.playFireAnimation();
            }
        } catch (error) {
            console.warn('Error handling fire click:', error);
        }
    }
    
    /**
     * Handle target click
     */
    handleTargetClick(event, targetIndex) {
        event.stopPropagation();
        
        if (this.gameEngine) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.gameEngine.handleFire(x, y);
            this.playTargetHitAnimation(event.currentTarget);
        }
    }
    
    /**
     * Handle shooting range click
     */
    handleShootingRangeClick(event) {
        if (this.gameEngine) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.gameEngine.handleFire(x, y);
        }
    }
    
    /**
     * Handle range change
     */
    handleRangeChange(rangeName) {
        if (this.gameEngine) {
            this.gameEngine.changeRange(rangeName);
        }
        this.setActiveRange(rangeName);
    }
    
    /**
     * Handle navigation
     */
    handleNavigation(section) {
        this.setActiveNavigation(section);
        
        switch (section) {
            case 'stash':
                this.showStashPanel();
                break;
            case 'trader':
                this.showTraderPanel();
                break;
            case 'hideout':
                this.showHideoutPanel();
                break;
            case 'flee':
                this.showFleePanel();
                break;
        }
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyboard(event) {
        // Only handle if UI Manager has focus (not in input fields)
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handleFireClick();
                break;
            case 'Digit1':
                this.handleRangeChange('factory');
                break;
            case 'Digit2':
                this.handleRangeChange('woods');
                break;
            case 'Digit3':
                this.handleRangeChange('customs');
                break;
        }
    }
    
    /**
     * Update player stats display
     */
    updatePlayerStats(stats) {
        // Cache previous values to avoid unnecessary DOM updates
        if (!this.lastStats) this.lastStats = {};
        
        // Money
        const moneyElement = this.elements.get('player-money');
        if (moneyElement && stats.money !== this.lastStats.money) {
            const formatted = MathUtils.formatCurrency(stats.money);
            moneyElement.textContent = formatted;
            this.animateStatChange(moneyElement, 'money');
            this.lastStats.money = stats.money;
        }
        
        // XP
        const xpElement = this.elements.get('player-xp');
        if (xpElement && stats.xp !== this.lastStats.xp) {
            xpElement.textContent = MathUtils.formatNumber(stats.xp);
            this.lastStats.xp = stats.xp;
        }
        
        // Level indicator (efficiency can show level progress)
        const efficiencyElement = this.elements.get('player-efficiency');
        if (efficiencyElement && stats.level && (stats.level !== this.lastStats.level || stats.xp !== this.lastStats.xp)) {
            const currentLevelXP = MathUtils.calculateXPForLevel(stats.level - 1);
            const nextLevelXP = MathUtils.calculateXPForLevel(stats.level);
            const progress = ((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            efficiencyElement.textContent = `${Math.min(progress, 100).toFixed(0)}%`;
            this.lastStats.level = stats.level;
        }
        
        // Update shooting stats
        this.updateShootingStats(stats);
    }
    
    /**
     * Update shooting statistics
     */
    updateShootingStats(stats) {
        const shotsFiredElement = this.elements.get('shots-fired');
        const shotsHitElement = this.elements.get('shots-hit');
        const accuracyElement = this.elements.get('accuracy-percent');
        const headshotsElement = this.elements.get('headshots');
        
        if (shotsFiredElement) {
            shotsFiredElement.textContent = stats.shotsFired || 0;
        }
        
        if (shotsHitElement) {
            shotsHitElement.textContent = stats.shotsHit || 0;
        }
        
        if (accuracyElement) {
            const accuracy = stats.shotsFired > 0 
                ? ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1)
                : 0;
            accuracyElement.textContent = `${accuracy}%`;
        }
        
        if (headshotsElement) {
            headshotsElement.textContent = stats.headshotCount || 0;
        }
    }
    
    /**
     * Update weapon display
     */
    updateWeaponDisplay(weapon) {
        if (!weapon) return;
        
        // Weapon name
        const nameElement = this.elements.get('weapon-name');
        if (nameElement) {
            nameElement.textContent = weapon.name;
        }
        
        // Weapon condition
        const conditionElement = this.elements.get('weapon-condition');
        if (conditionElement) {
            const condition = this.getWeaponCondition(weapon);
            conditionElement.textContent = condition.text;
            conditionElement.className = `weapon-condition ${condition.class}`;
        }
        
        // Weapon display
        const weaponElement = this.elements.get('current-weapon');
        if (weaponElement) {
            const placeholder = weaponElement.querySelector('.weapon-placeholder');
            if (placeholder) {
                const icon = weapon.icon || '🔫';
                placeholder.textContent = `${icon} ${weapon.name}`;
            }
        }
        
        // Update weapon stats bars
        this.updateWeaponStats(weapon);
    }
    
    /**
     * Update weapon stats bars
     */
    updateWeaponStats(weapon) {
        const statBars = this.elements.get('stat-bars');
        if (!statBars) return;
        
        const stats = [
            { name: 'damage', value: weapon.stats.damage, max: 200 },
            { name: 'accuracy', value: weapon.stats.accuracy, max: 100 },
            { name: 'rateOfFire', value: weapon.stats.rateOfFire, max: 1000 },
            { name: 'penetration', value: weapon.stats.penetration, max: 20 }
        ];
        
        statBars.forEach((bar, index) => {
            if (stats[index]) {
                const percentage = Math.min((stats[index].value / stats[index].max) * 100, 100);
                bar.style.width = `${percentage}%`;
                
                // Update stat number
                const numberElement = bar.parentElement.querySelector('.stat-number');
                if (numberElement) {
                    if (stats[index].name === 'rateOfFire') {
                        numberElement.textContent = `${stats[index].value} RPM`;
                    } else if (stats[index].name === 'accuracy') {
                        numberElement.textContent = `${stats[index].value}%`;
                    } else if (stats[index].name === 'penetration') {
                        numberElement.textContent = `CLASS ${stats[index].value}`;
                    } else {
                        numberElement.textContent = stats[index].value;
                    }
                }
            }
        });
    }
    
    /**
     * Get weapon condition based on level/upgrades
     */
    getWeaponCondition(weapon) {
        const level = weapon.level || 1;
        
        if (level >= 30) return { text: 'LEGENDARY', class: 'legendary' };
        if (level >= 20) return { text: 'MILITARY', class: 'military' };
        if (level >= 15) return { text: 'TACTICAL', class: 'tactical' };
        if (level >= 10) return { text: 'COMBAT-READY', class: 'combat' };
        if (level >= 5) return { text: 'BATTLE-TESTED', class: 'battle' };
        
        return { text: 'FACTORY-NEW', class: 'factory' };
    }
    
    /**
     * Show damage number animation
     */
    showDamageNumber(data) {
        const container = this.elements.get('damage-numbers');
        if (!container) return;
        
        const damageElement = document.createElement('div');
        damageElement.className = `damage-number ${data.hitType}`;
        damageElement.textContent = `+${data.damage}`;
        
        // Position based on target coordinates or random
        const x = data.targetX || MathUtils.random(20, 80);
        const y = data.targetY || MathUtils.random(20, 80);
        
        damageElement.style.left = `${x}%`;
        damageElement.style.top = `${y}%`;
        
        container.appendChild(damageElement);
        
        // Remove after animation
        setTimeout(() => {
            if (damageElement.parentNode) {
                damageElement.parentNode.removeChild(damageElement);
            }
        }, 1500);
        
        // Add money popup if significant
        if (data.moneyReward > 100) {
            this.showMoneyPopup(data.moneyReward, x, y);
        }
    }
    
    /**
     * Show money popup
     */
    showMoneyPopup(amount, x, y) {
        const container = this.elements.get('damage-numbers');
        if (!container) return;
        
        const moneyElement = document.createElement('div');
        moneyElement.className = 'money-popup';
        moneyElement.textContent = MathUtils.formatCurrency(amount);
        moneyElement.style.left = `${x + 10}%`;
        moneyElement.style.top = `${y + 10}%`;
        
        container.appendChild(moneyElement);
        
        setTimeout(() => {
            if (moneyElement.parentNode) {
                moneyElement.parentNode.removeChild(moneyElement);
            }
        }, 2000);
    }
    
    /**
     * Show critical hit effect
     */
    showCriticalEffect(data) {
        // Screen flash effect
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('critical-flash');
            setTimeout(() => {
                gameContainer.classList.remove('critical-flash');
            }, 200);
        }
        
        // Screen shake
        this.addScreenShake();
    }
    
    /**
     * Add screen shake effect
     */
    addScreenShake() {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('animate-shake');
            setTimeout(() => {
                gameContainer.classList.remove('animate-shake');
            }, 500);
        }
    }
    
    /**
     * Play fire animation
     */
    playFireAnimation() {
        const weaponElement = this.elements.get('current-weapon');
        if (weaponElement) {
            weaponElement.classList.add('animate-weapon-recoil');
            setTimeout(() => {
                weaponElement.classList.remove('animate-weapon-recoil');
            }, 200);
        }
        
        // Muzzle flash
        this.showMuzzleFlash();
    }
    
    /**
     * Show muzzle flash effect
     */
    showMuzzleFlash() {
        const weaponViewport = document.querySelector('.weapon-viewport');
        if (!weaponViewport) return;
        
        const muzzleFlash = weaponViewport.querySelector('.muzzle-flash');
        if (muzzleFlash) {
            muzzleFlash.classList.add('active');
            setTimeout(() => {
                muzzleFlash.classList.remove('active');
            }, 100);
        }
    }
    
    /**
     * Play target hit animation
     */
    playTargetHitAnimation(targetElement) {
        targetElement.classList.add('animate-target-hit');
        setTimeout(() => {
            targetElement.classList.remove('animate-target-hit');
        }, 300);
    }
    
    /**
     * Add button press effect
     */
    addButtonPressEffect(button) {
        button.classList.add('animate-button-press');
        setTimeout(() => {
            button.classList.remove('animate-button-press');
        }, 150);
    }
    
    /**
     * Animate stat change
     */
    animateStatChange(element, type) {
        const animationClass = type === 'money' ? 'animate-money-count' : 'animate-stat-increase';
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 400);
    }
    
    /**
     * Set active range
     */
    setActiveRange(rangeName) {
        this.elements.get('range-buttons')?.forEach(button => {
            if (button.dataset.range === rangeName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * Set active navigation
     */
    setActiveNavigation(section) {
        this.elements.get('nav-buttons')?.forEach(button => {
            if (button.dataset.section === section) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * Show panels (placeholder implementations)
     */
    showModifyPanel() {
        console.log('🔧 Modify panel (coming soon)');
    }
    
    showUpgradePanel() {
        console.log('💎 Upgrade panel (coming soon)');
    }
    
    showStashPanel() {
        console.log('🎒 Stash panel (coming soon)');
    }
    
    showTraderPanel() {
        console.log('🤝 Trader panel (coming soon)');
    }
    
    showHideoutPanel() {
        console.log('🏠 Hideout panel (coming soon)');
    }
    
    showFleePanel() {
        console.log('🏃 Flee panel (coming soon)');
    }
    
    /**
     * Toggle upgrade panel
     */
    toggleUpgradePanel() {
        this.showUpgradePanel();
    }
    
    /**
     * Handle resize
     */
    handleResize() {
        // Responsive adjustments
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            const width = window.innerWidth;
            
            if (width <= 768) {
                gameContainer.classList.add('mobile');
            } else {
                gameContainer.classList.remove('mobile');
            }
        }
    }
    
    /**
     * Reduce effects for performance
     */
    reduceEffects(severity) {
        if (severity > 0.7) {
            // Disable particle effects
            document.querySelectorAll('.damage-number').forEach(el => {
                el.style.animation = 'none';
            });
        }
    }
    
    /**
     * Load initial data
     */
    async loadInitialData() {
        // Initialize UI with default data
        return true;
    }
    
    /**
     * Update UI manager
     */
    update(deltaTime) {
        // Update any time-based UI animations less frequently
        if (this.frameCount === undefined) this.frameCount = 0;
        this.frameCount++;
        
        if (this.frameCount % 10 === 0) { // Every ~6 frames
            this.updateDamageNumbers(deltaTime);
        }
    }
    
    /**
     * Update damage numbers
     */
    updateDamageNumbers(deltaTime) {
        // Clean up old damage numbers that might have stuck around
        const container = this.elements.get('damage-numbers');
        if (container) {
            const numbers = container.querySelectorAll('.damage-number');
            numbers.forEach(number => {
                const age = Date.now() - (number.dataset.created || Date.now());
                if (age > 2000) {
                    number.remove();
                }
            });
        }
    }
    
    /**
     * Update game state
     */
    updateGameState(state) {
        // Update UI based on game state changes
        if (state.isPaused) {
            document.body.classList.add('game-paused');
        } else {
            document.body.classList.remove('game-paused');
        }
    }
}

export default UIManager;
