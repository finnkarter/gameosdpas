/**
 * Main Game Entry Point
 * Escape From Training - PMC Gun Evolution Simulator
 */

import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { SaveSystem } from './systems/SaveSystem.js';
import { AudioManager } from './systems/AudioManager.js';
import { NotificationSystem } from './ui/NotificationSystem.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';

/**
 * Game Application Class
 * Manages the entire game lifecycle and system coordination
 */
class GameApplication {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
        this.weaponSystem = null;
        this.saveSystem = null;
        this.audioManager = null;
        this.notificationSystem = null;
        this.performanceMonitor = null;
        
        this.isInitialized = false;
        this.isLoading = true;
        this.deltaTime = 0;
        this.lastFrameTime = 0;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleKeyboard = this.handleKeyboard.bind(this);
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * Initialize the game application
     */
    async initialize() {
        try {
            console.log('🎖️ Initializing Escape From Training...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize performance monitoring
            this.performanceMonitor = new PerformanceMonitor();
            this.performanceMonitor.start();
            
            // Initialize core systems
            await this.initializeSystems();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load game data
            await this.loadGameData();
            
            // Hide loading screen and show game
            await this.hideLoadingScreen();
            
            // Start game loop
            this.startGameLoop();
            
            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('✅ Game initialized successfully!');
            
            // Show welcome notification
            this.notificationSystem.show({
                type: 'success',
                title: 'Welcome PMC-047',
                message: 'Training facility is online. Begin weapon evolution.',
                duration: 5000
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showErrorScreen(error);
        }
    }
    
    /**
     * Initialize all game systems
     */
    async initializeSystems() {
        // Initialize save system first
        this.saveSystem = new SaveSystem();
        await this.saveSystem.initialize();
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        await this.audioManager.initialize();
        
        // Initialize notification system
        this.notificationSystem = new NotificationSystem();
        
        // Initialize weapon system
        this.weaponSystem = new WeaponSystem();
        await this.weaponSystem.initialize();
        
        // Initialize UI manager
        this.uiManager = new UIManager();
        await this.uiManager.initialize();
        
        // Initialize game engine
        this.gameEngine = new GameEngine({
            weaponSystem: this.weaponSystem,
            saveSystem: this.saveSystem,
            audioManager: this.audioManager,
            notificationSystem: this.notificationSystem,
            uiManager: this.uiManager
        });
        
        await this.gameEngine.initialize();
        
        // Connect systems
        this.connectSystems();
    }
    
    /**
     * Connect systems together
     */
    connectSystems() {
        // Connect UI to game engine
        this.uiManager.setGameEngine(this.gameEngine);
        
        // Connect weapon system events with error handling
        this.weaponSystem.on('weaponFired', (data) => {
            try {
                if (this.gameEngine && typeof this.gameEngine.handleWeaponFired === 'function') {
                    this.gameEngine.handleWeaponFired(data);
                }
                if (this.audioManager && typeof this.audioManager.playSound === 'function' && data?.weapon?.audioSettings) {
                    this.audioManager.playSound('gunshot', data.weapon.audioSettings);
                }
            } catch (error) {
                console.warn('Error handling weaponFired event:', error);
            }
        });
        
        this.weaponSystem.on('weaponUpgraded', (data) => {
            try {
                if (this.gameEngine && typeof this.gameEngine.handleWeaponUpgraded === 'function') {
                    this.gameEngine.handleWeaponUpgraded(data);
                }
                if (this.notificationSystem && data?.weapon?.name) {
                    this.notificationSystem.show({
                        type: 'success',
                        title: 'Weapon Upgraded',
                        message: `${data.weapon.name} upgraded to level ${data.newLevel || 'Unknown'}`,
                        duration: 3000
                    });
                }
            } catch (error) {
                console.warn('Error handling weaponUpgraded event:', error);
            }
        });
        
        this.weaponSystem.on('weaponEvolved', (data) => {
            this.gameEngine.handleWeaponEvolved(data);
            this.notificationSystem.show({
                type: 'achievement',
                title: 'Weapon Evolution!',
                message: `Unlocked ${data.newWeapon.name}`,
                duration: 5000
            });
            this.audioManager.playSound('weaponEvolution');
        });
        
        // Connect game engine events
        this.gameEngine.on('playerStatsChanged', (stats) => {
            this.uiManager.updatePlayerStats(stats);
        });
        
        this.gameEngine.on('gameStateChanged', (state) => {
            this.uiManager.updateGameState(state);
            this.saveSystem.saveGameState(state);
        });
        
        this.gameEngine.on('targetHit', (data) => {
            this.uiManager.showDamageNumber(data);
            this.audioManager.playSound('targetHit');
        });
        
        this.gameEngine.on('criticalHit', (data) => {
            this.uiManager.showCriticalEffect(data);
            this.audioManager.playSound('criticalHit');
        });
        
        // Connect performance monitoring
        this.performanceMonitor.on('performanceWarning', (data) => {
            console.warn('Performance warning:', data);
            // Optionally reduce visual effects
            this.uiManager.reduceEffects(data.severity);
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyboard);
        
        // Mobile touch events
        if ('ontouchstart' in window) {
            this.setupTouchEvents();
        }
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle before unload (save game)
        window.addEventListener('beforeunload', () => {
            if (this.gameEngine) {
                this.saveSystem.saveGameState(this.gameEngine.getGameState());
            }
        });
    }
    
    /**
     * Setup touch events for mobile
     */
    setupTouchEvents() {
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
        });
        
        document.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Treat as click if touch is short
            if (touchDuration < 200) {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (target && target.closest('.shooting-range')) {
                    this.gameEngine.handleFire(touch.clientX, touch.clientY);
                }
            }
        });
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    /**
     * Load game data
     */
    async loadGameData() {
        try {
            // Update loading status
            this.updateLoadingStatus('Loading player data...');
            await this.sleep(100);
            
            // Load saved game state
            const savedState = await this.saveSystem.loadGameState();
            if (savedState) {
                this.gameEngine.loadGameState(savedState);
            }
            
            this.updateLoadingStatus('Loading weapon database...');
            await this.sleep(100);
            
            // Load weapon data
            await this.weaponSystem.loadWeaponData();
            
            this.updateLoadingStatus('Initializing combat systems...');
            await this.sleep(100);
            
            // Initialize UI with loaded data
            await this.uiManager.loadInitialData();
            
            this.updateLoadingStatus('Preparing training facility...');
            await this.sleep(100);
            
        } catch (error) {
            console.error('Failed to load game data:', error);
            throw error;
        }
    }
    
    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        if (gameContainer) gameContainer.classList.add('hidden');
        
        // Animate loading progress
        this.animateLoadingProgress();
    }
    
