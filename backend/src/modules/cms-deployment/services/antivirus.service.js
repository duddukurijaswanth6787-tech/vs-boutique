const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

class AntivirusService {
  constructor() {
    this.clamAvSocket = process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.ctl';
    this.clamAvHost = process.env.CLAMAV_HOST || '127.0.0.1';
    this.clamAvPort = parseInt(process.env.CLAMAV_PORT || '3310', 10);
    this.timeout = parseInt(process.env.CLAMAV_TIMEOUT || '30000', 10);
    this.maxFileSize = parseInt(process.env.CLAMAV_MAX_FILE_SIZE || '26214400', 10);
    this.maxExtractionSize = parseInt(process.env.ZIP_MAX_EXTRACTION_SIZE || '104857600', 10);
    this.maxExtractionFiles = parseInt(process.env.ZIP_MAX_FILES || '10000', 10);
    this.maxCompressionRatio = parseInt(process.env.ZIP_MAX_COMPRESSION_RATIO || '100', 10);
  }

  async scanFile(filePath) {
    const { clamAvHost, clamAvPort, timeout } = this;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const clamav = spawn('clamdscan', [
        '--stdout',
        '--no-summary',
        '--fdpass',
        filePath
      ], {
        timeout,
        env: { ...process.env, CLAMD_HOST: clamAvHost, CLAMD_PORT: String(clamAvPort) }
      });

      let stdout = '';
      let stderr = '';

      clamav.stdout.on('data', (data) => { stdout += data.toString(); });
      clamav.stderr.on('data', (data) => { stderr += data.toString(); });

      clamav.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          resolve({ infected: false, threat: null, duration, scanner: 'clamav' });
        } else if (code === 1) {
          const threatMatch = stdout.match(/FOUND\s*(.+)/);
          resolve({
            infected: true,
            threat: threatMatch ? threatMatch[1].trim() : 'Unknown threat',
            duration,
            scanner: 'clamav'
          });
        } else {
          if (stderr.includes('connect() failed')) {
            resolve({
              infected: false,
              scanner: 'clamav',
              fallback: true,
              warning: 'ClamAV daemon not available. File accepted without scan.',
              duration
            });
          } else {
            reject(new Error(`ClamAV scan failed: ${stderr || stdout}`));
          }
        }
      });

      clamav.on('error', (err) => {
        resolve({
          infected: false,
          scanner: 'clamav',
          fallback: true,
          warning: `ClamAV error: ${err.message}. File accepted without scan.`,
          duration: Date.now() - startTime
        });
      });
    });
  }

  async scanBuffer(buffer, filename = 'unknown') {
    const tmpDir = path.join(require('os').tmpdir(), 'clamav-scans');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
    try {
      fs.writeFileSync(tmpFile, buffer);
      return await this.scanFile(tmpFile);
    } finally {
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    }
  }

  validateZipBomb(zipEntries) {
    const { maxExtractionFiles, maxExtractionSize, maxCompressionRatio } = this;
    const totalFiles = zipEntries.length;
    if (totalFiles > maxExtractionFiles) {
      throw new Error(`Zip bomb detected: ${totalFiles} files exceeds maximum of ${maxExtractionFiles}`);
    }
    let totalUncompressed = 0;
    let totalCompressed = 0;
    for (const entry of zipEntries) {
      totalUncompressed += entry.uncompressedSize || 0;
      totalCompressed += entry.compressedSize || 0;
      if (entry.uncompressedSize === 0 && entry.compressedSize > 100000) {
        throw new Error(`Suspicious entry detected: ${entry.name} has 0 uncompressed size but ${entry.compressedSize} compressed`);
      }
    }
    if (totalUncompressed > maxExtractionSize) {
      throw new Error(`Zip bomb detected: total uncompressed size ${totalUncompressed} exceeds maximum ${maxExtractionSize}`);
    }
    if (totalCompressed > 0 && totalUncompressed / totalCompressed > maxCompressionRatio) {
      throw new Error(`Zip bomb detected: compression ratio ${(totalUncompressed / totalCompressed).toFixed(1)}x exceeds max ${maxCompressionRatio}x`);
    }
    return { safe: true, totalFiles, totalUncompressed, totalCompressed };
  }

  getFallbackWarning() {
    return 'ClamAV virus scanner not available. File accepted without scanning. Set CLAMAV_HOST environment variable to enable.';
  }
}

module.exports = new AntivirusService();
