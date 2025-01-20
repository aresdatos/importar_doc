import { DetailItem } from '@/types/document';

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

function parseNumber(value: string): number {
  // Remove currency symbols, commas, and extra spaces, keep decimal points
  const cleaned = value.replace(/[^\d.-]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
}

function isNumericWithCurrency(str: string): boolean {
  // Match numbers with optional currency symbols, commas, and decimals
  return /^[\s$]*\d+(?:,\d{3})*(?:\.\d{2})?[\s$]*$/.test(str.replace(/[$,]/g, ''));
}

export function parseTableData(text: string): DetailItem[] {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Find the start of the details section
  const detailsStartIndex = lines.findIndex(line => 
    /\b(?:DESCRIPCION|DESCRIPCIÓN|DETALLE|MATERIAL|PRODUCTO)\b/i.test(line)
  );

  if (detailsStartIndex === -1) return [];

  // Skip header line and start processing from the next line
  const detailLines = lines.slice(detailsStartIndex + 1);
  const details: DetailItem[] = [];
  let currentItem: DetailItem | null = null;
  let descriptionParts: string[] = [];

  for (const line of detailLines) {
    // Skip empty lines and header-like lines
    if (!line.trim() || /^(?:DESCRIPCION|CANTIDAD|UND|MEDIDA|COSTO|ITBS|TOTAL)\s*$/i.test(line)) {
      continue;
    }

    // Split line by any whitespace
    const parts = line.split(/\s+/).filter(Boolean);
    
    // Find numeric values (including those with currency symbols)
    const numericParts = parts.filter(part => isNumericWithCurrency(part.replace(/[$,]/g, '')));
    const numbers = numericParts.map(parseNumber);

    // If we have numbers, it's likely a new item line
    if (numbers.length >= 2) {
      // Save previous item if exists
      if (currentItem && descriptionParts.length > 0) {
        currentItem.description = descriptionParts.join(' ').trim();
        if (currentItem.description && (currentItem.quantity > 0 || currentItem.grossPrice > 0)) {
          details.push(currentItem);
        }
      }

      // Start new item
      currentItem = createEmptyDetail();
      descriptionParts = [];

      // Find where numbers start in the parts array
      const firstNumberIndex = parts.findIndex(part => 
        isNumericWithCurrency(part.replace(/[$,]/g, ''))
      );

      // Everything before the first number is description
      if (firstNumberIndex > 0) {
        descriptionParts = [parts.slice(0, firstNumberIndex).join(' ')];
      }

      // Map numbers to fields based on position and context
      let quantityFound = false;
      let priceFound = false;

      parts.forEach((part, index) => {
        const num = parseNumber(part);
        if (num === 0) return;

        // Look at the next part for unit hints
        const nextPart = parts[index + 1]?.toLowerCase() || '';
        const prevPart = parts[index - 1]?.toLowerCase() || '';

        if (!quantityFound && (
          nextPart.includes('und') || 
          nextPart.includes('pcs') || 
          nextPart.includes('unid') ||
          prevPart.includes('cant') ||
          prevPart.includes('qty')
        )) {
          currentItem!.quantity = num;
          quantityFound = true;
        } else if (!priceFound && (
          nextPart.includes('$') || 
          part.includes('$') ||
          prevPart.includes('precio') ||
          prevPart.includes('cost')
        )) {
          currentItem!.grossPrice = num;
          priceFound = true;
        } else if (part.includes('%') || nextPart.includes('tax') || nextPart.includes('itbis')) {
          currentItem!.tax = num;
        } else if (!quantityFound) {
          currentItem!.quantity = num;
          quantityFound = true;
        } else if (!priceFound) {
          currentItem!.grossPrice = num;
          priceFound = true;
        } else {
          currentItem!.netValue = num;
        }
      });
    } else if (currentItem) {
      // This line is part of the current item's description
      descriptionParts.push(line);
    }
  }

  // Don't forget the last item
  if (currentItem && descriptionParts.length > 0) {
    currentItem.description = descriptionParts.join(' ').trim();
    if (currentItem.description && (currentItem.quantity > 0 || currentItem.grossPrice > 0)) {
      details.push(currentItem);
    }
  }

  // Clean up and validate items
  return details.map((item, index) => ({
    ...item,
    itemCode: item.itemCode || `ITEM${index + 1}`,
    description: item.description
      .replace(/\s+/g, ' ')
      .trim(),
    // Calculate net value if missing
    netValue: item.netValue || (
      item.quantity * item.grossPrice * (1 + item.tax/100)
    ),
  }));
}