import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DocumentData } from '../types/document';
import { formatCurrency } from '../utils/numberUtils';

interface DataPreviewProps {
  data: DocumentData;
  onDataUpdate: (data: DocumentData) => void;
  readOnly?: boolean;
}

export function DataPreview({ data, onDataUpdate, readOnly = false }: DataPreviewProps) {
  const handleHeaderChange = (field: keyof typeof data.header, value: string) => {
    if (readOnly) return;
    onDataUpdate({
      ...data,
      header: {
        ...data.header,
        [field]: value,
      },
    });
  };

  const handleDetailChange = (index: number, field: keyof typeof data.details[0], value: string | number) => {
    if (readOnly) return;
    const newDetails = [...data.details];
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    newDetails[index] = {
      ...newDetails[index],
      [field]: numericValue,
    };

    // Recalculate net value when quantity, price, discount, or tax changes
    if (['quantity', 'grossPrice', 'discount', 'tax'].includes(field)) {
      const item = newDetails[index];
      const base = item.quantity * item.grossPrice;
      const discountAmount = base * (item.discount / 100);
      const subtotal = base - discountAmount;
      const taxAmount = subtotal * (item.tax / 100);
      newDetails[index].netValue = subtotal + taxAmount;
    }

    onDataUpdate({
      ...data,
      details: newDetails,
    });
  };

  const addNewDetail = () => {
    if (readOnly) return;
    onDataUpdate({
      ...data,
      details: [
        ...data.details,
        {
          itemCode: String(data.details.length + 1),
          description: '',
          unitOfMeasure: 'UND',
          quantity: 0,
          grossPrice: 0,
          discount: 0,
          tax: 0,
          netValue: 0,
        },
      ],
    });
  };

  const removeDetail = (index: number) => {
    if (readOnly) return;
    onDataUpdate({
      ...data,
      details: data.details.filter((_, i) => i !== index),
    });
  };

  // Calculate total net value
  const totalNetValue = data.details.reduce((sum, item) => sum + item.netValue, 0);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-700">Información del Documento</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre / Razón Social</label>
            <input
              type="text"
              value={data.header.name}
              onChange={(e) => handleHeaderChange('name', e.target.value)}
              disabled={readOnly}
              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-8 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Identificación Fiscal</label>
            <input
              type="text"
              value={data.header.taxId}
              onChange={(e) => handleHeaderChange('taxId', e.target.value)}
              disabled={readOnly}
              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-8 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input
              type="text"
              value={data.header.date}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              disabled={readOnly}
              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-8 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Número de Documento</label>
            <input
              type="text"
              value={data.header.documentNumber}
              onChange={(e) => handleHeaderChange('documentNumber', e.target.value)}
              disabled={readOnly}
              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-8 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-700">Detalles del Documento</h3>
          {!readOnly && (
            <button
              onClick={addNewDetail}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              <Plus className="w-3 h-3" />
              Agregar Ítem
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider w-24">Código</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">Descripción</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-20">Unidad</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-24">Cantidad</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-28">Precio Unit.</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-24">Descuento</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-24">Impuesto</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-wider w-28">Valor Neto</th>
                {!readOnly && <th className="px-3 py-2 w-10"></th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.details.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={item.itemCode}
                      onChange={(e) => handleDetailChange(index, 'itemCode', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleDetailChange(index, 'description', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={item.unitOfMeasure}
                      onChange={(e) => handleDetailChange(index, 'unitOfMeasure', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={formatCurrency(item.grossPrice)}
                      onChange={(e) => handleDetailChange(index, 'grossPrice', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={formatCurrency(item.discount)}
                      onChange={(e) => handleDetailChange(index, 'discount', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={formatCurrency(item.tax)}
                      onChange={(e) => handleDetailChange(index, 'tax', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={formatCurrency(item.netValue)}
                      onChange={(e) => handleDetailChange(index, 'netValue', e.target.value)}
                      disabled={readOnly}
                      className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 h-7 text-right disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-1">
                      <button
                        onClick={() => removeDetail(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={7} className="px-3 py-2 text-sm font-medium text-right">Total:</td>
                <td className="px-3 py-2 text-sm font-medium text-right">
                  {formatCurrency(totalNetValue)}
                </td>
                {!readOnly && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}