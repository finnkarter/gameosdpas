/**
 * Performance Monitor
 * Tracks game performance and provides optimization suggestions
 */

import { EventEmitter } from './EventEmitter.js';

export class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memoryUsage: 0,
            drawCalls: 0,
            updateTime: 0,
            renderTime: 0
        };
        
        this.history = {
            fps: [],
            frameTime: [],
            memoryUsage: []
        };
        
        this.settings = {
            targetFPS: 60,
            maxHistoryLength: 120, // 2 seconds at 60fps - reduced for performance
            warningThresholds: {
                lowFPS: 20, // More lenient
                highFrameTime: 50, // More lenient - 20fps threshold
                highMemoryUsage: 150 // More lenient
            }
        };
        
        this.startTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = 0;
        
        this.isRunning = false;
        this.performanceObserver = null;
    }
    
    /**
     * Start performance monitoring
     */
    start() {
        console.log('📊 Starting Performance Monitor...');
        
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        this.lastFpsUpdate = this.startTime;
        this.isRunning = true;
        
        // Setup performance observer if available
        this.setupPerformanceObserver();
        
        // Setup memory monitoring
        this.setupMemoryMonitoring();
        
        console.log('✅ Performance Monitor started');
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        this.isRunning = false;
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        console.log('📊 Performance Monitor stopped');
    }
    
    /**
     * Update performance metrics
     */
    update(deltaTime) {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.frameCount++;
        
        // Calculate frame time
        const frameTime = currentTime - this.lastFrameTime;
        this.metrics.frameTime = frameTime;
        this.lastFrameTime = currentTime;
        
        // Update FPS calculation
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.calculateFPS(currentTime);
            this.lastFpsUpdate = currentTime;
        }
        
        // Update history
        this.updateHistory();
        
        // Check for performance issues much less frequently
        if (this.frameCount % 300 === 0) { // Only check every 5 seconds
            this.checkPerformanceWarnings();
        }
        
        // Update memory usage periodically
        if (this.frameCount % 60 === 0) { // Every second at 60fps
            this.updateMemoryUsage();
        }
    }
    
    /**
     * Calculate FPS
     */
    calculateFPS(currentTime) {
        const elapsed = currentTime - this.lastFpsUpdate;
        const framesSinceLastUpdate = this.frameCount;
        
        this.metrics.fps = Math.round((framesSinceLastUpdate * 1000) / elapsed);
        this.frameCount = 0;
    }
    
    /**
     * Update performance history
     */
    updateHistory() {
        // Add current metrics to history
        this.history.fps.push(this.metrics.fps);
        this.history.frameTime.push(this.metrics.frameTime);
        this.history.memoryUsage.push(this.metrics.memoryUsage);
        
        // Trim history to max length
        Object.keys(this.history).forEach(key => {
            if (this.history[key].length > this.settings.maxHistoryLength) {
                this.history[key].shift();
            }
        });
    }
    
    /**
     * Check for performance warnings
     */
    checkPerformanceWarnings() {
        const warnings = [];
        
        // Low FPS warning
        if (this.metrics.fps > 0 && this.metrics.fps < this.settings.warningThresholds.lowFPS) {
            warnings.push({
                type: 'low_fps',
                severity: this.calculateSeverity(this.metrics.fps, this.settings.warningThresholds.lowFPS, 0),
                message: `Low FPS detected: ${this.metrics.fps} (target: ${this.settings.targetFPS})`,
                value: this.metrics.fps
            });
        }
        
        // High frame time warning
        if (this.metrics.frameTime > this.settings.warningThresholds.highFrameTime) {
            warnings.push({
                type: 'high_frame_time',
                severity: this.calculateSeverity(this.metrics.frameTime, this.settings.warningThresholds.highFrameTime, 100),
                message: `High frame time: ${this.metrics.frameTime.toFixed(2)}ms`,
                value: this.metrics.frameTime
            });
        }
        
        // High memory usage warning
        if (this.metrics.memoryUsage > this.settings.warningThresholds.highMemoryUsage) {
            warnings.push({
                type: 'high_memory',
                severity: this.calculateSeverity(this.metrics.memoryUsage, this.settings.warningThresholds.highMemoryUsage, 500),
                message: `High memory usage: ${this.metrics.memoryUsage.toFixed(1)}MB`,
                value: this.metrics.memoryUsage
            });
        }
        
        // Emit warnings
        warnings.forEach(warning => {
            this.emit('performanceWarning', warning);
        });
    }
    
    /**
     * Calculate warning severity (0-1)
     */
    calculateSeverity(value, threshold, max) {
        if (value <= threshold) return 0;
        return Math.min((value - threshold) / (max - threshold), 1);
    }
    
    /**
     * Setup performance observer for detailed metrics
     */
    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not available');
            return;
        }
        
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    switch (entry.entryType) {
                        case 'measure':
                            if (entry.name === 'game-update') {
                                this.metrics.updateTime = entry.duration;
                            } else if (entry.name === 'game-render') {
                                this.metrics.renderTime = entry.duration;
                            }
                            break;
                            
                        case 'navigation':
                            // Track page load performance
                            break;
                    }
                });
            });
            
            this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
            
        } catch (error) {
            console.warn('Failed to setup PerformanceObserver:', error);
        }
    }
    
    /**
     * Setup memory monitoring
     */
    setupMemoryMonitoring() {
        // Use memory API if available
        if (performance.memory) {
            this.updateMemoryUsage();
        }
    }
    
    /**
     * Update memory usage metrics
     */
    updateMemoryUsage() {
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
        }
    }
    
    /**
     * Start performance measurement
     */
    startMeasurement(name) {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(`${name}-start`);
        }
    }
    
    /**
     * End performance measurement
     */
    endMeasurement(name) {
        if ('performance' in window && 'mark' in performance && 'measure' in performance) {
            try {
                performance.mark(`${name}-end`);
                performance.measure(name, `${name}-start`, `${name}-end`);
            } catch (error) {
                // Ignore measurement errors
            }
        }
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Get performance statistics
     */
    getStatistics() {
        const stats = {};
        
        Object.keys(this.history).forEach(key => {
            const data = this.history[key];
            if (data.length > 0) {
                stats[key] = {
                    current: data[data.length - 1],
                    average: this.calculateAverage(data),
                    min: Math.min(...data),
                    max: Math.max(...data),
                    samples: data.length
                };
            }
        });
        
        return stats;
    }
    
    /**
     * Calculate average of array
     */
    calculateAverage(array) {
        if (array.length === 0) return 0;
        return array.reduce((sum, value) => sum + value, 0) / array.length;
    }
    
    /**
     * Get performance grade (A, B, C, D, F)
     */
    getPerformanceGrade() {
        const stats = this.getStatistics();
        let score = 100;
        
        // FPS score (40% weight)
        if (stats.fps) {
            const fpsScore = Math.min(stats.fps.average / this.settings.targetFPS, 1) * 40;
            score = Math.min(score, fpsScore * 2.5);
        }
        
        // Frame time score (30% weight)
        if (stats.frameTime) {
            const targetFrameTime = 1000 / this.settings.targetFPS;
            const frameTimeScore = Math.max(0, 1 - (stats.frameTime.average - targetFrameTime) / targetFrameTime) * 30;
            score = Math.min(score, frameTimeScore * 3.33);
        }
        
        // Memory score (30% weight)
        if (stats.memoryUsage) {
            const memoryScore = Math.max(0, 1 - stats.memoryUsage.average / 200) * 30;
            score = Math.min(score, memoryScore * 3.33);
        }
        
        // Convert to letter grade
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Get optimization suggestions
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        const stats = this.getStatistics();
        
        // Low FPS suggestions
        if (stats.fps && stats.fps.average < this.settings.warningThresholds.lowFPS) {
            suggestions.push({
                type: 'fps',
                priority: 'high',
                title: 'Improve Frame Rate',
                description: 'Game is running below target FPS',
                actions: [
                    'Reduce visual effects quality',
                    'Lower particle count',
                    'Optimize animation updates',
                    'Use object pooling for frequently created/destroyed objects'
                ]
            });
        }
        
        // High memory usage suggestions
        if (stats.memoryUsage && stats.memoryUsage.average > this.settings.warningThresholds.highMemoryUsage) {
            suggestions.push({
                type: 'memory',
                priority: 'medium',
                title: 'Reduce Memory Usage',
                description: 'Game is using high amounts of memory',
                actions: [
                    'Clear unused game objects',
                    'Optimize texture sizes',
                    'Use memory pooling',
                    'Remove event listeners from destroyed objects'
                ]
            });
        }
        
        // General optimization suggestions
        if (stats.frameTime && stats.frameTime.max > 50) {
            suggestions.push({
                type: 'optimization',
                priority: 'low',
                title: 'Optimize Game Loop',
                description: 'Occasional frame spikes detected',
                actions: [
                    'Spread heavy calculations across multiple frames',
                    'Use requestAnimationFrame for animations',
                    'Minimize DOM manipulations',
                    'Cache frequently accessed elements'
                ]
            });
        }
        
        return suggestions;
    }
    
    /**
     * Generate performance report
     */
    generateReport() {
        const metrics = this.getMetrics();
        const stats = this.getStatistics();
        const grade = this.getPerformanceGrade();
        const suggestions = this.getOptimizationSuggestions();
        
        return {
            timestamp: new Date().toISOString(),
            runtime: performance.now() - this.startTime,
            grade: grade,
            metrics: metrics,
            statistics: stats,
            suggestions: suggestions,
            system: this.getSystemInfo()
        };
    }
    
    /**
     * Get system information
     */
    getSystemInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            connection: 'unknown'
        };
        
        // Get connection info if available
        if (navigator.connection) {
            info.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        
        return info;
    }
    
    /**
     * Export performance data
     */
    exportData() {
        const report = this.generateReport();
        return JSON.stringify(report, null, 2);
    }
    
    /**
     * Reset performance data
     */
    reset() {
        this.history = {
            fps: [],
            frameTime: [],
            memoryUsage: []
        };
        
        this.frameCount = 0;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;
        this.lastFpsUpdate = this.startTime;
    }
    
    /**
     * Set performance target
     */
    setTarget(targetFPS) {
        this.settings.targetFPS = targetFPS;
        console.log(`📊 Performance target set to ${targetFPS} FPS`);
    }
    
    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        if (enabled && !this.isRunning) {
            this.start();
        } else if (!enabled && this.isRunning) {
            this.stop();
        }
    }
}

export default PerformanceMonitor;
