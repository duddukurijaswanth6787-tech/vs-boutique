const s3Storage = require('./s3.storage');
const r2Storage = require('./r2.storage');
const minioStorage = require('./minio.storage');

const STORAGE_PROVIDER = (process.env.DEPLOYMENT_STORAGE_PROVIDER || 's3').toLowerCase();

function getStorageAdapter() {
  switch (STORAGE_PROVIDER) {
    case 'r2':
      return r2Storage;
    case 'minio':
      return minioStorage;
    case 's3':
    default:
      return s3Storage;
  }
}

module.exports = { getStorageAdapter, s3Storage, r2Storage, minioStorage };
