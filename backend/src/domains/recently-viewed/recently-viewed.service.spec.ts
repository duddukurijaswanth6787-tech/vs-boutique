import { RecentlyViewedService } from './recently-viewed.service';
import { NotFoundException } from '@nestjs/common';

const mockDate = new Date('2026-07-19T12:00:00Z');
const mockProduct = {
  id: 'prod-1',
  deletedAt: null,
  isPublished: true,
  status: 'ACTIVE',
  visibility: 'VISIBLE',
};

const mockTx = {
  recentlyViewed: {
    upsert: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

const mockPrisma = {
  product: { findUnique: jest.fn() },
  $transaction: jest
    .fn()
    .mockImplementation((cb: (tx: any) => any) => cb(mockTx)),
};

const mockRepo = {
  findWithProduct: jest.fn(),
  findByUserAndProduct: jest.fn(),
  upsert: jest.fn(),
  deleteAll: jest.fn(),
  deleteOne: jest.fn(),
  count: jest.fn(),
  trimToLimit: jest.fn(),
  mergeMany: jest.fn(),
};

let service: RecentlyViewedService;

beforeEach(() => {
  service = new RecentlyViewedService(mockRepo as any, mockPrisma as any);
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(mockDate);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('RecentlyViewedService', () => {
  describe('record', () => {
    it('records a valid active product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockRepo.count.mockResolvedValue(5);

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 'prod-1', mockTx);
      expect(mockRepo.count).toHaveBeenCalledWith('user-1', mockTx);
      expect(mockRepo.trimToLimit).not.toHaveBeenCalled();
    });

    it('trims when over 20 items', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockRepo.count.mockResolvedValue(22);

      await service.record('user-1', 'prod-1');

      expect(mockRepo.trimToLimit).toHaveBeenCalledWith('user-1', 20, mockTx);
    });

    it('silently ignores deleted product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      });

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('silently ignores draft product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        status: 'DRAFT',
      });

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('silently ignores unpublished product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        isPublished: false,
      });

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('silently ignores hidden product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        visibility: 'HIDDEN',
      });

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('silently ignores non-existent product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await service.record('user-1', 'prod-1');

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('wraps upsert+trim in a single transaction', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockRepo.count.mockResolvedValue(21);

      await service.record('user-1', 'prod-1');

      expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 'prod-1', mockTx);
      expect(mockRepo.count).toHaveBeenCalledWith('user-1', mockTx);
      expect(mockRepo.trimToLimit).toHaveBeenCalledWith('user-1', 20, mockTx);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('updates viewedAt for duplicate view', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockTx.recentlyViewed.count.mockResolvedValue(3);

      await service.record('user-1', 'prod-1');
      await service.record('user-1', 'prod-1');

      expect(mockRepo.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('returns mapped product data with meta', async () => {
      const mockData = [
        {
          productId: 'prod-1',
          product: {
            name: 'Test',
            slug: 'test',
            basePrice: 1000,
            salePrice: 800,
          },
          viewedAt: mockDate,
        },
      ];
      mockRepo.findWithProduct.mockResolvedValue({ data: mockData, total: 1 });

      const result = await service.findAll('user-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test');
      expect(result.meta.total).toBe(1);
    });

    it('returns empty data when no history', async () => {
      mockRepo.findWithProduct.mockResolvedValue({ data: [], total: 0 });

      const result = await service.findAll('user-1', 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('deleteAll', () => {
    it('clears all records for user', async () => {
      await service.deleteAll('user-1');
      expect(mockRepo.deleteAll).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteOne', () => {
    it('deletes existing item', async () => {
      mockRepo.findByUserAndProduct.mockResolvedValue({ id: 'rv-1' });

      await service.deleteOne('user-1', 'prod-1');

      expect(mockRepo.deleteOne).toHaveBeenCalledWith('user-1', 'prod-1');
    });

    it('throws for non-existent item', async () => {
      mockRepo.findByUserAndProduct.mockResolvedValue(null);

      await expect(service.deleteOne('user-1', 'prod-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mergeFromGuest', () => {
    const guestItems = [
      { productId: 'prod-1', viewedAt: '2026-07-19T11:00:00Z' },
      { productId: 'prod-2', viewedAt: '2026-07-19T10:00:00Z' },
    ];

    it('merges guest items and trims', async () => {
      mockRepo.count.mockResolvedValue(22);

      await service.mergeFromGuest('user-1', guestItems);

      expect(mockRepo.mergeMany).toHaveBeenCalledWith(
        [
          {
            userId: 'user-1',
            productId: 'prod-1',
            viewedAt: new Date('2026-07-19T11:00:00Z'),
          },
          {
            userId: 'user-1',
            productId: 'prod-2',
            viewedAt: new Date('2026-07-19T10:00:00Z'),
          },
        ],
        mockTx,
      );
      expect(mockRepo.trimToLimit).toHaveBeenCalledWith('user-1', 20, mockTx);
    });

    it('does nothing for empty items', async () => {
      await service.mergeFromGuest('user-1', []);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('skips trim when under limit', async () => {
      mockRepo.count.mockResolvedValue(5);

      await service.mergeFromGuest('user-1', guestItems);

      expect(mockRepo.trimToLimit).not.toHaveBeenCalled();
    });

    it('is transactional', async () => {
      mockRepo.count.mockResolvedValue(15);

      await service.mergeFromGuest('user-1', guestItems);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockRepo.mergeMany).toHaveBeenCalledWith(
        expect.any(Array),
        mockTx,
      );
    });
  });
});
