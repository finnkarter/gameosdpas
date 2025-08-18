/**
 * Math Utilities
 * Common mathematical functions for game calculations
 */

export class MathUtils {
    /**
     * Clamp value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    /**
     * Linear interpolation
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    /**
     * Map value from one range to another
     */
    static map(value, fromMin, fromMax, toMin, toMax) {
        const t = (value - fromMin) / (fromMax - fromMin);
        return this.lerp(toMin, toMax, t);
    }
    
    /**
     * Random number between min and max (inclusive)
     */
    static random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * Random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Random element from array
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * Weighted random choice
     */
    static weightedRandom(choices) {
        const totalWeight = choices.reduce((sum, choice) => sum + choice.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const choice of choices) {
            random -= choice.weight;
            if (random <= 0) {
                return choice.value;
            }
        }
        
        return choices[choices.length - 1].value;
    }
    
    /**
     * Distance between two points
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Angle between two points (in radians)
     */
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    /**
     * Convert degrees to radians
     */
    static degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     */
    static radToDeg(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Normalize angle to 0-2π range
     */
    static normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }
    
    /**
     * Round to specified decimal places
     */
    static round(value, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    
    /**
     * Check if number is in range
     */
    static inRange(value, min, max) {
        return value >= min && value <= max;
    }
    
    /**
     * Exponential growth formula for upgrades
     */
    static exponentialGrowth(base, level, multiplier = 1.15) {
        return Math.floor(base * Math.pow(multiplier, level));
    }
    
    /**
     * Sigmoid function for smooth transitions
     */
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    /**
     * Ease in/out functions
     */
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeIn(t) {
        return t * t;
    }
    
    static easeOut(t) {
        return t * (2 - t);
    }
    
    /**
     * Check if two rectangles overlap
     */
    static rectangleOverlap(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    /**
     * Check if point is inside rectangle
     */
    static pointInRectangle(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    /**
     * Check if point is inside circle
     */
    static pointInCircle(x, y, centerX, centerY, radius) {
        return this.distance(x, y, centerX, centerY) <= radius;
    }
    
    /**
     * Generate UUID v4
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Format large numbers (1000 -> 1K, 1000000 -> 1M)
     */
    static formatNumber(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
        return (num / 1000000000000).toFixed(1) + 'T';
    }
    
    /**
     * Format currency (roubles)
     */
    static formatCurrency(amount) {
        return '₽' + this.formatNumber(amount);
    }
    
    /**
     * Format time duration
     */
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    /**
     * Calculate DPS (Damage Per Second)
     */
    static calculateDPS(damage, rateOfFire, accuracy = 1.0) {
        const firesPerSecond = rateOfFire / 60; // Convert RPM to RPS
        return damage * firesPerSecond * accuracy;
    }
    
    /**
     * Calculate upgrade cost with exponential scaling
     */
    static calculateUpgradeCost(baseCost, currentLevel, scalingFactor = 1.15) {
        return Math.floor(baseCost * Math.pow(scalingFactor, currentLevel));
    }
    
    /**
     * Calculate XP required for level
     */
    static calculateXPForLevel(level) {
        return Math.floor(Math.pow(level, 2) * 100);
    }
    
    /**
     * Calculate level from XP
     */
    static calculateLevelFromXP(xp) {
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
    
    /**
     * Smooth step function
     */
    static smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
    
    /**
     * Generate normal distribution random number
     */
    static normalRandom(mean = 0, stdDev = 1) {
        const u = 0.5 - Math.random();
        const v = 0.5 - Math.random();
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }
    
    /**
     * Check if value is power of 2
     */
    static isPowerOfTwo(value) {
        return (value & (value - 1)) === 0;
    }
    
    /**
     * Next power of 2
     */
    static nextPowerOfTwo(value) {
        return Math.pow(2, Math.ceil(Math.log2(value)));
    }
}

export default MathUtils;
