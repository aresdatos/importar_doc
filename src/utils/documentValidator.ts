import { DocumentData } from '@/types/document';

export function validateDocumentData(data: Partial<DocumentData>): Partial<DocumentData> {
  const validatedData: Partial<DocumentData> = {
    header: data.header ? {
      name: validateString(data.header.name),
      taxId: validateTaxId(data.header.taxId),
      date: validateDate(data.header.date),
      documentNumber: validateString(data.header.documentNumber),
    } : undefined,
    details: validateDetails(data.details),
  };

  return validatedData;
}

function validateString(value: any): string {
  if (!value) return '';
  return String(value).trim();
}

function validateTaxId(value: any): string {
  if (!value) return '';
  // Remove common separators and normalize format
  return String(value)
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
}

function validateDate(value: any): string {
  if (!value) return '';
  
  // Try to parse and format the date
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return value;
  }
}

function validateDetails(details: any[] = []): DocumentData['details'] {
  if (!Array.isArray(details)) return [];

  return details.map(item => ({
    itemCode: validateString(item.itemCode),
    description: validateString(item.description),
    unitOfMeasure: validateString(item.unitOfMeasure) || 'UND',
    quantity: validateNumber(item.quantity),
    grossPrice: validateNumber(item.grossPrice),
    discount: validateNumber(item.discount),
    tax: validateNumber(item.tax),
    netValue: validateNumber(item.netValue),
  }));
}

function validateNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}