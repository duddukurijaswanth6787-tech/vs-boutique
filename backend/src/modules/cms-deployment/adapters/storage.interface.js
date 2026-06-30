class StorageAdapterInterface {
  async upload(bucket, key, body, contentType) {
    throw new Error('Method not implemented');
  }

  async download(bucket, key) {
    throw new Error('Method not implemented');
  }

  async delete(bucket, key) {
    throw new Error('Method not implemented');
  }

  async list(bucket, prefix) {
    throw new Error('Method not implemented');
  }

  async getUrl(bucket, key) {
    throw new Error('Method not implemented');
  }

  async exists(bucket, key) {
    throw new Error('Method not implemented');
  }

  async copy(bucket, sourceKey, destKey) {
    throw new Error('Method not implemented');
  }
}

module.exports = StorageAdapterInterface;
