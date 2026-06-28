const EventEmitter = require('events');
const logger = require('./logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase listener limits for multi-queue step pipes
    this.setMaxListeners(50);
  }

  publish(eventType, sessionId, payload) {
    const event = {
      eventId: `evt-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      sessionId,
      timestamp: new Date().toISOString(),
      payload
    };

    logger.info(`Event Published: ${eventType} for Session: ${sessionId}`);
    this.emit(eventType, event);
    this.emit('*', event); // Wildcard listener support
  }
}

module.exports = new EventBus();
