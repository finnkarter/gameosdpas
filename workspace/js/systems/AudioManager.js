/**
 * Audio Manager
 * Handles all audio functionality including sound effects and music
 */

import { EventEmitter } from '../utils/EventEmitter.js';

export class AudioManager extends EventEmitter {
    constructor() {
        super();
        
        this.audioContext = null;
        this.sounds = new Map();
        this.musicTracks = new Map();
        this.currentMusic = null;
        
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.isMuted = false;
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize audio manager
     */
    async initialize() {
        try {
            console.log('🔊 Initializing Audio Manager...');
            
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Create sound effects
            this.createSoundEffects();
            
            // Load settings
            this.loadAudioSettings();
            
            this.isInitialized = true;
            console.log('✅ Audio Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Audio Manager:', error);
            // Don't throw - audio is not critical for gameplay
        }
    }
    
    /**
     * Initialize Web Audio Context
     */
    async initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                this.audioContext = null;
                return;
            }
            
            // Create context but don't start it immediately due to autoplay policy
            this.audioContext = new AudioContext();
            
            // Add user interaction listener to resume context
            this.setupAutoplayHandler();
            
        } catch (error) {
            console.warn('Web Audio Context not available, using fallback:', error);
            this.audioContext = null;
        }
    }
    
    /**
     * Setup autoplay policy handler
     */
    setupAutoplayHandler() {
        if (!this.audioContext) return;
        
        const resumeContext = async () => {
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    console.log('🔊 Audio context resumed');
                } catch (error) {
                    console.warn('Failed to resume audio context:', error);
                }
            }
            
            // Remove listeners after first interaction
            document.removeEventListener('click', resumeContext);
            document.removeEventListener('keydown', resumeContext);
            document.removeEventListener('touchstart', resumeContext);
        };
        
        // Add listeners for user interaction
        document.addEventListener('click', resumeContext);
        document.addEventListener('keydown', resumeContext);
        document.addEventListener('touchstart', resumeContext);
    }
    
    /**
     * Create procedural sound effects
     */
    createSoundEffects() {
        if (!this.audioContext) return;
        
        this.sounds.set('gunshot', this.createGunshotSound.bind(this));
        this.sounds.set('targetHit', this.createTargetHitSound.bind(this));
        this.sounds.set('criticalHit', this.createCriticalHitSound.bind(this));
        this.sounds.set('weaponEvolution', this.createWeaponEvolutionSound.bind(this));
        this.sounds.set('upgrade', this.createUpgradeSound.bind(this));
        this.sounds.set('click', this.createClickSound.bind(this));
        this.sounds.set('notification', this.createNotificationSound.bind(this));
        this.sounds.set('levelUp', this.createLevelUpSound.bind(this));
        this.sounds.set('reload', this.createReloadSound.bind(this));
    }
    
    /**
     * Play sound effect
     */
    playSound(soundName, options = {}) {
        if (!this.isInitialized || this.isMuted || !this.audioContext) return;
        
        const soundGenerator = this.sounds.get(soundName);
        if (!soundGenerator) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }
        
        try {
            soundGenerator(options);
        } catch (error) {
            console.warn(`Failed to play sound ${soundName}:`, error);
        }
    }
    
    /**
     * Create gunshot sound effect
     */
    createGunshotSound(options = {}) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Main gunshot noise
        const noiseBuffer = this.createNoiseBuffer(0.1);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        
        // Filter settings based on weapon type
        const pitch = options.pitch || 1.0;
        const volume = (options.volume || 0.6) * this.sfxVolume * this.masterVolume;
        
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(300 * pitch, now);
        noiseFilter.Q.setValueAtTime(0.5, now);
        
        noiseGain.gain.setValueAtTime(volume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        // Low frequency boom
        const boomOsc = ctx.createOscillator();
        const boomGain = ctx.createGain();
        
        boomOsc.frequency.setValueAtTime(60 / pitch, now);
        boomOsc.frequency.exponentialRampToValueAtTime(20 / pitch, now + 0.05);
        
        boomGain.gain.setValueAtTime(volume * 0.8, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        // Connect and play
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        boomOsc.connect(boomGain);
        boomGain.connect(ctx.destination);
        
        noiseSource.start(now);
        boomOsc.start(now);
        
        noiseSource.stop(now + 0.1);
        boomOsc.stop(now + 0.05);
    }
    
    /**
     * Create target hit sound
     */
    createTargetHitSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gain.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }
    
    /**
     * Create critical hit sound
     */
    createCriticalHitSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Multiple oscillators for richness
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.frequency.setValueAtTime(1200 + i * 200, now);
            osc.frequency.exponentialRampToValueAtTime(400 + i * 100, now + 0.15);
            
            gain.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + i * 0.02);
            osc.stop(now + 0.15 + i * 0.02);
        }
    }
    
    /**
     * Create weapon evolution sound
     */
    createWeaponEvolutionSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Rising arpeggio
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major chord
        
        frequencies.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = index * 0.1;
            
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume * 0.4, now + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.5);
        });
    }
    
    /**
     * Create upgrade sound
     */
    createUpgradeSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        
        gain.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    /**
     * Create click sound
     */
    createClickSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
        
        gain.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    /**
     * Create notification sound
     */
    createNotificationSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Two tone notification
        [600, 800].forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = index * 0.1;
            
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gain.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.3, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.1);
        });
    }
    
    /**
     * Create level up sound
     */
    createLevelUpSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Fanfare-like sound
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = index * 0.15;
            
            osc.frequency.setValueAtTime(freq, now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * this.masterVolume * 0.4, now + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.4);
        });
    }
    
    /**
     * Create reload sound
     */
    createReloadSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Magazine out
        const noise1 = this.createNoiseBuffer(0.1);
        const source1 = ctx.createBufferSource();
        source1.buffer = noise1;
        
        const gain1 = ctx.createGain();
        const filter1 = ctx.createBiquadFilter();
        
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(300, now);
        
        gain1.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        source1.connect(filter1);
        filter1.connect(gain1);
        gain1.connect(ctx.destination);
        
        source1.start(now);
        source1.stop(now + 0.1);
        
        // Magazine in
        const noise2 = this.createNoiseBuffer(0.1);
        const source2 = ctx.createBufferSource();
        source2.buffer = noise2;
        
        const gain2 = ctx.createGain();
        const filter2 = ctx.createBiquadFilter();
        
        filter2.type = 'bandpass';
        filter2.frequency.setValueAtTime(400, now + 0.5);
        
        gain2.gain.setValueAtTime(this.sfxVolume * this.masterVolume * 0.4, now + 0.5);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        source2.connect(filter2);
        filter2.connect(gain2);
        gain2.connect(ctx.destination);
        
        source2.start(now + 0.5);
        source2.stop(now + 0.6);
    }
    
    /**
     * Create noise buffer for sound effects
     */
    createNoiseBuffer(duration) {
        const ctx = this.audioContext;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'master', volume: this.masterVolume });
    }
    
    /**
     * Set SFX volume
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'sfx', volume: this.sfxVolume });
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.emit('volumeChanged', { type: 'music', volume: this.musicVolume });
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveAudioSettings();
        this.emit('muteToggled', this.isMuted);
        
        if (this.currentMusic) {
            this.currentMusic.muted = this.isMuted;
        }
    }
    
    /**
     * Pause all audio
     */
    pauseAll() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
    }
    
    /**
     * Resume all audio
     */
    resumeAll() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.currentMusic && !this.isMuted) {
            this.currentMusic.play().catch(() => {
                // Ignore autoplay policy errors
            });
        }
    }
    
    /**
     * Load audio settings from localStorage
     */
    loadAudioSettings() {
        try {
            const settings = localStorage.getItem('eft_audio_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.masterVolume = parsed.masterVolume ?? 0.7;
                this.sfxVolume = parsed.sfxVolume ?? 0.8;
                this.musicVolume = parsed.musicVolume ?? 0.5;
                this.isMuted = parsed.isMuted ?? false;
            }
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }
    
    /**
     * Save audio settings to localStorage
     */
    saveAudioSettings() {
        try {
            const settings = {
                masterVolume: this.masterVolume,
                sfxVolume: this.sfxVolume,
                musicVolume: this.musicVolume,
                isMuted: this.isMuted
            };
            localStorage.setItem('eft_audio_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save audio settings:', error);
        }
    }
    
    /**
     * Update audio manager
     */
    update(deltaTime) {
        // Update any time-based audio effects
        this.emit('audioUpdate', { deltaTime });
    }
    
    /**
     * Get audio settings
     */
    getSettings() {
        return {
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            isMuted: this.isMuted
        };
    }
}

export default AudioManager;
