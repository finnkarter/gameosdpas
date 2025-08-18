/**
 * Event Emitter Utility
 * Simple event system for inter-system communication
 */

export class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 100;
    }
    
    /**
     * Add event listener
     */
    on(eventName, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }
        
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        
        if (listeners.length >= this.maxListeners) {
            console.warn(`MaxListeners exceeded for event: ${eventName}`);
        }
        
        listeners.push(listener);
        
        return this;
    }
    
    /**
     * Add one-time event listener
     */
    once(eventName, listener) {
        const onceWrapper = (...args) => {
            this.off(eventName, onceWrapper);
            listener.apply(this, args);
        };
        
        return this.on(eventName, onceWrapper);
    }
    
    /**
     * Remove event listener
     */
    off(eventName, listener) {
        if (!this.events.has(eventName)) {
            return this;
        }
        
        const listeners = this.events.get(eventName);
        const index = listeners.indexOf(listener);
        
        if (index !== -1) {
            listeners.splice(index, 1);
        }
        
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }
        
        return this;
    }
    
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
        
        return this;
    }
    
    /**
     * Emit event
     */
    emit(eventName, ...args) {
        if (!this.events.has(eventName)) {
            return false;
        }
        
        const listeners = this.events.get(eventName).slice();
        
        for (const listener of listeners) {
            try {
                if (typeof listener === 'function') {
                    listener.apply(this, args);
                } else {
                    console.warn(`Non-function listener found for event ${eventName}`);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
                // Continue with other listeners instead of failing completely
            }
        }
        
        return true;
    }
    
    /**
     * Get listener count for event
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        
        return this.events.get(eventName).length;
    }
    
    /**
     * Get all event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
}

export default EventEmitter;
