const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');
const StorageAdapterInterface = require('./storage.interface');

class MinioStorageAdapter extends StorageAdapterInterface {
  constructor() {
    super();
    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
      },
      forcePathStyle: true
    });
    this.defaultBucket = process.env.MINIO_BUCKET_NAME || 'vs-boutique-deployments';
  }

  async upload(bucket, key, body, contentType) {
    const bucketName = bucket || this.defaultBucket;
    await this.client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream'
    }));
    return `${process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${bucketName}`}/${key}`;
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
    return `${process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${bucket || this.defaultBucket}`}/${key}`;
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

module.exports = new MinioStorageAdapter();
