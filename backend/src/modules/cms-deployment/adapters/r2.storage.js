const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const StorageAdapterInterface = require('./storage.interface');

class R2StorageAdapter extends StorageAdapterInterface {
  constructor() {
    super();
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
    this.defaultBucket = process.env.R2_BUCKET_NAME || 'vs-boutique-deployments';
  }

  async upload(bucket, key, body, contentType) {
    const bucketName = bucket || this.defaultBucket;
    await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream'
    }));
    return `${process.env.R2_PUBLIC_URL || `https://${bucketName}.r2.dev`}/${key}`;
  }

  async download(bucket, key) {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key
    }));
    return response.Body;
  }

  async delete(bucket, key) {
    await this.client.send(new DeleteObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key
    }));
  }

  async list(bucket, prefix) {
    const result = await this.client.send(new ListObjectsV2Command({
      Bucket: bucket || this.defaultBucket,
      Prefix: prefix
    }));
    return result.Contents || [];
  }

  async getUrl(bucket, key) {
    const command = new GetObjectCommand({
      Bucket: bucket || this.defaultBucket,
      Key: key
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async exists(bucket, key) {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key
      }));
      return true;
    } catch {
      return false;
    }
  }

  async copy(bucket, sourceKey, destKey) {
    const bucketName = bucket || this.defaultBucket;
    await this.client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destKey
    }));
  }
}

module.exports = new R2StorageAdapter();
