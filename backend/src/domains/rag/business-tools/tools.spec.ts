import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductTool, OrderTool, KnowledgeTool, CustomerTool } from './tools';

describe('Business Tools', () => {
  let products: any;
  let orders: any;
  let retrieval: any;
  let profile: any;

  beforeEach(() => {
    products = { findAll: jest.fn(), findById: jest.fn() };
    orders = { findById: jest.fn() };
    retrieval = { retrieve: jest.fn() };
    profile = { getProfile: jest.fn() };
  });

  it('ProductTool searches via findAll', async () => {
    products.findAll!.mockResolvedValue({
      items: [{ id: 'p1' }],
      total: 1,
    } as any);
    const tool = new ProductTool(products);
    const r: any = await tool.execute({ query: 'shirt' }, {});
    expect(products.findAll).toHaveBeenCalled();
    expect(r.products).toHaveLength(1);
  });

  it('ProductTool findById delegates', async () => {
    products.findById!.mockResolvedValue({ id: 'p1' } as any);
    const tool = new ProductTool(products);
    const r: any = await tool.execute({ id: 'p1' }, {});
    expect(r.product).toBeDefined();
  });

  it('OrderTool validate rejects missing id', () => {
    const tool = new OrderTool(orders);
    expect(() => tool.validate({})).toThrow(BadRequestException);
  });

  it('OrderTool execute rejects missing order', async () => {
    orders.findById!.mockResolvedValue(null);
    const tool = new OrderTool(orders);
    await expect(tool.execute({ id: 'x' }, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('OrderTool enforces ownership for non-admins', async () => {
    orders.findById!.mockResolvedValue({ id: 'o1', status: 'PENDING' } as any);
    const tool = new OrderTool(orders);
    await expect(
      tool.execute({ id: 'o1', userId: 'other' }, { userId: 'me' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('OrderTool allows admin to view any order', async () => {
    orders.findById!.mockResolvedValue({ id: 'o1', status: 'PENDING' } as any);
    const tool = new OrderTool(orders);
    const r: any = await tool.execute(
      { id: 'o1', userId: 'other' },
      { userId: 'me', roles: ['admin'] },
    );
    expect(r.cancellationEligible).toBe(true);
  });

  it('OrderTool throws when order missing', async () => {
    orders.findById!.mockResolvedValue(null);
    const tool = new OrderTool(orders);
    await expect(tool.execute({ id: 'x' }, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('KnowledgeTool reuses retrieval service', async () => {
    retrieval.retrieve!.mockResolvedValue({
      chunks: [{ chunkId: 'c1' }],
      totalResults: 1,
      queryTimeMs: 5,
    } as any);
    const tool = new KnowledgeTool(retrieval);
    const r: any = await tool.execute({ query: 'q' }, {});
    expect(retrieval.retrieve).toHaveBeenCalled();
    expect(r.chunks).toHaveLength(1);
  });

  it('CustomerTool enforces self-scope', async () => {
    const tool = new CustomerTool(profile);
    await expect(
      tool.execute({ userId: 'other' }, { userId: 'me' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('CustomerTool returns profile for self', async () => {
    profile.getProfile!.mockResolvedValue({ id: 'me' } as any);
    const tool = new CustomerTool(profile);
    const r: any = await tool.execute({ userId: 'me' }, { userId: 'me' });
    expect(r.profile).toBeDefined();
  });

  it('every tool exposes schema and validate', () => {
    const tools = [
      new ProductTool(products),
      new OrderTool(orders),
      new KnowledgeTool(retrieval),
      new CustomerTool(profile),
    ];
    for (const t of tools) {
      expect(typeof t.schema).toBe('function');
      expect(t.schema()).toHaveProperty('type');
    }
  });
});
