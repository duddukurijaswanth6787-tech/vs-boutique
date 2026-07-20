import { OrderService } from './order.service';

const mockOrder = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  status: 'PENDING',
  customerId: 'cust-1',
  grandTotal: 5000,
};
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByOrderNumber: jest.fn(),
  findByCustomerId: jest.fn(),
  updateStatus: jest.fn(),
  getStatistics: jest.fn(),
};
const mockWorkflow = { transition: jest.fn(), deductInventory: jest.fn() };

let service: OrderService;

beforeEach(() => {
  service = new OrderService(mockRepo as any, mockWorkflow as any, {} as any);
  jest.clearAllMocks();
  mockRepo.findById.mockResolvedValue(mockOrder);
  mockRepo.findAll.mockResolvedValue({ data: [mockOrder], meta: { total: 1 } });
  mockRepo.findByOrderNumber.mockResolvedValue(mockOrder);
  mockRepo.findByCustomerId.mockResolvedValue({
    data: [mockOrder],
    meta: { total: 1 },
  });
  mockRepo.updateStatus.mockResolvedValue({
    ...mockOrder,
    status: 'CONFIRMED',
  });
  mockRepo.getStatistics.mockResolvedValue({
    total: 1,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 1,
    cancelled: 0,
  });
});

describe('OrderService', () => {
  it('findAll returns orders', async () => {
    const result = await service.findAll({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0].orderNumber).toBe('ORD-001');
  });

  it('findById returns order', async () => {
    const result = await service.findById('order-1');
    expect(result.id).toBe('order-1');
  });

  it('findById throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow();
  });

  it('findByOrderNumber returns order', async () => {
    const result = await service.findByOrderNumber('ORD-001');
    expect(result.orderNumber).toBe('ORD-001');
  });

  it('findByOrderNumber throws for missing', async () => {
    mockRepo.findByOrderNumber.mockResolvedValue(null);
    await expect(service.findByOrderNumber('MISSING')).rejects.toThrow();
  });

  it('findByCustomerId returns customer orders', async () => {
    const result = await service.findByCustomerId('cust-1', {});
    expect(result.data).toHaveLength(1);
  });

  it('getStatistics returns stats', async () => {
    const result = await service.getStatistics();
    expect(result.total).toBe(1);
  });

  it('updateStatus updates order status', async () => {
    await service.updateStatus('order-1', 'CONFIRMED', 'user-1');
    expect(mockWorkflow.transition).toHaveBeenCalled();
  });

  it('updateStatus throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(
      service.updateStatus('missing', 'CONFIRMED', 'user-1'),
    ).rejects.toThrow();
  });
});
