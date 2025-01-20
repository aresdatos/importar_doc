import { DetailItem } from '@/types/document';

interface ColumnInfo {
  type: keyof DetailItem;
  index: number;
  pattern: RegExp;
}

const COLUMN_PATTERNS: Record<keyof DetailItem, RegExp[]> = {
  itemCode: [
    /^(?:cod|codigo|referencia|ref|sku|no\.|art|ítem)/i,
    /\b(?:cod|codigo|ref)\b/i,
  ],
  description: [
    /^(?:desc|descripcion|detalle|concepto|producto|articulo|item|mercaderia)/i,
    /\b(?:desc|producto)\b/i,
  ],
  unitOfMeasure: [
    /^(?:um|u\.m\.|unidad|medida|umed)/i,
    /\b(?:um|und)\b/i,
  ],
  quantity: [
    /^(?:qty|cant|cantidad|unidades|piezas|uds|pzas)/i,
    /\b(?:qty|cant)\b/i,
  ],
  grossPrice: [
    /^(?:precio|monto|valor|importe|p\.u\.|prec|costo|tarifa)/i,
    /\b(?:precio|p\.u\.)\b/i,
  ],
  discount: [
    /^(?:desc|descuento|rebaja|bonif|dcto)/i,
    /\b(?:desc|dcto)\b/i,
  ],
  tax: [
    /^(?:tax|vat|iva|igv|impuesto|imp|tributo)/i,
    /\b(?:iva|tax)\b/i,
  ],
  netValue: [
    /^(?:total|neto|importe|subtotal|monto|valor|suma)/i,
    /\b(?:total|neto)\b/i,
  ],
};

function identifyColumns(lines: string[]): ColumnInfo[] {
  const columns: ColumnInfo[] = [];
  let headerLine = '';

  // Find the most likely header line by checking pattern matches
  for (const line of lines) {
    let matches = 0;
    for (const patterns of Object.values(COLUMN_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(line))) {
        matches++;
      }
    }
    if (matches > (headerLine ? countPatternMatches(headerLine) : 0)) {
      headerLine = line;
    }
  }

  if (!headerLine) return [];

  // Split by any whitespace or common separators
  const parts = headerLine.split(/[\s|;,]+/).filter(Boolean);
  
  parts.forEach((part, index) => {
    for (const [type, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(part))) {
        columns.push({
          type: type as keyof DetailItem,
          index,
          pattern: patterns[0],
        });
        break;
      }
    }
  });

  return columns;
}

function countPatternMatches(line: string): number {
  let count = 0;
  for (const patterns of Object.values(COLUMN_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(line))) {
      count++;
    }
  }
  return count;
}

function parseNumber(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
}

function createEmptyDetail(): DetailItem {
  return {
    itemCode: '',
    description: '',
    unitOfMeasure: 'UND',
    quantity: 0,
    grossPrice: 0,
    discount: 0,
    tax: 0,
    netValue: 0,
  };
}

function isNumeric(str: string): boolean {
  return /^-?\d*\.?\d+$/.test(str.replace(/[,$]/g, ''));
}

export function parseTableData(text: string): DetailItem[] {
  // Split into lines and clean up
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [createEmptyDetail()];

  // Identify columns from all potential header lines
  const columns = identifyColumns(lines);
  if (columns.length === 0) return [createEmptyDetail()];

  // Find the header line index
  const headerIndex = lines.findIndex(line => 
    columns.every(col => 
      line.split(/[\s|;,]+/).length >= col.index
    )
  );

  if (headerIndex === -1) return [createEmptyDetail()];

  const details: DetailItem[] = [];
  let currentDetail: DetailItem | null = null;

  // Process each line after the header
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and likely headers
    if (!line.trim() || countPatternMatches(line) > 2) continue;

    // Split line by any whitespace or common separators, preserving quoted strings
    const parts = line.match(/(?:[^\s"|;,]+|"[^"]*")+/g) || [];
    
    // If we have very few parts, it might be a continuation of the previous description
    if (parts.length < 3 && currentDetail) {
      currentDetail.description += ' ' + line.trim();
      continue;
    }

    currentDetail = createEmptyDetail();
    let descriptionParts: string[] = [];
    let lastNumericIndex = -1;

    // Process each part of the line
    parts.forEach((part, index) => {
      const cleanPart = part.replace(/"/g, '').trim();
      
      // Check if this part matches any column
      const column = columns.find(col => col.index === index);
      
      if (column) {
        switch (column.type) {
          case 'itemCode':
            currentDetail!.itemCode = cleanPart;
            break;
          case 'description':
            descriptionParts.push(cleanPart);
            break;
          case 'unitOfMeasure':
            currentDetail!.unitOfMeasure = cleanPart || 'UND';
            break;
          case 'quantity':
            currentDetail!.quantity = parseNumber(cleanPart);
            lastNumericIndex = index;
            break;
          case 'grossPrice':
            currentDetail!.grossPrice = parseNumber(cleanPart);
            lastNumericIndex = index;
            break;
          case 'discount':
            currentDetail!.discount = parseNumber(cleanPart);
            lastNumericIndex = index;
            break;
          case 'tax':
            currentDetail!.tax = parseNumber(cleanPart);
            lastNumericIndex = index;
            break;
          case 'netValue':
            currentDetail!.netValue = parseNumber(cleanPart);
            lastNumericIndex = index;
            break;
        }
      } else if (isNumeric(cleanPart) && index > lastNumericIndex) {
        // If it's a number and comes after our last known numeric column,
        // try to assign it to the next expected numeric field
        if (currentDetail!.quantity === 0) currentDetail!.quantity = parseNumber(cleanPart);
        else if (currentDetail!.grossPrice === 0) currentDetail!.grossPrice = parseNumber(cleanPart);
        else if (currentDetail!.discount === 0) currentDetail!.discount = parseNumber(cleanPart);
        else if (currentDetail!.tax === 0) currentDetail!.tax = parseNumber(cleanPart);
        else if (currentDetail!.netValue === 0) currentDetail!.netValue = parseNumber(cleanPart);
        lastNumericIndex = index;
      } else if (index < columns[0]?.index || index < lastNumericIndex) {
        // If this part comes before any numeric columns, it's probably part of the description
        descriptionParts.push(cleanPart);
      }
    });

    if (descriptionParts.length > 0) {
      currentDetail.description = descriptionParts.join(' ').trim();
    }

    // Calculate net value if missing but we have quantity and price
    if (currentDetail.netValue === 0 && currentDetail.quantity > 0 && currentDetail.grossPrice > 0) {
      const subtotal = currentDetail.quantity * currentDetail.grossPrice;
      const discountAmount = subtotal * (currentDetail.discount / 100);
      const taxAmount = (subtotal - discountAmount) * (currentDetail.tax / 100);
      currentDetail.netValue = subtotal - discountAmount + taxAmount;
    }

    // Only add the detail if it has either a description or some numeric values
    if (currentDetail.description || currentDetail.quantity > 0 || currentDetail.grossPrice > 0) {
      details.push(currentDetail);
    }
  }

  return details.length > 0 ? details : [createEmptyDetail()];
}