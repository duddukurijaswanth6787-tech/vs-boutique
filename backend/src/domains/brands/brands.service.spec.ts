import { BrandsService } from './brands.service';

// ponytail: direct instantiation — no NestJS TestingModule, no OOM
const mockBrand = {
  id: 'brand-1',
  name: 'Test Brand',
  slug: 'test-brand',
  isActive: true,
  deletedAt: null,
};
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn() };
const mockCache = { getOrSet: jest.fn(), delPattern: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };

let service: BrandsService;

beforeEach(() => {
  service = new BrandsService(
    mockRepo as any,
    mockAudit as any,
    mockLogger as any,
    mockCache as any,
    mockEventEmitter as any,
  );
  jest.clearAllMocks();
  mockRepo.findById.mockResolvedValue(mockBrand);
  mockRepo.findAll.mockResolvedValue({ data: [mockBrand], meta: { total: 1 } });
  mockCache.getOrSet.mockImplementation((_k: string, f: () => any) => f());
  mockCache.delPattern.mockResolvedValue(undefined);
  mockAudit.log.mockResolvedValue(undefined);
  mockRepo.create.mockResolvedValue(mockBrand);
  mockRepo.update.mockResolvedValue({ ...mockBrand, name: 'Updated' });
  mockRepo.softDelete.mockResolvedValue(undefined);
  mockRepo.restore.mockResolvedValue(mockBrand);
});

describe('BrandsService', () => {
  it('findAll returns cached brands', async () => {
    const result = await service.findAll({});
    expect(result.data).toHaveLength(1);
    expect(mockCache.getOrSet).toHaveBeenCalled();
  });

  it('findById returns a brand', async () => {
    const result = await service.findById('brand-1');
    expect(result.id).toBe('brand-1');
  });

  it('findById throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow();
  });

  it('create invalidates cache', async () => {
    await service.create({ name: 'New' }, 'user-1');
    expect(mockRepo.create).toHaveBeenCalled();
    expect(mockCache.delPattern).toHaveBeenCalledWith('brand:*');
  });

  it('update invalidates cache', async () => {
    await service.update('brand-1', { name: 'Updated' }, 'user-1');
    expect(mockRepo.update).toHaveBeenCalled();
    expect(mockCache.delPattern).toHaveBeenCalledWith('brand:*');
  });

  it('delete soft-deletes and invalidates cache', async () => {
    await service.delete('brand-1', 'user-1');
    expect(mockRepo.softDelete).toHaveBeenCalled();
    expect(mockCache.delPattern).toHaveBeenCalledWith('brand:*');
  });

  it('restore invalidates cache', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ ...mockBrand, deletedAt: new Date() })
      .mockResolvedValueOnce(mockBrand);
    await service.restore('brand-1', 'user-1');
    expect(mockRepo.restore).toHaveBeenCalled();
    expect(mockCache.delPattern).toHaveBeenCalledWith('brand:*');
  });

  it('bulk handles failures', async () => {
    mockRepo.softDelete.mockRejectedValue(new Error('DB error'));
    const result = await service.bulk(
      { ids: ['brand-1'], action: 'delete' },
      'user-1',
    );
    expect(result.failed).toHaveLength(1);
  });
});