    /**
     * Hide loading screen
     */
    async hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 1s ease-out';
            loadingScreen.style.opacity = '0';
            
            await this.sleep(1000);
            loadingScreen.classList.add('hidden');
        }
        
        if (gameContainer) {
            gameContainer.classList.remove('hidden');
            gameContainer.style.animation = 'fadeIn 1s ease-out';
        }
    }
    
    /**
     * Animate loading progress
     */
    animateLoadingProgress() {
        const progressBar = document.querySelector('.loading-progress');
        if (!progressBar) return;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }
    
    /**
     * Update loading status text
     */
    updateLoadingStatus(status) {
        const statusElement = document.querySelector('.loading-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Show error screen
     */
    showErrorScreen(error) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="military-logo">⚠️ ERROR ⚠️</div>
                    <div class="loading-text">SYSTEM FAILURE DETECTED</div>
                    <div class="loading-status">${error.message || 'Unknown error occurred'}</div>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px; padding: 10px 20px; background: #d4af37; color: #1a1a1a; border: none; border-radius: 4px; cursor: pointer;">
                        RESTART TRAINING
                    </button>
                    <details style="margin-top: 20px; color: #666;">
                        <summary>Error Details</summary>
                        <pre style="margin-top: 10px; font-size: 12px;">${error.stack || error.toString()}</pre>
                    </details>
                </div>
            `;
        }
    }
    
    /**
     * Start the main game loop
     */
    startGameLoop() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
        
        // Cap delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 1/30);
        
        // Target 60 FPS - skip frame if too fast
        if (this.deltaTime < 1/60) {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        
        this.lastFrameTime = currentTime;
        
        try {
            // Update performance monitor
            this.performanceMonitor.update(this.deltaTime);
            
            // Update game engine
            if (this.gameEngine && !this.isLoading) {
                this.gameEngine.update(this.deltaTime);
            }
            
            // Update UI manager
            if (this.uiManager) {
                this.uiManager.update(this.deltaTime);
            }
            
            // Update audio manager
            if (this.audioManager) {
                this.audioManager.update(this.deltaTime);
            }
            
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        // Continue the loop
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Handle visibility change (tab focus/blur)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Game paused
            if (this.gameEngine) {
                this.gameEngine.pause();
            }
            if (this.audioManager) {
                this.audioManager.pauseAll();
            }
        } else {
            // Game resumed
            if (this.gameEngine) {
                this.gameEngine.resume();
            }
            if (this.audioManager) {
                this.audioManager.resumeAll();
            }
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (this.uiManager) {
            this.uiManager.handleResize();
        }
    }
    
    /**
     * Handle keyboard input
     */
    handleKeyboard(event) {
        if (!this.gameEngine || this.isLoading) return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.gameEngine.handleFire();
                break;
                
            case 'KeyR':
                event.preventDefault();
                this.gameEngine.handleReload();
                break;
                
            case 'KeyU':
                event.preventDefault();
                this.uiManager.toggleUpgradePanel();
                break;
                
            case 'KeyM':
                event.preventDefault();
                this.audioManager.toggleMute();
                break;
                
            case 'KeyP':
                event.preventDefault();
                this.gameEngine.togglePause();
                break;
                
            case 'F11':
                this.toggleFullscreen();
                break;
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Could not enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Update game time display
     */
    updateGameTime() {
        const timeElement = document.getElementById('game-time');
        if (timeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            timeElement.textContent = timeString;
        }
    }
    
    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get game instance (for debugging)
     */
    getGameInstance() {
        return {
            engine: this.gameEngine,
            ui: this.uiManager,
            weapons: this.weaponSystem,
            save: this.saveSystem,
            audio: this.audioManager,
            notifications: this.notificationSystem,
            performance: this.performanceMonitor
        };
    }
}

// Initialize the game
const game = new GameApplication();

// Export for debugging
window.game = game;

// Update time every second
setInterval(() => {
    if (game.uiManager) {
        game.updateGameTime();
    }
}, 1000);

console.log('🎖️ Escape From Training - PMC Gun Evolution Simulator');
console.log('📝 Use window.game to access game instance for debugging');
console.log('⌨️  Controls: SPACE (Fire), R (Reload), U (Upgrades), M (Mute), P (Pause)');

export default game;
