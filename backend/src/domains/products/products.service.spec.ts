import { ProductsService } from './products.service';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  slug: 'test-product',
  sku: 'SKU-001',
  basePrice: 1000,
  status: 'DRAFT',
  isFeatured: false,
  isPublished: false,
  deletedAt: null,
};
const deletedProduct = { ...mockProduct, deletedAt: new Date() };
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findBySku: jest.fn(),
  findByBarcode: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  getStats: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn() };
const mockStorage = { getSignedUploadUrl: jest.fn(), getPublicUrl: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };

let service: ProductsService;

beforeEach(() => {
  service = new ProductsService(
    mockRepo as any,
    mockAudit as any,
    mockLogger as any,
    mockStorage as any,
    {} as any,
    {} as any,
    mockEventEmitter as any,
    {} as any,
  );
  jest.clearAllMocks();
  mockRepo.findById.mockResolvedValue(mockProduct);
  mockRepo.findAll.mockResolvedValue({
    data: [mockProduct],
    meta: { total: 1 },
  });
  mockAudit.log.mockResolvedValue(undefined);
  mockRepo.create.mockResolvedValue(mockProduct);
  mockRepo.update.mockResolvedValue({ ...mockProduct, name: 'Updated' });
  mockRepo.softDelete.mockResolvedValue(undefined);
  mockRepo.restore.mockResolvedValue(mockProduct);
});

describe('ProductsService', () => {
  it('findAll returns products', async () => {
    const result = await service.findAll({});
    expect(result.data).toHaveLength(1);
  });

  it('findById returns product', async () => {
    const result = await service.findById('prod-1');
    expect(result.id).toBe('prod-1');
  });

  it('findById throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow();
  });

  it('create creates product and logs audit', async () => {
    await service.create(
      { name: 'New', sku: 'NEW', basePrice: 500 } as any,
      'user-1',
    );
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('update updates product', async () => {
    await service.update('prod-1', { name: 'Updated' }, 'user-1');
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('update throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(
      service.update('missing', {} as any, 'user-1'),
    ).rejects.toThrow();
  });

  it('delete soft-deletes', async () => {
    await service.delete('prod-1', 'user-1');
    expect(mockRepo.softDelete).toHaveBeenCalledWith('prod-1');
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('delete throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.delete('missing', 'user-1')).rejects.toThrow();
  });

  it('restore restores deleted product', async () => {
    mockRepo.findById
      .mockResolvedValueOnce(deletedProduct)
      .mockResolvedValueOnce(mockProduct);
    await service.restore('prod-1', 'user-1');
    expect(mockRepo.restore).toHaveBeenCalled();
  });

  it('restore throws for non-deleted', async () => {
    await expect(service.restore('prod-1', 'user-1')).rejects.toThrow();
  });

  it('publish publishes product', async () => {
    mockRepo.update.mockResolvedValue({
      ...mockProduct,
      status: 'ACTIVE',
      isPublished: true,
    });
    await service.publish('prod-1', 'user-1');
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('publish throws for already published', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockProduct, isPublished: true });
    await expect(service.publish('prod-1', 'user-1')).rejects.toThrow();
  });

  it('bulk delete handles success', async () => {
    const result = await service.bulk(
      { ids: ['prod-1'], action: 'delete' },
      'user-1',
    );
    expect(result.success).toHaveLength(1);
    expect(result.success[0].id).toBe('prod-1');
  });

  it('bulk delete handles failures', async () => {
    mockRepo.softDelete.mockRejectedValue(new Error('DB error'));
    const result = await service.bulk(
      { ids: ['prod-1'], action: 'delete' },
      'user-1',
    );
    expect(result.failed).toHaveLength(1);
  });
});
