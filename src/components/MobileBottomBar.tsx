/**
 * Mobile Bottom Bar & Extended Tool Sheet for VektorCAD
 * Ergonomic thumb-driven CAD tools designed specifically for mobile touchscreens
 */

import React, { useState } from 'react';
import { ToolType } from '../cad/types.ts';
import {
  MousePointer,
  Minus,
  Circle,
  Ruler,
  Scissors,
  Grid,
  Square,
  Dot,
  PenTool,
  Hash,
  Type,
  Tag,
  Eraser,
  Split,
  Combine,
  FlipHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Box,
  Compass,
} from 'lucide-react';

interface MobileBottomBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onOpenCropModal: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTool,
  onSelectTool,
  onOpenCropModal,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const mainTools: Array<{ id: ToolType; label: string; icon: React.ReactNode }> = [
    { id: 'cursor', label: 'Puntero', icon: <MousePointer className="w-5 h-5" /> },
    { id: 'line', label: 'Línea', icon: <Minus className="w-5 h-5" /> },
    { id: 'circle', label: 'Círculo', icon: <Circle className="w-5 h-5" /> },
    { id: 'measure', label: 'Cota', icon: <Ruler className="w-5 h-5" /> },
  ];

  const extendedTools: Array<{
    category: string;
    tools: Array<{ id: ToolType; label: string; desc: string; icon: React.ReactNode }>;
  }> = [
    {
      category: 'Geometría Básica',
      tools: [
        { id: 'rect', label: 'Rectángulo', desc: 'Por 2 esquinas opuestas', icon: <Square className="w-4 h-4" /> },
        { id: 'point', label: 'Punto', desc: 'Marca métrica precisa', icon: <Dot className="w-4 h-4" /> },
        { id: 'arc', label: 'Arco', desc: 'Centro, radio y barrido angular', icon: <Circle className="w-4 h-4" /> },
        { id: 'polygon', label: 'Polígono Regular', desc: 'Inscrito con N lados', icon: <Hash className="w-4 h-4" /> },
        { id: 'curve', label: 'Spline / Curva', desc: 'Puntos de paso suaves', icon: <PenTool className="w-4 h-4" /> },
        { id: 'fill', label: 'Rayado 45º', desc: 'Sombreado técnico UNE', icon: <Grid className="w-4 h-4" /> },
      ],
    },
    {
      category: 'Trazados Técnicos & Métricos',
      tools: [
        { id: 'mediatriz', label: 'Mediatriz', desc: 'Con arcos de compás UNE', icon: <Split className="w-4 h-4" /> },
        { id: 'bisectriz', label: 'Bisectriz', desc: 'Con trazado de compás', icon: <Combine className="w-4 h-4" /> },
        { id: 'tales', label: 'Teorema de Tales', desc: 'División en N partes iguales', icon: <Ruler className="w-4 h-4" /> },
        { id: 'parallel', label: 'Paralela', desc: 'A distancia de una referencia', icon: <Minus className="w-4 h-4" /> },
        { id: 'perpendicular', label: 'Perpendicular', desc: 'Por un punto a una recta', icon: <Minus className="w-4 h-4" /> },
        { id: 'line_angle', label: 'Línea a Ángulo', desc: 'Orientación exacta en grados', icon: <Minus className="w-4 h-4" /> },
      ],
    },
    {
      category: 'Modificación & Medición',
      tools: [
        { id: 'trim', label: 'Recortar (Trim)', desc: 'Cortar segmento en intersección', icon: <Scissors className="w-4 h-4" /> },
        { id: 'extend', label: 'Alargar (Extend)', desc: 'Extender hasta frontera', icon: <Minus className="w-4 h-4" /> },
        { id: 'mirror', label: 'Simetría', desc: 'Eje de reflexión de 2 puntos', icon: <FlipHorizontal className="w-4 h-4" /> },
        { id: 'tape_measure', label: 'Cinta Métrica', desc: 'Medición rápida sin cota', icon: <Ruler className="w-4 h-4" /> },
        { id: 'eraser', label: 'Borrador', desc: 'Eliminar por clic o ventana', icon: <Eraser className="w-4 h-4" /> },
      ],
    },
    {
      category: 'Rotulación & Perspectiva',
      tools: [
        { id: 'text', label: 'Caja de Texto', desc: 'Con giro libre y formato', icon: <Type className="w-4 h-4" /> },
        { id: 'tag', label: 'Etiqueta Vértice', desc: 'Marcado rápido de puntos (A, B)', icon: <Tag className="w-4 h-4" /> },
        { id: 'isocircle', label: 'Elipse Isométrica', desc: 'Óvalo en plano Isométrica', icon: <Circle className="w-4 h-4" /> },
        { id: 'isobox', label: 'Cubo Isométrico', desc: 'Caja 3D axonometría rápida', icon: <Box className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <>
      {/* Extended Tools Bottom Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSheetOpen(false)}
          />

          {/* Bottom Sheet panel */}
          <div className="relative z-10 w-full max-h-[75vh] bg-[#16171d] border-t border-[#2d313d] rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center pt-2 pb-3 px-4 border-b border-[#2d313d]">
              <div className="w-10 h-1 rounded-full bg-neutral-600 mb-2" />
              <div className="w-full flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Todas las Herramientas CAD
                </span>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Tool Categories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {extendedTools.map((cat, idx) => (
                <div key={idx}>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
                    {cat.category}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.tools.map((tool) => {
                      const isSelected = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            onSelectTool(tool.id);
                            setIsSheetOpen(false);
                          }}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left border transition ${
                            isSelected
                              ? 'bg-sky-600/30 border-sky-400 text-sky-200 ring-1 ring-sky-400/50'
                              : 'bg-[#20222a] border-[#2f323e] text-neutral-200 hover:bg-[#282a35]'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected ? 'bg-sky-500 text-white' : 'bg-[#15161c] text-sky-400'
                            }`}
                          >
                            {tool.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{tool.label}</div>
                            <div className="text-[10px] text-neutral-400 leading-tight line-clamp-1">
                              {tool.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Docked Mobile Bottom Bar */}
      <nav
        aria-label="Herramientas móviles CAD"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#16171d]/95 backdrop-blur-md border-t border-[#2d313d] px-2 py-1 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        {mainTools.map((t) => {
          const isSelected = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white active:bg-neutral-800'
              }`}
            >
              {t.icon}
              <span className="text-[10px] font-medium mt-0.5">{t.label}</span>
            </button>
          );
        })}

        {/* Recorte de imagen */}
        <button
          onClick={onOpenCropModal}
          className="flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl text-amber-400 hover:text-amber-300 active:bg-neutral-800 transition"
        >
          <Scissors className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Recorte</span>
        </button>

        {/* More Tools Trigger */}
        <button
          onClick={() => setIsSheetOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition ${
            isSheetOpen
              ? 'bg-[#2b2e3a] text-sky-400'
              : 'text-neutral-400 hover:text-white active:bg-neutral-800'
          }`}
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Más</span>
        </button>
      </nav>
    </>
  );
};
