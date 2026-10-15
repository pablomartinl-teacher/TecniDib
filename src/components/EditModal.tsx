/**
 * Entity Property Inspector & Editor Modal
 */

import React, { useState, useEffect } from 'react';
import { CadEntity, DashStyle, SymbolType } from '../cad/types.ts';
import { X, Check, Trash2, Sliders } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: CadEntity | null;
  onUpdateEntity: (updated: CadEntity) => void;
  onDeleteEntity: (id: number) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  entity,
  onUpdateEntity,
  onDeleteEntity,
}) => {
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [width, setWidth] = useState(0.5);
  const [dash, setDash] = useState<DashStyle>('none');
  const [tagText, setTagText] = useState('');
  const [tagFontSize, setTagFontSize] = useState(4);
  const [imageWidth, setImageWidth] = useState(50);
  const [symbolType, setSymbolType] = useState<SymbolType>('perp');

  useEffect(() => {
    if (!entity) return;
    setColor(entity.style?.color || '#000000');
    setFillColor(entity.style?.fillColor || '#ffffff');
    setWidth(entity.style?.width || 0.5);
    setDash(entity.style?.dash || 'none');

    if (entity.type === 'tag') {
      setTagText(entity.text);
      setTagFontSize(entity.fontSize || 4);
    } else if (entity.type === 'image') {
      setImageWidth(entity.width);
    } else if (entity.type === 'symbol') {
      setSymbolType(entity.symbolType || 'perp');
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSave = () => {
    const updated = { ...entity };
    updated.style = {
      ...updated.style,
      color,
      fillColor,
      width,
      dash,
    };

    if (updated.type === 'tag') {
      updated.text = tagText;
      updated.fontSize = tagFontSize;
    } else if (updated.type === 'image') {
      const ratio = updated.height / updated.width;
      updated.width = imageWidth;
      updated.height = imageWidth * ratio;
    } else if (updated.type === 'symbol') {
      updated.symbolType = symbolType;
    }

    onUpdateEntity(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2026] border border-[#353945] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-neutral-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2d313b]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-white text-sm">Propiedades del Elemento</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-[#2c303a] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 text-xs">
          {entity.type === 'tag' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-300 font-medium">Texto de la Etiqueta:</label>
              <input
                type="text"
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                className="bg-[#14151a] border border-[#373a46] rounded-lg px-2.5 py-1.5 text-white"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-neutral-400">Tamaño (mm):</span>
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="20"
                  value={tagFontSize}
                  onChange={(e) => setTagFontSize(parseFloat(e.target.value) || 4)}
                  className="w-16 bg-[#14151a] border border-[#373a46] rounded px-2 py-1 text-right text-white"
                />
              </div>
            </div>
          )}

          {entity.type === 'image' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">Ancho en lámina:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="400"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(parseFloat(e.target.value) || 50)}
                    className="w-20 bg-[#14151a] border border-[#373a46] rounded px-2 py-1 text-right text-white"
                  />
                  <span className="text-neutral-400">mm</span>
                </div>
              </div>
              <span className="text-[10px] text-neutral-400">El alto se escala proporcionalmente.</span>
            </div>
          )}

          {entity.type === 'symbol' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-neutral-300 font-medium">Símbolo Técnico:</label>
              <select
                value={symbolType}
                onChange={(e) => setSymbolType(e.target.value as SymbolType)}
                className="bg-[#14151a] border border-[#373a46] rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="perp">Perpendicular (⟂)</option>
                <option value="para">Paralelo (//)</option>
                <option value="coin">Coincidente (≡)</option>
                <option value="angle">Ángulo (∡)</option>
                <option value="center">Centro de Ejes (+)</option>
              </select>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Color de Trazo:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
              />
              <span className="font-mono text-neutral-400 text-[11px]">{color}</span>
            </div>
          </div>

          {(entity.type === 'circle' || entity.type === 'polygon' || entity.type === 'fill') && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">Color de Relleno:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                />
                <span className="font-mono text-neutral-400 text-[11px]">{fillColor}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Grosor de Línea (Normalizado):</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0.5)}
                className="w-16 bg-[#14151a] border border-[#373a46] rounded px-2 py-1 text-right text-white font-mono"
              />
              <span className="text-neutral-400">mm</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Tipo de Trazo:</span>
            <select
              value={dash}
              onChange={(e) => setDash(e.target.value as DashStyle)}
              className="bg-[#14151a] border border-[#373a46] rounded px-2 py-1 text-white text-xs"
            >
              <option value="none">Continuo (Contornos)</option>
              <option value="3,3">Discontinuo (Ocultas)</option>
              <option value="10,2,2,2">Raya-Punto (Ejes de simetría)</option>
              <option value="6,2">Raya amplia</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#2d313b] bg-[#16171e]">
          <button
            onClick={() => {
              onDeleteEntity(entity.id);
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#2c303a] transition"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
