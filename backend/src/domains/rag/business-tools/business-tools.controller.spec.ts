import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@domains/auth/services/jwt.service';
import { BusinessToolsController } from './business-tools.controller';
import { ToolRegistryService } from './tool-registry.service';

describe('BusinessToolsController', () => {
  let controller: BusinessToolsController;
  const registry = {
    list: jest
      .fn()
      .mockReturnValue([{ name: 't', description: 'd', schema: {} }]),
    has: jest.fn().mockReturnValue(true),
    get: jest
      .fn()
      .mockReturnValue({ name: 't', description: 'd', schema: () => ({}) }),
    execute: jest.fn().mockResolvedValue({ ok: true }),
    health: jest
      .fn()
      .mockReturnValue({ total: 1, tools: ['t'], status: 'healthy' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessToolsController],
      providers: [
        { provide: ToolRegistryService, useValue: registry },
        {
          provide: JwtService,
          useValue: { verify: jest.fn().mockReturnValue({ sub: 'u1' }) },
        },
      ],
    }).compile();
    controller = module.get(BusinessToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('list delegates to registry', async () => {
    const r: any = await controller.list();
    expect(registry.list).toHaveBeenCalled();
    expect(r.data.tools).toHaveLength(1);
  });

  it('getOne delegates', async () => {
    await controller.getOne('t');
    expect(registry.get).toHaveBeenCalledWith('t');
  });

  it('execute delegates with context', async () => {
    await controller.execute('t', {
      input: { a: 1 },
      userId: 'u1',
      roles: ['admin'],
    });
    expect(registry.execute).toHaveBeenCalledWith(
      't',
      { a: 1 },
      { userId: 'u1', roles: ['admin'] },
      'u1',
    );
  });

  it('health delegates', async () => {
    await controller.health();
    expect(registry.health).toHaveBeenCalled();
  });
});
