const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const prisma = require('../../../utils/prisma');
const antivirusService = require('../../cms-deployment/services/antivirus.service');

const SANDBOX_DIR = path.join(__dirname, '../../../../sandbox-extractions');

if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

class UploadService {
  async listUploads(businessId) {
    const uploads = await prisma.cmsUpload.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    return uploads;
  }

  async getUploadStatus(id, businessId) {
    const upload = await prisma.cmsUpload.findFirst({
      where: { id, businessId }
    });
    return upload || null;
  }

  async handleUpload(file, userId, blueprintId, businessId) {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

    const upload = await prisma.cmsUpload.create({
      data: {
        businessId,
        filename: file.originalname,
        sizeBytes: file.size,
        blueprintId: blueprintId || null,
        status: 'PENDING',
        progressPercent: 10,
        virusScanResult: 'WAITING',
        sandboxPath: null,
        errorDetails: null,
        createdBy: userId
      }
    });

    this._processUpload(upload.id, file.path, businessId);

    return upload;
  }

  async _processUpload(id, zipPath, businessId) {
    const updateStatus = async (fields) => {
      await prisma.cmsUpload.update({
        where: { id },
        data: fields
      });
    };

    try {
      await updateStatus({ status: 'SCANNING', progressPercent: 30, virusScanResult: 'SCANNING' });

      const scanResult = await antivirusService.scanFile(zipPath);

      if (scanResult.infected) {
        await updateStatus({
          status: 'FAILED',
          progressPercent: 100,
          virusScanResult: 'INFECTED',
          errorDetails: `Malware detected: ${scanResult.threat}`
        });
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        return;
      }

      await updateStatus({ progressPercent: 50, virusScanResult: scanResult.fallback ? 'UNAVAILABLE' : 'CLEAN' });

      await updateStatus({ status: 'EXTRACTING', progressPercent: 70 });
      const destDir = path.join(SANDBOX_DIR, id);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      exec(`tar -xf "${zipPath}" -C "${destDir}"`, async (error) => {
        if (error) {
          await updateStatus({
            status: 'FAILED',
            progressPercent: 100,
            errorDetails: `Sandbox extraction failed: ${error.message}`
          });
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          return;
        }

        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

        await updateStatus({
          status: 'COMPLETED',
          progressPercent: 100,
          sandboxPath: destDir
        });
      });

    } catch (err) {
      await updateStatus({
        status: 'FAILED',
        progressPercent: 100,
        errorDetails: `Internal upload processing error: ${err.message}`
      });
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
  }
}

module.exports = new UploadService();
