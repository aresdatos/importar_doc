import { HeaderData } from '@/types/document';

const PATTERNS = {
  name: [
    /razon\s*social\s*:\s*([^\n]+)/i,
    /cliente\s*:\s*([^\n]+)/i,
    /nombre\s*:\s*([^\n]+)/i,
    /empresa\s*:\s*([^\n]+)/i,
    /destinatario\s*:\s*([^\n]+)/i,
  ],
  taxId: [
    /(?:ruc|nit|rif|cuit|cnpj|rut|rnc|nif|cif|tax\s*id)\s*:?\s*([\w\d-]+)/i,
    /(?:identificacion|identificación)\s*fiscal\s*:?\s*([\w\d-]+)/i,
    /\b(?:[A-Z]{1,2}-)?(?:\d{2}\.?){3}-\d{1}\b/, // Common tax ID formats
    /\b[A-Z]?\d{9,11}\b/, // Basic number-only formats
  ],
  date: [
    /fecha\s*(?:de\s*emision)?\s*:\s*([^\n]+)/i,
    /emitido\s*(?:el)?\s*:\s*([^\n]+)/i,
    /date\s*:\s*([^\n]+)/i,
    /\b\d{2}[-/.]\d{2}[-/.]\d{4}\b/,
  ],
  documentNumber: [
    /(?:factura|documento|comprobante|nota)\s*(?:nro|num|número|no|#)?\s*:\s*([^\n]+)/i,
    /nro\s*(?:de)?\s*(?:factura|documento|comprobante)\s*:\s*([^\n]+)/i,
    /invoice\s*(?:no|number|#)?\s*:\s*([^\n]+)/i,
    /\b(?:FAC|DOC|INV)-?\d{5,}\b/i,
    /\b[A-Z]\d{3}-\d{6,}\b/,
  ],
};

function findMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  return '';
}

export function parseHeaderData(text: string): HeaderData {
  const lines = text.split('\n').map(line => line.trim());
  
  const header: HeaderData = {
    name: findMatch(text, PATTERNS.name),
    taxId: findMatch(text, PATTERNS.taxId),
    date: findMatch(text, PATTERNS.date),
    documentNumber: findMatch(text, PATTERNS.documentNumber),
  };

  // If patterns didn't find matches, try to extract from first lines
  if (!header.name && lines.length > 0) {
    header.name = lines[0];
  }

  if (!header.taxId) {
    // Look for tax ID pattern in first 5 lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const match = findMatch(lines[i], PATTERNS.taxId);
      if (match) {
        header.taxId = match;
        break;
      }
    }
  }

  return header;
}