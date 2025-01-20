export interface AIResponseConfidence {
  [key: string]: number;
}

export interface AIDetailItem {
  itemCode: string;
  description: string;
  unitOfMeasure: string;
  quantity: number | string;
  grossPrice: number | string;
  discount: number | string;
  tax: number | string;
  netValue: number | string;
  confidence?: AIResponseConfidence;
}

export interface AIResponse {
  header: {
    name: string;
    taxId: string;
    date: string;
    documentNumber: string;
    confidence?: AIResponseConfidence;
  };
  details: AIDetailItem[];
}