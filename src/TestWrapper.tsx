import React, { useState } from 'react';
import App from './App';
import { DocumentData } from './types/document';
import { formatCurrency } from './utils/numberUtils';

export function TestWrapper() {
  const [returnedData, setReturnedData] = useState<DocumentData | null>(null);

  const handleReturn = (data: DocumentData) => {
    console.log('Datos recibidos del importador:', data);
    setReturnedData(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!returnedData ? (
        <App onReturn={handleReturn} />
      ) : (
        <div className="max-w-7xl mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Datos del Documento</h2>
              <button
                onClick={() => setReturnedData(null)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Procesar Otro Documento
              </button>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información del Encabezado</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1">{returnedData.header.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">RNC/NIT</dt>
                    <dd className="mt-1">{returnedData.header.taxId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                    <dd className="mt-1">{returnedData.header.date}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Número de Documento</dt>
                    <dd className="mt-1">{returnedData.header.documentNumber}</dd>
                  </div>
                </dl>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Detalles</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Unidad</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Precio</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Desc.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Imp.</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {returnedData.details.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm">{item.itemCode}</td>
                          <td className="px-3 py-2 text-sm">{item.description}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.unitOfMeasure}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.quantity)}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.grossPrice)}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.discount)}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.tax)}</td>
                          <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.netValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={7} className="px-3 py-2 text-sm font-medium text-right">Total:</td>
                        <td className="px-3 py-2 text-sm font-medium text-right">
                          {formatCurrency(
                            returnedData.details.reduce((sum, item) => sum + item.netValue, 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Datos JSON</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                  {JSON.stringify(returnedData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}