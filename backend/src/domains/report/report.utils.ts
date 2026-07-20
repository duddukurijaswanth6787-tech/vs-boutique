export function convertToCsv(type: string, data: any): string {
  if (type === 'SALES') {
    const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt\n';
    const rows = (data.orders || [])
      .map(
        (o: any) =>
          `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}"`,
      )
      .join('\n');
    return headers + rows;
  }
  if (type === 'INVENTORY') {
    const headers =
      'InventoryId,SKU,Product,Quantity,ReservedQuantity,StockStatus\n';
    const rows = (data.items || [])
      .map(
        (i: any) =>
          `"${i.id}","${i.variant?.sku || ''}","${i.variant?.product?.name || ''}",${i.quantity},${i.reservedQuantity},"${i.stockStatus}"`,
      )
      .join('\n');
    return headers + rows;
  }
  if (type === 'CUSTOMER') {
    const headers =
      'CustomerId,FirstName,LastName,Email,Phone,Gender,OrderCount,TotalSpent\n';
    const rows = (data.customers || [])
      .map(
        (c: any) =>
          `"${c.id}","${c.user?.firstName || ''}","${c.user?.lastName || ''}","${c.user?.email || ''}","${c.phone || ''}","${c.gender || ''}",${c.orderCount},${c.totalSpent}`,
      )
      .join('\n');
    return headers + rows;
  }
  if (type === 'ORDER') {
    const headers =
      'OrderId,OrderNumber,GrandTotal,Status,CreatedAt,ItemsCount\n';
    const rows = (data.orders || [])
      .map(
        (o: any) =>
          `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}",${o.items?.length || 0}`,
      )
      .join('\n');
    return headers + rows;
  }
  if (type === 'PAYMENT') {
    const headers = 'PaymentId,OrderNumber,Method,Status,Amount,CreatedAt\n';
    const rows = (data.payments || [])
      .map(
        (p: any) =>
          `"${p.id}","${p.order?.orderNumber || ''}","${p.method}","${p.status}",${p.amount},"${p.createdAt.toISOString ? p.createdAt.toISOString() : p.createdAt}"`,
      )
      .join('\n');
    return headers + rows;
  }
  return 'No data';
}
