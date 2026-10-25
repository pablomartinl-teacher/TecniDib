/**
 * Margin and Normalized Title Block (Cajetín UNE 1035 / ISO 5457) Generator
 */

import React, { useState } from 'react';
import { CadEntity, SheetSize, EntityStyle } from '../cad/types.ts';
import { X, Check, Square, FileText } from 'lucide-react';

interface MarginModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetSize: SheetSize;
  currentStyle: EntityStyle;
  onApplyMargins: (newEntities: CadEntity[]) => void;
}

export const MarginModal: React.FC<MarginModalProps> = ({
  isOpen,
  onClose,
  sheetSize,
  currentStyle,
  onApplyMargins,
}) => {
  const [mode, setMode] = useState<'standard' | 'cajetin' | 'custom'>('cajetin');
  const [leftMargin, setLeftMargin] = useState(25); // UNE standard 25mm for archiving
  const [otherMargins, setOtherMargins] = useState(5); // 5mm for A4/A3
  const [author, setAuthor] = useState('Alumno/a');
  const [title, setTitle] = useState('Lámina de Geometría');
  const [scale, setScale] = useState('1:1');
  const [course, setCourse] = useState('Educación Plástica y Visual');

  if (!isOpen) return null;

  const handleApply = () => {
    const entities: CadEntity[] = [];
    const t = Date.now();
    const borderStyle: EntityStyle = {
      ...currentStyle,
      width: Math.max(0.6, currentStyle.width),
      color: '#000000',
      dash: 'none',
      marker: 'none',
    };
    const thinStyle: EntityStyle = {
      ...currentStyle,
      width: 0.3,
      color: '#000000',
      dash: 'none',
      marker: 'none',
    };

    // Calculate outer margin box
    const x1 = leftMargin;
    const y1 = otherMargins;
    const x2 = sheetSize.w - otherMargins;
    const y2 = sheetSize.h - otherMargins;

    // 4 border lines
    entities.push(
      { type: 'line', id: t + 1, x1, y1, x2, y2: y1, layer: 'solucion', style: borderStyle },
      { type: 'line', id: t + 2, x1: x2, y1, x2, y2, layer: 'solucion', style: borderStyle },
      { type: 'line', id: t + 3, x1: x2, y1: y2, x2: x1, y2, layer: 'solucion', style: borderStyle },
      { type: 'line', id: t + 4, x1, y1: y2, x2: x1, y2: y1, layer: 'solucion', style: borderStyle }
    );

    // If Cajetín requested (standard technical title box in bottom right corner)
    if (mode === 'cajetin') {
      const cW = 140; // 140mm wide cajetín
      const cH = 32; // 32mm tall cajetín
      const cX = x2 - cW;
      const cY = y2 - cH;

      // Top boundary of cajetín
      entities.push({
        type: 'line',
        id: t + 10,
        x1: cX,
        y1: cY,
        x2,
        y2: cY,
        layer: 'solucion',
        style: borderStyle,
      });
      // Left boundary of cajetín
      entities.push({
        type: 'line',
        id: t + 11,
        x1: cX,
        y1: cY,
        x2: cX,
        y2,
        layer: 'solucion',
        style: borderStyle,
      });

      // Internal dividing lines
      entities.push({
        type: 'line',
        id: t + 12,
        x1: cX,
        y1: cY + 12,
        x2,
        y2: cY + 12,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'line',
        id: t + 13,
        x1: cX,
        y1: cY + 22,
        x2,
        y2: cY + 22,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'line',
        id: t + 14,
        x1: cX + 80,
        y1: cY + 12,
        x2: cX + 80,
        y2,
        layer: 'solucion',
        style: thinStyle,
      });

      // Text labels inside cajetín
      const dateStr = new Date().toLocaleDateString('es-ES');
      entities.push({
        type: 'tag',
        id: t + 20,
        x: cX + 4,
        y: cY + 8,
        text: `TÍTULO: ${title.toUpperCase()}`,
        angle: 0,
        fontSize: 4,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'tag',
        id: t + 21,
        x: cX + 4,
        y: cY + 18,
        text: `ALUMNO/A: ${author}`,
        angle: 0,
        fontSize: 3.5,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'tag',
        id: t + 22,
        x: cX + 84,
        y: cY + 18,
        text: `CURSO: ${course}`,
        angle: 0,
        fontSize: 3.2,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'tag',
        id: t + 23,
        x: cX + 4,
        y: cY + 28,
        text: `FECHA: ${dateStr}`,
        angle: 0,
        fontSize: 3.2,
        layer: 'solucion',
        style: thinStyle,
      });
      entities.push({
        type: 'tag',
        id: t + 24,
        x: cX + 84,
        y: cY + 28,
        text: `ESCALA: ${scale}`,
        angle: 0,
        fontSize: 3.5,
        layer: 'solucion',
        style: thinStyle,
      });
    }

    onApplyMargins(entities);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2026] border border-[#363a45] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d313b]">
          <div className="flex items-center gap-2">
            <Square className="w-5 h-5 text-sky-400" />
            <h2 className="font-semibold text-white">Márgenes y Cajetín Normalizados (UNE / ISO)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-[#2c303a] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 bg-[#14151a] p-1.5 rounded-xl">
            <button
              onClick={() => setMode('cajetin')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                mode === 'cajetin' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Con Cajetín
            </button>
            <button
              onClick={() => setMode('standard')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                mode === 'standard' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Square className="w-4 h-4" />
              Solo Marco UNE
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition flex flex-col items-center gap-1 ${
                mode === 'custom' ? 'bg-sky-600 text-white shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Personalizado
            </button>
          </div>

          <div className="bg-[#242730] p-3 rounded-xl flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">Margen Izquierdo (archivador):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={leftMargin}
                  onChange={(e) => setLeftMargin(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#16171d] border border-[#3d4250] rounded px-2 py-1 text-right text-white font-mono"
                />
                <span className="text-neutral-400">mm</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-neutral-300">Márgenes Superior, Derecho e Inferior:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={otherMargins}
                  onChange={(e) => setOtherMargins(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#16171d] border border-[#3d4250] rounded px-2 py-1 text-right text-white font-mono"
                />
                <span className="text-neutral-400">mm</span>
              </div>
            </div>
          </div>

          {mode === 'cajetin' && (
            <div className="bg-[#242730] p-3 rounded-xl flex flex-col gap-2.5 text-xs">
              <h4 className="font-semibold text-sky-400">Datos del Cajetín de Rotulación (UNE 1035)</h4>
              <div className="flex flex-col gap-1">
                <label className="text-neutral-400">Título de la Lámina:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#16171d] border border-[#3d4250] rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400">Nombre Alumno/a:</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="bg-[#16171d] border border-[#3d4250] rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-neutral-400">Escala:</label>
                  <input
                    type="text"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="bg-[#16171d] border border-[#3d4250] rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-neutral-400">Curso / Asignatura:</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="bg-[#16171d] border border-[#3d4250] rounded px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#2d313b] bg-[#17181f]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-[#2c303a] transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow transition"
          >
            <Check className="w-4 h-4" />
            Trazar en la Lámina
          </button>
        </div>
      </div>
    </div>
  );
};
