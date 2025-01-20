export function cleanupNumericValue(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols and other non-numeric characters
    const cleaned = value
      .replace(/[^0-9.-]/g, '') // Remove everything except digits, dots, and minus
      .replace(/^\./, '0.') // Add leading zero to decimal numbers
      .replace(/\.(?=.*\.)/g, ''); // Keep only the last decimal point
    
    const number = parseFloat(cleaned);
    return isNaN(number) ? 0 : number;
  }
  
  return 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}