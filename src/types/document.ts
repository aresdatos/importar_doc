export interface HeaderData {
  name: string;
  date: string;
  documentNumber: string;
  taxId: string;
}

export interface DetailItem {
  itemCode: string;
  description: string;
  unitOfMeasure: string;
  quantity: number;
  grossPrice: number;
  discount: number;
  tax: number;
  netValue: number;
}

export interface DocumentData {
  header: HeaderData;
  details: DetailItem[];
}

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
}