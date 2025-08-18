/**
 * Notification System
 * Handles in-game notifications, achievements, and alerts
 */

import { EventEmitter } from '../utils/EventEmitter.js';

export class NotificationSystem extends EventEmitter {
    constructor() {
        super();
        
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        
        this.isInitialized = false;
        this.notificationId = 0;
    }
    
    /**
     * Initialize notification system
     */
    initialize() {
        console.log('🔔 Initializing Notification System...');
        
        this.createContainer();
        this.isInitialized = true;
        
        console.log('✅ Notification System initialized');
    }
    
    /**
     * Create notification container
     */
    createContainer() {
        // Remove existing container if any
        const existing = document.getElementById('notification-container');
        if (existing) {
            existing.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        
        // Position in top-right corner
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
            max-width: 400px;
            width: 100%;
        `;
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Show notification
     */
    show(options) {
        if (!this.isInitialized) {
            this.initialize();
        }
        
        const notification = {
            id: ++this.notificationId,
            type: options.type || 'info',
            title: options.title || '',
            message: options.message || '',
            duration: options.duration || this.defaultDuration,
            icon: options.icon || this.getDefaultIcon(options.type),
            actions: options.actions || [],
            timestamp: Date.now()
        };
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Create DOM element
        const element = this.createNotificationElement(notification);
        
        // Add to container
        this.container.appendChild(element);
        
        // Animate in
        setTimeout(() => {
            element.classList.add('show');
        }, 10);
        
        // Auto-remove after duration
        if (notification.duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, notification.duration);
        }
        
        // Remove oldest if too many
        this.cleanupOldNotifications();
        
        // Emit event
        this.emit('notificationShown', notification);
        
        return notification.id;
    }
    
    /**
     * Create notification DOM element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        
        element.style.cssText = `
            background: linear-gradient(135deg, var(--secondary-bg) 0%, var(--tertiary-bg) 100%);
            border: 2px solid var(--border-accent);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-sm);
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            transition: all 0.3s ease-out;
            pointer-events: auto;
            opacity: 0;
            max-width: 100%;
            overflow: hidden;
        `;
        
        // Add type-specific styling
        this.applyTypeSpecificStyling(element, notification.type);
        
        // Create content
        const content = this.createNotificationContent(notification);
        element.appendChild(content);
        
        // Add close button
        const closeButton = this.createCloseButton(notification.id);
        element.appendChild(closeButton);
        
        // Add event listeners
        this.addNotificationEventListeners(element, notification);
        
        return element;
    }
    
    /**
     * Create notification content
     */
    createNotificationContent(notification) {
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-md);
        `;
        
        // Icon
        if (notification.icon) {
            const icon = document.createElement('div');
            icon.className = 'notification-icon';
            icon.style.cssText = `
                font-size: 1.5rem;
                flex-shrink: 0;
                margin-top: 2px;
            `;
            icon.textContent = notification.icon;
            content.appendChild(icon);
        }
        
        // Text content
        const textContent = document.createElement('div');
        textContent.className = 'notification-text';
        textContent.style.cssText = `
            flex: 1;
            min-width: 0;
        `;
        
        // Title
        if (notification.title) {
            const title = document.createElement('div');
            title.className = 'notification-title';
            title.style.cssText = `
                font-family: var(--font-title);
                font-weight: 700;
                font-size: 1rem;
                color: var(--text-primary);
                margin-bottom: var(--spacing-xs);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            title.textContent = notification.title;
            textContent.appendChild(title);
        }
        
        // Message
        if (notification.message) {
            const message = document.createElement('div');
            message.className = 'notification-message';
            message.style.cssText = `
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.4;
                word-wrap: break-word;
            `;
            message.textContent = notification.message;
            textContent.appendChild(message);
        }
        
        // Actions
        if (notification.actions.length > 0) {
            const actions = this.createNotificationActions(notification);
            textContent.appendChild(actions);
        }
        
        content.appendChild(textContent);
        
        return content;
    }
    
    /**
     * Create notification actions
     */
    createNotificationActions(notification) {
        const actions = document.createElement('div');
        actions.className = 'notification-actions';
        actions.style.cssText = `
            display: flex;
            gap: var(--spacing-sm);
            margin-top: var(--spacing-md);
        `;
        
        notification.actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'notification-action';
            button.style.cssText = `
                padding: var(--spacing-xs) var(--spacing-sm);
                background: var(--accent-color);
                color: var(--primary-bg);
                border: none;
                border-radius: var(--border-radius);
                font-family: var(--font-mono);
                font-size: 0.8rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
                transition: all var(--transition-fast);
            `;
            
            button.textContent = action.text;
            button.addEventListener('click', () => {
                if (action.callback) {
                    action.callback();
                }
                this.remove(notification.id);
            });
            
            button.addEventListener('mouseenter', () => {
                button.style.background = '#ffd700';
                button.style.transform = 'translateY(-1px)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'var(--accent-color)';
                button.style.transform = 'translateY(0)';
            });
            
            actions.appendChild(button);
        });
        
        return actions;
    }
    
    /**
     * Create close button
     */
    createCloseButton(notificationId) {
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.style.cssText = `
            position: absolute;
            top: var(--spacing-sm);
            right: var(--spacing-sm);
            width: 24px;
            height: 24px;
            background: var(--danger-color);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-fast);
        `;
        
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => this.remove(notificationId));
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#d32f2f';
            closeButton.style.transform = 'scale(1.1)';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'var(--danger-color)';
            closeButton.style.transform = 'scale(1)';
        });
        
        return closeButton;
    }
    
    /**
     * Apply type-specific styling
     */
    applyTypeSpecificStyling(element, type) {
        const styles = {
            success: {
                borderColor: 'var(--success-color)',
                boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)'
            },
            error: {
                borderColor: 'var(--danger-color)',
                boxShadow: '0 0 20px rgba(244, 67, 54, 0.3)'
            },
            warning: {
                borderColor: 'var(--warning-color)',
                boxShadow: '0 0 20px rgba(255, 152, 0, 0.3)'
            },
            info: {
                borderColor: 'var(--info-color)',
                boxShadow: '0 0 20px rgba(33, 150, 243, 0.3)'
            },
            achievement: {
                borderColor: 'var(--accent-color)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, var(--tertiary-bg) 100%)'
            }
        };
        
        const style = styles[type] || styles.info;
        Object.assign(element.style, style);
    }
    
    /**
     * Add event listeners to notification
     */
    addNotificationEventListeners(element, notification) {
        // Pause auto-removal on hover
        element.addEventListener('mouseenter', () => {
            element.dataset.paused = 'true';
        });
        
        element.addEventListener('mouseleave', () => {
            delete element.dataset.paused;
        });
        
        // Click to dismiss (unless it has actions)
        if (notification.actions.length === 0) {
            element.addEventListener('click', () => {
                this.remove(notification.id);
            });
            element.style.cursor = 'pointer';
        }
    }
    
    /**
     * Get default icon for notification type
     */
    getDefaultIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            achievement: '🏆'
        };
        
        return icons[type] || icons.info;
    }
    
    /**
     * Remove notification
     */
    remove(notificationId) {
        const element = this.container?.querySelector(`[data-id="${notificationId}"]`);
        if (!element) return;
        
        // Animate out
        element.classList.remove('show');
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
        
        // Remove from notifications array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        
        this.emit('notificationRemoved', notificationId);
    }
    
    /**
     * Remove all notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }
    
    /**
     * Cleanup old notifications
     */
    cleanupOldNotifications() {
        if (this.notifications.length > this.maxNotifications) {
            const toRemove = this.notifications
                .slice(0, this.notifications.length - this.maxNotifications)
                .map(n => n.id);
            
            toRemove.forEach(id => this.remove(id));
        }
    }
    
    /**
     * Show success notification
     */
    success(title, message, duration) {
        return this.show({
            type: 'success',
            title,
            message,
            duration
        });
    }
    
    /**
     * Show error notification
     */
    error(title, message, duration) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: duration || 6000
        });
    }
    
    /**
     * Show warning notification
     */
    warning(title, message, duration) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration
        });
    }
    
    /**
     * Show info notification
     */
    info(title, message, duration) {
        return this.show({
            type: 'info',
            title,
            message,
            duration
        });
    }
    
    /**
     * Show achievement notification
     */
    achievement(title, message, duration) {
        return this.show({
            type: 'achievement',
            title,
            message,
            duration: duration || 6000,
            icon: '🏆'
        });
    }
    
    /**
     * Show level up notification
     */
    levelUp(level) {
        return this.show({
            type: 'achievement',
            title: 'LEVEL UP!',
            message: `PMC Level ${level} achieved!`,
            duration: 5000,
            icon: '⭐'
        });
    }
    
    /**
     * Show weapon unlock notification
     */
    weaponUnlock(weaponName) {
        return this.show({
            type: 'achievement',
            title: 'WEAPON UNLOCKED!',
            message: `${weaponName} is now available`,
            duration: 5000,
            icon: '🔫'
        });
    }
    
    /**
     * Show money reward notification
     */
    moneyReward(amount) {
        return this.show({
            type: 'success',
            title: 'REWARD EARNED',
            message: `+${amount} roubles`,
            duration: 3000,
            icon: '💰'
        });
    }
    
    /**
     * Add custom CSS for animations
     */
    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification.show {
                transform: translateX(0) !important;
                opacity: 1 !important;
            }
            
            .notification:hover {
                transform: translateX(-5px) scale(1.02);
                box-shadow: var(--shadow-lg), 0 0 30px rgba(212, 175, 55, 0.4);
            }
            
            @media (max-width: 768px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .notification {
                    margin-bottom: var(--spacing-xs);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Update notification system
     */
    update(deltaTime) {
        // Check for paused notifications and resume auto-removal
        this.notifications.forEach(notification => {
            const element = this.container?.querySelector(`[data-id="${notification.id}"]`);
            if (element && !element.dataset.paused) {
                // Handle any time-based updates here
            }
        });
    }
    
    /**
     * Get all notifications
     */
    getNotifications() {
        return [...this.notifications];
    }
    
    /**
     * Get notification count
     */
    getCount() {
        return this.notifications.length;
    }
}

export default NotificationSystem;
