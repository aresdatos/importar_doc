import { DocumentData } from '@/types/document';
import { cleanupNumericValue } from '../numberUtils';
import { AIResponse, AIDetailItem } from './types';

function processDetailItem(item: AIDetailItem): DocumentData['details'][0] | null {
  try {
    // Clean up numeric values
    const quantity = cleanupNumericValue(item.quantity);
    const grossPrice = cleanupNumericValue(item.grossPrice);
    const discount = cleanupNumericValue(item.discount);
    const tax = cleanupNumericValue(item.tax);
    let netValue = cleanupNumericValue(item.netValue);

    // Recalculate net value to ensure consistency
    if (quantity > 0 && grossPrice > 0) {
      const base = quantity * grossPrice;
      const discountAmount = base * (discount / 100);
      const subtotal = base - discountAmount;
      const taxAmount = subtotal * (tax / 100);
      netValue = subtotal + taxAmount;
    }

    const detail = {
      itemCode: String(item.itemCode || '').trim(),
      description: String(item.description || '').trim(),
      unitOfMeasure: String(item.unitOfMeasure || 'UND').trim().toUpperCase(),
      quantity,
      grossPrice,
      discount,
      tax,
      netValue,
    };

    // Only include items that have meaningful content
    if (!detail.description && detail.quantity === 0 && detail.grossPrice === 0 && detail.netValue === 0) {
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
    name: String(response.header.name || '').trim(),
    taxId: String(response.header.taxId || '').replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
    date: String(response.header.date || '').trim(),
    documentNumber: String(response.header.documentNumber || '').trim(),
  };

  // Process details
  const details = response.details
    .map(processDetailItem)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Calculate confidence scores
  const headerConfidence = Object.values(response.header.confidence || {})
    .filter((score): score is number => typeof score === 'number' && score >= 0 && score <= 100);

  const detailsConfidence = response.details
    .map(d => Object.values(d.confidence || {}))
    .flat()
    .filter((score): score is number => typeof score === 'number' && score >= 0 && score <= 100);

  const allScores = [...headerConfidence, ...detailsConfidence];
  const averageConfidence = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return {
    interpretedData: { header, details },
    confidence: averageConfidence
  };
}