const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '../../../../node_modules/.metadata-uploads');
const SANDBOX_DIR = path.join(UPLOADS_DIR, 'sandbox');
const DB_FILE = path.join(UPLOADS_DIR, 'uploads-db.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ uploads: [] }, null, 2));
}

class UploadService {
  /**
   * Helper to read local JSON database
   */
  _readDb() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return { uploads: [] };
    }
  }

  /**
   * Helper to write local JSON database
   */
  _writeDb(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }

  /**
   * Lists all uploaded codebase tasks
   * @returns {Promise<Array>} List of uploads
   */
  async listUploads() {
    const db = this._readDb();
    return db.uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Fetches single upload status detail
   * @param {string} id - Upload Identifier
   * @returns {Promise<Object|null>} Upload details
   */
  async getUploadStatus(id) {
    const db = this._readDb();
    return db.uploads.find(u => u.id === id) || null;
  }

  /**
   * Initiates ingestion pipeline: local storage, virus scan simulation, and sandboxed extraction.
   * @param {Object} file - Multer file object
   * @param {string} userId - Authoring user ID
   * @param {string} blueprintId - Associated blueprint ID
   * @returns {Promise<Object>} Created upload task status record
   */
  async handleUpload(file, userId, blueprintId) {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    const uploadId = uuidv4();
    const tempFilePath = file.path;

    const newUpload = {
      id: uploadId,
      filename: file.originalname,
      sizeBytes: file.size,
      blueprintId,
      status: 'PENDING',
      progressPercent: 10,
      virusScanResult: 'WAITING',
      sandboxPath: null,
      errorDetails: null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const db = this._readDb();
    db.uploads.push(newUpload);
    this._writeDb(db);

    // Run processing pipeline asynchronously in the background
    this._processUpload(uploadId, tempFilePath);

    return newUpload;
  }

  /**
   * Run async virus scanning & sandbox extraction
   */
  async _processUpload(id, zipPath) {
    const updateStatus = (fields) => {
      const db = this._readDb();
      const idx = db.uploads.findIndex(u => u.id === id);
      if (idx !== -1) {
        db.uploads[idx] = {
          ...db.uploads[idx],
          ...fields,
          updatedAt: new Date().toISOString()
        };
        this._writeDb(db);
      }
    };

    try {
      // Step 1: Virus Scan Simulation (ClamAV mock)
      updateStatus({ status: 'SCANNING', progressPercent: 30, virusScanResult: 'SCANNING' });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work

      // Perform a safety check on filename or content tags
      const baseFilename = path.basename(zipPath);
      if (baseFilename.toLowerCase().includes('virus') || baseFilename.toLowerCase().includes('malware')) {
        updateStatus({
          status: 'FAILED',
          progressPercent: 100,
          virusScanResult: 'INFECTED',
          errorDetails: 'Malware signature detected (ClamAV threat block: Eicar-Test-Signature).'
        });
        // Remove infected file
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        return;
      }

      updateStatus({ progressPercent: 50, virusScanResult: 'CLEAN' });

      // Step 2: Extraction Sandbox Creation
      updateStatus({ status: 'EXTRACTING', progressPercent: 70 });
      const destDir = path.join(SANDBOX_DIR, id);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Execute native bsdtar command to unzip
      const command = `tar -xf "${zipPath}" -C "${destDir}"`;
      exec(command, (error) => {
        if (error) {
          updateStatus({
            status: 'FAILED',
            progressPercent: 100,
            errorDetails: `Sandbox extraction failed: ${error.message}`
          });
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          return;
        }

        // Successfully extracted! Clean up the raw ZIP archive
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        updateStatus({
          status: 'COMPLETED',
          progressPercent: 100,
          sandboxPath: destDir
        });
      });

    } catch (err) {
      updateStatus({
        status: 'FAILED',
        progressPercent: 100,
        errorDetails: `Internal upload processing error: ${err.message}`
      });
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
  }
}

module.exports = new UploadService();
