export function createHeaderPrompt(text: string): string {
  return `Extract ONLY the header information from this document.

Document text:
${text}

Focus on finding:
- Business/Company name
- Address (if present)
- Document date (in format DD/MM/YYYY)
- Document number

Example input:
RESTAURANTE DEL CONGRESO
Almacen de Restaurante
Centro los Heroes
Santo Domingo, D.N.

CORTIZACION

Fecha: 19/11/2024
No. Documento 990

Expected output format:
{
  "header": {
    "name": "RESTAURANTE DEL CONGRESO",
    "address": "Almacen de Restaurante, Centro los Heroes, Santo Domingo, D.N.",
    "date": "19/11/2024",
    "documentNumber": "990"
  }
}

RESPOND ONLY WITH THE EXACT JSON FORMAT SHOWN - NO OTHER TEXT`;
}

export function createDetailsPrompt(text: string): string {
  return `Extract line items from this document following EXACTLY this format.

Example input:
DESCRIPCION CANTIDAD UND MEDIDA COSTO ITBS TOTAL
ACEITE DE AJONJOLI SESAME 24 FCO 12.502 $ 642.00 $ 2,773.44 $ 15,408.00
ACEITE DE OLIVA EXTRA VIRGEN 10 5 LITROS $ 5,435.00 $ 9,783.00 $ 54,350.00
ACEITE LEVAPAN* 15 CAJA 2/1 $ 2,919.00 $ 7,005.60 $ 43,785.00

CRITICAL RULES:
1. Process EVERY line item found after the header row
2. Keep ALL special characters (* or **) in descriptions
3. Remove ALL currency symbols ($ or RD$)
4. Keep EXACT unit measures as shown (FCO, LITROS, GALON, etc.)
5. Preserve ALL decimal places in numbers
6. Include EVERY item, no matter how many
7. Keep items in EXACT original order
8. Handle multi-line descriptions
9. Convert ALL numeric values to numbers
10. Keep unit measures EXACTLY as shown (e.g., "5 LITROS", "CAJA 2/1")

Expected output format:
{
  "details": [
    {
      "description": "ACEITE DE AJONJOLI SESAME",
      "quantity": 24,
      "unitOfMeasure": "FCO",
      "unitPrice": 642.00,
      "tax": 2773.44,
      "total": 15408.00
    },
    {
      "description": "ACEITE DE OLIVA EXTRA VIRGEN",
      "quantity": 10,
      "unitOfMeasure": "5 LITROS",
      "unitPrice": 5435.00,
      "tax": 9783.00,
      "total": 54350.00
    },
    {
      "description": "ACEITE LEVAPAN*",
      "quantity": 15,
      "unitOfMeasure": "CAJA 2/1",
      "unitPrice": 2919.00,
      "tax": 7005.60,
      "total": 43785.00
    }
  ]
}

Document text to process:
${text}

RESPOND ONLY WITH THE EXACT JSON FORMAT SHOWN - NO OTHER TEXT`;
}