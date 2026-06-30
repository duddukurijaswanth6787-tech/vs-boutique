function parseDecimal(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

function parseDecimalOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

module.exports = { parseDecimal, parseDecimalOrNull };
