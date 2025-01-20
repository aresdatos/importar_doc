export function createHeaderPrompt(text: string): string {
  return `Extract ONLY the header information from this document.

Document text:
${text}

Focus on finding:
- Business/Company name or Person name
- Tax ID/RNC/RUC/NIT (REQUIRED) - Look for patterns like:
  * RNC: XX-XXXXXXX-X
  * RUC: XXXXXXXXXXX
  * NIT: XXX-XXXXXX-XXX
  * Tax ID: XXXXXXXXXX
  * Identificación Fiscal: XXXXXXXXXX
- Document date
- Document number/reference

Guidelines:
- ALWAYS look for Tax ID in various formats and positions
- Try multiple variations of field names
- Convert dates to YYYY-MM-DD format when possible
- Include confidence scores for each field

RESPOND ONLY WITH THIS EXACT JSON - NO OTHER TEXT:
{
  "header": {
    "name": "extracted name",
    "taxId": "extracted tax ID",
    "date": "extracted date",
    "documentNumber": "extracted document number",
    "confidence": {
      "name": 0-100,
      "taxId": 0-100,
      "date": 0-100,
      "documentNumber": 0-100
    }
  }
}`;
}

export function createDetailsPrompt(text: string): string {
  return `Extract line items from this document following EXACTLY this format:

For each item, extract:
1. Description: Full product name including any marks (* or **)
2. Quantity: Numeric value only
3. Unit Measure: Original unit text (FCO, LITROS, GALON, etc.)
4. Unit Price: Numeric value without currency symbols
5. ITBS (Tax): Numeric value without currency symbols
6. Total: Numeric value without currency symbols

CRITICAL RULES:
- Remove ALL currency symbols ($ or RD$)
- Keep original unit measures exactly as shown
- Preserve asterisk marks (* or **) in descriptions
- Keep all decimal places in numbers
- Include ALL items found in the document
- Maintain exact order of items
- Keep original spacing in descriptions

Example input format:
DESCRIPCION   CANTIDAD   UND MEDIDA   COSTO   ITBS   TOTAL
ACEITE DE AJONJOLI SESAME   24   FCO 12.5OZ   642.00 $   2,773.44 $   15,408.00 $

Example output format:
{
  "details": [
    {
      "itemCode": "ITEM1",
      "description": "ACEITE DE AJONJOLI SESAME",
      "unitOfMeasure": "FCO 12.5OZ",
      "quantity": 24,
      "grossPrice": 642.00,
      "discount": 0,
      "tax": 2773.44,
      "netValue": 15408.00
    }
  ]
}

Document text to process:
${text}

RESPOND ONLY WITH THE EXACT JSON FORMAT SHOWN - NO OTHER TEXT`;
}