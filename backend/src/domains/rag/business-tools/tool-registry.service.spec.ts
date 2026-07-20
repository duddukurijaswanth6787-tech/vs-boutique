import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Registry } from 'prom-client';
import { ToolRegistryService, BUSINESS_TOOLS } from './tool-registry.service';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { AuditService } from '@domains/audit/audit.service';
import type { BusinessTool } from './business-tool.interface';

const audit = { log: jest.fn().mockResolvedValue(undefined) };

const fakeTool: BusinessTool = {
  name: 'fake',
  description: 'fake tool',
  schema: () => ({ type: 'object' }),
  validate: (input: any) => {
    if (!input?.ok) throw new BadRequestException('bad');
  },
  execute: jest.fn().mockResolvedValue({ done: true }),
};

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(async () => {
    const m = { registry: new Registry() } as unknown as MetricsService;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolRegistryService,
        { provide: BUSINESS_TOOLS, useValue: [fakeTool] },
        { provide: MetricsService, useValue: m },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    service = module.get(ToolRegistryService);
  });

  it('lists registered tools', () => {
    const list = service.list();
    expect(list[0].name).toBe('fake');
  });

  it('get returns the tool', () => {
    expect(service.get('fake').name).toBe('fake');
  });

  it('get throws for unknown tool', () => {
    expect(() => service.get('nope')).toThrow(NotFoundException);
  });

  it('execute runs the tool and returns result', async () => {
    const r = await service.execute('fake', { ok: true }, {}, 'u1');
    expect(r).toEqual({ done: true });
  });

  it('execute validates input', async () => {
    await expect(
      service.execute('fake', { ok: false }, {}, 'u1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('health reports total', () => {
    expect(service.health().total).toBe(1);
  });
});
