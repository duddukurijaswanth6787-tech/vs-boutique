import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationListener } from './cache-invalidation.listener';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { PrismaService } from '@database/prisma.service';

describe('CacheInvalidationListener (home:page)', () => {
  let listener: CacheInvalidationListener;
  let emitter: AppEventEmitter;
  const cache = { del: jest.fn(), delPattern: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationListener,
        { provide: AppEventEmitter, useValue: new AppEventEmitter() },
        { provide: CacheService, useValue: cache },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    listener = module.get(CacheInvalidationListener);
    emitter = module.get(AppEventEmitter);
    listener.onModuleInit();
  });

  it('deletes home:page on cache.invalidate.all.details', () => {
    emitter.emit('cache.invalidate.all.details');
    expect(cache.del).toHaveBeenCalledWith('home:page');
  });

  it('deletes home:page on cache.invalidate.product.details', () => {
    emitter.emit('cache.invalidate.product.details', { productId: 'p1' });
    expect(cache.del).toHaveBeenCalledWith('home:page');
  });
});
