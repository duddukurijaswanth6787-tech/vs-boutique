const prisma = require('../../../utils/prisma');

class OrdersRepository {
  async findMany(where, include, orderBy) {
    return prisma.order.findMany({
      where,
      include,
      orderBy
    });
  }

  async findUnique(id, include) {
    return prisma.order.findUnique({
      where: { id },
      include
    });
  }

  async findFirst(where, include, orderBy) {
    return prisma.order.findFirst({
      where,
      include,
      orderBy
    });
  }

  async create(data, include, tx = prisma) {
    return tx.order.create({
      data,
      include
    });
  }

  async update(id, data, include, tx = prisma) {
    return tx.order.update({
      where: { id },
      data,
      include
    });
  }

  async createHistory(data, tx = prisma) {
    return tx.orderHistory.create({
      data
    });
  }

  async getNextVal(tx = prisma) {
    const [{ nextval }] = await tx.$queryRaw`SELECT nextval('order_id_seq')::int`;
    return nextval;
  }
}

module.exports = new OrdersRepository();
