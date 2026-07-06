const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../../../server.log');

const log = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
  const logMessage = `[${timestamp}] [AI-${level.toUpperCase()}] ${message}${metaString}\n`;
  
  process.stdout.write(logMessage);

  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (err) {
    console.error("Failed to write to log file", err);
  }
};

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};

module.exports = logger;
