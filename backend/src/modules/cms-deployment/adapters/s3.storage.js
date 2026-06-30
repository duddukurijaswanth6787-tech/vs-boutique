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

class S3StorageAdapter extends StorageAdapterInterface {
  constructor() {
    super();
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
      }
    });
    this.defaultBucket = process.env.AWS_BUCKET_NAME || 'vs-boutique-deployments';
  }

  async upload(bucket, key, body, contentType) {
    const bucketName = bucket || this.defaultBucket;
    await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream'
    }));
    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
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

module.exports = new S3StorageAdapter();
