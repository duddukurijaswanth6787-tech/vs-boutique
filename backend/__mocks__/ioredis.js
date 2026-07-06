const EventEmitter = require('events');

class RedisMock extends EventEmitter {
  constructor() {
    super();
    this._store = {};
    process.nextTick(() => this.emit('ready'));
  }
  async get(key) { return this._store[key] || null; }
  async set(key, value) { this._store[key] = value; return 'OK'; }
  async setex(key, ttl, value) { this._store[key] = value; return 'OK'; }
  async del(...keys) { for (const k of keys) delete this._store[k]; return keys.length; }
  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Object.keys(this._store).filter(k => regex.test(k));
  }
  async quit() { return 'OK'; }
  disconnect() {}
}

module.exports = RedisMock;
