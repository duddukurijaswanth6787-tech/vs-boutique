import { InventoryService } from './inventory.service';

const mockInv = {
  id: 'inv-1',
  variantId: 'var-1',
  warehouseId: 'wh-1',
  quantity: 100,
  reservedQuantity: 10,
  availableQuantity: 90,
};
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByVariantId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStock: jest.fn(),
  createMovement: jest.fn(),
  findMovements: jest.fn(),
  getStockSummary: jest.fn(),
};
const mockAudit = { log: jest.fn() };
const mockEventEmitter = { emit: jest.fn() };

let service: InventoryService;

beforeEach(() => {
  service = new InventoryService(
    mockRepo as any,
    mockAudit as any,
    mockEventEmitter as any,
  );
  jest.clearAllMocks();
  mockRepo.findById.mockResolvedValue(mockInv);
  mockRepo.findAll.mockResolvedValue({ data: [mockInv], meta: { total: 1 } });
  mockRepo.updateStock.mockResolvedValue({ ...mockInv, quantity: 110 });
  mockRepo.createMovement.mockResolvedValue({ id: 'mov-1' });
  mockAudit.log.mockResolvedValue(undefined);
  mockRepo.findMovements.mockResolvedValue({ data: [], meta: { total: 0 } });
});

describe('InventoryService', () => {
  it('findAll returns inventory', async () => {
    const result = await service.findAll({});
    expect(result.data).toHaveLength(1);
  });

  it('findById returns item', async () => {
    const result = await service.findById('inv-1');
    expect(result.id).toBe('inv-1');
  });

  it('findById throws for missing', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow();
  });

  it('increaseStock increases quantity', async () => {
    await service.increaseStock(
      'inv-1',
      { quantity: 20, reason: 'restock' },
      'user-1',
    );
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('decreaseStock decreases quantity', async () => {
    await service.decreaseStock(
      'inv-1',
      { quantity: 20, reason: 'sale' },
      'user-1',
    );
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('decreaseStock rejects insufficient stock', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockInv, availableQuantity: 5 });
    await expect(
      service.decreaseStock(
        'inv-1',
        { quantity: 10, reason: 'sale' } as any,
        'user-1',
      ),
    ).rejects.toThrow();
  });

  it('reserveStock reserves for order', async () => {
    await service.reserveStock(
      'inv-1',
      { quantity: 10, reason: 'order' },
      'user-1',
    );
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('releaseStock releases reserved', async () => {
    await service.releaseStock(
      'inv-1',
      { quantity: 10, reason: 'cancel' },
      'user-1',
    );
    expect(mockAudit.log).toHaveBeenCalled();
  });

  it('findMovements returns movements', async () => {
    const result = await service.findMovements({});
    expect(result.data).toHaveLength(0);
  });
});
