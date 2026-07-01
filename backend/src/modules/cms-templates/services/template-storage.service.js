const path = require('path');
const prisma = require('../../../utils/prisma');
const { invalidateCache } = require('../middleware/cache');

class TemplateStorageService {
  constructor() {
    this._adapter = null;
  }

  async getAdapter() {
    if (this._adapter) return this._adapter;

    const storageType = process.env.TEMPLATE_STORAGE || 'local';
    const bucketName = process.env.TEMPLATE_BUCKET || 'cms-templates';

    switch (storageType) {
      case 's3': {
        const { S3Client } = require('@aws-sdk/client-s3');
        const { Upload } = require('@aws-sdk/lib-storage');
        this._adapter = {
          type: 's3',
          bucket: bucketName,
          client: new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
          }),
          upload: async (key, buffer, mimeType) => {
            const upload = new Upload({
              client: this._adapter.client,
              params: { Bucket: bucketName, Key: key, Body: buffer, ContentType: mimeType }
            });
            const result = await upload.done();
            return { key, url: result.Location, bucket: bucketName };
          },
          getUrl: async (key) => {
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
            return getSignedUrl(this._adapter.client, cmd, { expiresIn: 3600 });
          },
          delete: async (key) => {
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
            await this._adapter.client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
          }
        };
        break;
      }
      case 'r2': {
        const { S3Client } = require('@aws-sdk/client-s3');
        this._adapter = {
          type: 'r2',
          bucket: bucketName,
          client: new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
            }
          }),
          upload: async (key, buffer, mimeType) => {
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            await this._adapter.client.send(new PutObjectCommand({
              Bucket: bucketName, Key: key, Body: buffer, ContentType: mimeType
            }));
            const publicUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.r2.dev`;
            return { key, url: `${publicUrl}/${key}`, bucket: bucketName };
          },
          getUrl: async (key) => {
            const publicUrl = process.env.R2_PUBLIC_URL || `https://${bucketName}.r2.dev`;
            return `${publicUrl}/${key}`;
          },
          delete: async (key) => {
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
            await this._adapter.client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
          }
        };
        break;
      }
      default: {
        this._adapter = {
          type: 'local',
          bucket: bucketName,
          localDir: path.join(__dirname, '../../../../uploads/templates'),
          upload: async (key, buffer) => {
            const fs = require('fs');
            const dir = path.dirname(path.join(this._adapter.localDir, key));
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(this._adapter.localDir, key), buffer);
            return { key, url: `/api/v1/cms/templates/storage/${key}`, bucket: bucketName };
          },
          getUrl: async (key) => `/api/v1/cms/templates/storage/${key}`,
          delete: async (key) => {
            const fs = require('fs');
            const filePath = path.join(this._adapter.localDir, key);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          }
        };
      }
    }

    return this._adapter;
  }

  async uploadAsset(templateId, field, file, userId) {
    const template = await prisma.cmsTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');

    const ext = path.extname(file.originalname) || '.bin';
    const key = `templates/${templateId}/${field}-${Date.now()}${ext}`;
    const adapter = await this.getAdapter();
    const result = await adapter.upload(key, file.buffer, file.mimetype);

    const updateData = { [field]: result.url, updatedBy: userId };
    await prisma.cmsTemplate.update({
      where: { id: templateId },
      data: updateData
    });

    await invalidateCache(`template:*/${templateId}*`);
    return result;
  }

  async uploadZipArtifact(templateId, file, userId) {
    return this.uploadAsset(templateId, 'zipArtifact', file, userId);
  }

  async uploadManifestZip(templateId, file, userId) {
    const result = await this.uploadAsset(templateId, 'manifestUrl', {
      ...file,
      originalname: `manifest-${Date.now()}.zip`
    }, userId);
    return result;
  }

  async serveLocalFile(req, res) {
    const fs = require('fs');
    const adapter = await this.getAdapter();
    const filePath = path.join(adapter.localDir, req.params[0]);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ success: false, message: 'File not found' });
  }
}

module.exports = new TemplateStorageService();
