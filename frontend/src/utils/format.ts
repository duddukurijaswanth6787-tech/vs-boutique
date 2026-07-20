/**
 * Formats a numeric amount as currency using Intl.NumberFormat.
 * Defaults to INR (Indian Rupee) and 'en-IN' locale.
 */
export function formatMoney(amount: number, currency: string = 'INR'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  
  try {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Fallback if currency is invalid or unsupported
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats a date string or Date object into a readable date.
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date string or Date object into a readable date-time string.
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
