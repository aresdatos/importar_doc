import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import { ZoomIn, ZoomOut, Crosshair, Check, RotateCw } from 'lucide-react';
import { Zone } from '../types/document';
import { pdfjs } from 'react-pdf';

// Configure worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  onZoneSelect: (zone: Zone, type: 'header' | 'details') => void;
  onClose: () => void;
}

export function PDFViewer({ file, onZoneSelect, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionType, setSelectionType] = useState<'header' | 'details'>('header');
  const [selection, setSelection] = useState<{ start: { x: number; y: number } | null; end: { x: number; y: number } | null }>({
    start: null,
    end: null,
  });
  const [selectedZones, setSelectedZones] = useState<{
    header?: Zone;
    details?: Zone;
  }>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const getRelativeCoordinates = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !pdfRef.current) return { x: 0, y: 0 };
    
    const pdfRect = pdfRef.current.getBoundingClientRect();
    const x = (e.clientX - pdfRect.left) / scale;
    const y = (e.clientY - pdfRect.top) / scale;
    
    // Adjust coordinates based on rotation
    if (rotation === 90) {
      return { x: y, y: pdfRect.width / scale - x };
    } else if (rotation === 180) {
      return { x: pdfRect.width / scale - x, y: pdfRect.height / scale - y };
    } else if (rotation === 270) {
      return { x: pdfRect.height / scale - y, y: x };
    }
    
    return { x, y };
  }, [scale, rotation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelecting) return;
    e.preventDefault();
    const coords = getRelativeCoordinates(e);
    setSelection({
      start: coords,
      end: null,
    });
  }, [isSelecting, getRelativeCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selection.start) return;
    e.preventDefault();
    const coords = getRelativeCoordinates(e);
    setSelection(prev => ({
      ...prev,
      end: coords,
    }));
  }, [isSelecting, selection.start, getRelativeCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selection.start || !selection.end) return;
    
    const zone: Zone = {
      x: Math.min(selection.start.x, selection.end.x),
      y: Math.min(selection.start.y, selection.end.y),
      width: Math.abs(selection.end.x - selection.start.x),
      height: Math.abs(selection.end.y - selection.start.y),
    };

    setSelectedZones(prev => ({
      ...prev,
      [selectionType]: zone
    }));

    setIsSelecting(false);
    setSelection({ start: null, end: null });
  }, [isSelecting, selection, selectionType]);

  const applySelections = async () => {
    if (selectedZones.header) {
      await onZoneSelect(selectedZones.header, 'header');
    }
    if (selectedZones.details) {
      const adjustedZone = {
        ...selectedZones.details,
        height: selectedZones.details.height * 1.2 // Increase height by 20%
      };
      await onZoneSelect(adjustedZone, 'details');
    }
    onClose();
  };

  return (
    <div className="relative border rounded-lg p-4 bg-white shadow-lg">
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setScale(s => s + 0.1)}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
          title="Aumentar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
          title="Reducir"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => setRotation(r => (r + 90) % 360)}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
          title="Rotar"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setIsSelecting(true);
            setSelectionType('header');
          }}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            isSelecting && selectionType === 'header'
              ? 'bg-blue-500 text-white'
              : selectedZones.header
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          Seleccionar Encabezado
        </button>
        <button
          onClick={() => {
            setIsSelecting(true);
            setSelectionType('details');
          }}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            isSelecting && selectionType === 'details'
              ? 'bg-orange-500 text-white'
              : selectedZones.details
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          Seleccionar Detalles
        </button>
        {(selectedZones.header || selectedZones.details) && (
          <button
            onClick={applySelections}
            className="px-4 py-2 rounded flex items-center gap-2 bg-green-500 text-white hover:bg-green-600 ml-auto"
          >
            <Check className="w-4 h-4" />
            Aplicar Selecciones
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative ${isSelecting ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isSelecting) {
            setSelection({ start: null, end: null });
          }
        }}
      >
        <div ref={pdfRef} className="select-none">
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-[600px] text-red-500">
                Error al cargar el PDF. Por favor, verifique que el archivo sea válido.
              </div>
            }
          >
            <Page
              pageNumber={1}
              scale={scale}
              rotate={rotation}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              height={600}
              className="shadow-lg"
            />
          </Document>
        </div>

        {selection.start && selection.end && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selection.start.x, selection.end.x) * scale,
              top: Math.min(selection.start.y, selection.end.y) * scale,
              width: Math.abs(selection.end.x - selection.start.x) * scale,
              height: Math.abs(selection.end.y - selection.start.y) * scale,
              border: `2px solid ${selectionType === 'header' ? '#3b82f6' : '#f97316'}`,
              backgroundColor: selectionType === 'header' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
              pointerEvents: 'none',
              transition: 'all 0.1s ease-out',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'top left',
            }}
          />
        )}

        {selectedZones.header && (
          <div
            style={{
              position: 'absolute',
              left: selectedZones.header.x * scale,
              top: selectedZones.header.y * scale,
              width: selectedZones.header.width * scale,
              height: selectedZones.header.height * scale,
              border: '2px solid #3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'top left',
            }}
          />
        )}

        {selectedZones.details && (
          <div
            style={{
              position: 'absolute',
              left: selectedZones.details.x * scale,
              top: selectedZones.details.y * scale,
              width: selectedZones.details.width * scale,
              height: selectedZones.details.height * scale,
              border: '2px solid #f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              pointerEvents: 'none',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'top left',
            }}
          />
        )}
      </div>
    </div>
  );
}