import { CacheService } from './cache.service';

// ponytail: test cache behavior — getOrSet, delPattern, TTL, error handling
describe('CacheService', () => {
  let service: CacheService;
  let mockClient: any;
  let mockRedis: any;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    };
    mockRedis = { getClient: () => mockClient };
    service = new CacheService(mockRedis);
  });

  describe('getOrSet', () => {
    it('returns cached value on hit', async () => {
      mockClient.get.mockResolvedValue(JSON.stringify({ data: 'cached' }));
      const result = await service.getOrSet(
        'key',
        () => Promise.resolve({ data: 'fresh' }),
        60,
      );
      expect(result).toEqual({ data: 'cached' });
      expect(mockClient.get).toHaveBeenCalledWith('key');
    });

    it('calls factory and caches on miss', async () => {
      mockClient.get.mockResolvedValue(null);
      mockClient.set.mockResolvedValue('OK');
      const result = await service.getOrSet(
        'key',
        () => Promise.resolve({ data: 'fresh' }),
        60,
      );
      expect(result).toEqual({ data: 'fresh' });
      expect(mockClient.set).toHaveBeenCalled();
    });

    it('returns factory result even when Redis fails', async () => {
      mockClient.get.mockRejectedValue(new Error('Redis down'));
      const result = await service.getOrSet(
        'key',
        () => Promise.resolve({ data: 'fallback' }),
        60,
      );
      expect(result).toEqual({ data: 'fallback' });
    });

    it('swallows Redis set errors', async () => {
      mockClient.get.mockResolvedValue(null);
      mockClient.set.mockRejectedValue(new Error('Redis down'));
      const result = await service.getOrSet(
        'key',
        () => Promise.resolve({ data: 'ok' }),
        60,
      );
      expect(result).toEqual({ data: 'ok' });
    });
  });

  describe('delPattern', () => {
    beforeEach(() => {
      mockClient.scan = jest.fn();
    });

    it('deletes matching keys via SCAN', async () => {
      mockClient.scan.mockResolvedValueOnce(['0', ['brand:1', 'brand:2']]);
      mockClient.del.mockResolvedValue(2);
      await service.delPattern('brand:*');
      expect(mockClient.scan).toHaveBeenCalledWith(
        '0',
        'MATCH',
        'brand:*',
        'COUNT',
        100,
      );
      expect(mockClient.del).toHaveBeenCalledWith('brand:1', 'brand:2');
    });

    it('handles paginated SCAN results', async () => {
      mockClient.scan
        .mockResolvedValueOnce(['1', ['brand:1']])
        .mockResolvedValueOnce(['0', ['brand:2', 'brand:3']]);
      mockClient.del.mockResolvedValue(3);
      await service.delPattern('brand:*');
      expect(mockClient.scan).toHaveBeenCalledTimes(2);
      expect(mockClient.del).toHaveBeenCalledWith(
        'brand:1',
        'brand:2',
        'brand:3',
      );
    });

    it('handles no matching keys', async () => {
      mockClient.scan.mockResolvedValue(['0', []]);
      await service.delPattern('brand:*');
      expect(mockClient.del).not.toHaveBeenCalled();
    });

    it('swallows Redis errors', async () => {
      mockClient.scan.mockRejectedValue(new Error('Redis down'));
      await expect(service.delPattern('brand:*')).resolves.not.toThrow();
    });
  });
});
