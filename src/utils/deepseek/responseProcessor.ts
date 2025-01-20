import { DocumentData } from '@/types/document';
import { cleanupNumericValue } from '../numberUtils';
import { AIResponse } from './types';

function processDetailItem(item: any): DocumentData['details'][0] | null {
  try {
    // Clean up numeric values
    const quantity = cleanupNumericValue(item.quantity);
    const unitPrice = cleanupNumericValue(item.unitPrice);
    const tax = cleanupNumericValue(item.tax);
    const total = cleanupNumericValue(item.total);

    const detail = {
      itemCode: String(item.itemCode || '').trim(),
      description: String(item.description || '')
        .trim()
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/\*+/g, '*'), // Normalize asterisks
      unitOfMeasure: String(item.unitOfMeasure || 'UND')
        .trim()
        .replace(/\s+/g, ' '), // Normalize spaces in unit measure
      quantity,
      grossPrice: unitPrice,
      discount: 0, // Not present in this format
      tax,
      netValue: total,
    };

    // Only include items that have meaningful content
    if (!detail.description || (detail.quantity === 0 && detail.grossPrice === 0 && detail.netValue === 0)) {
      return null;
    }

    return detail;
  } catch (error) {
    console.error('Error processing detail item:', error);
    return null;
  }
}

export function processAIResponse(response: AIResponse): {
  interpretedData: Partial<DocumentData>;
  confidence: number;
} {
  // Process header
  const header = {
    name: String(response.header?.name || '').trim(),
    taxId: '', // Not present in this format
    date: String(response.header?.date || '').trim(),
    documentNumber: String(response.header?.documentNumber || '').trim(),
  };

  // Process details
  const details = (response.details || [])
    .map(processDetailItem)
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item, index) => ({
      ...item,
      itemCode: item.itemCode || `ITEM${index + 1}`,
    }));

  // Calculate confidence based on field completeness
  const headerFieldCount = Object.values(header).filter(Boolean).length;
  const headerConfidence = (headerFieldCount / 3) * 100; // 3 expected fields

  const detailsConfidence = details.length > 0
    ? details.reduce((acc, item) => {
        const itemFieldCount = Object.values(item).filter(v => v !== 0 && v !== '').length;
        return acc + (itemFieldCount / 8) * 100; // 8 fields per item
      }, 0) / details.length
    : 0;

  const confidence = Math.round((headerConfidence + detailsConfidence) / 2);

  return {
    interpretedData: { header, details },
    confidence
  };
}