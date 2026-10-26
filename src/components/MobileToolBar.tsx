/**
 * Mobile ToolBar & Bottom Dock
 * Provides thumb-friendly, touch-optimized tool selection for mobile devices
 * Eliminates hover dependency and supports instant category selection
 */

import React, { useState } from 'react';
import { ToolType } from '../cad/types.ts';
import {
  MousePointer,
  Minus,
  Ruler,
  Split,
  CornerDownRight,
  Circle,
  Shapes,
  PenTool,
  Hash,
  Tag,
  Type,
  Eraser,
  Box,
  ChevronUp,
  X,
  Compass,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface MobileToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onOpenDiedrico?: () => void;
}

export const MobileToolBar: React.FC<MobileToolBarProps> = ({
  activeTool,
  onSelectTool,
  onOpenDiedrico,
}) => {
  const [showAllToolsSheet, setShowAllToolsSheet] = useState(false);

  // High-frequency tools shown directly in the bottom dock
  const primaryDockTools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'cursor', label: 'Puntero', icon: <MousePointer className="w-5 h-5" /> },
    { id: 'line', label: 'Línea', icon: <Minus className="w-5 h-5 stroke-[2.5]" /> },
    { id: 'circle', label: 'Círculo', icon: <Circle className="w-5 h-5" /> },
    { id: 'arc', label: 'Arco', icon: <Compass className="w-5 h-5" /> },
    { id: 'measure', label: 'Cota', icon: <Ruler className="w-5 h-5" /> },
    { id: 'eraser', label: 'Borrar', icon: <Eraser className="w-5 h-5" /> },
  ];

  const allCategories = [
    {
      title: 'Selección y Edición',
      tools: [
        { id: 'cursor', label: 'Seleccionar (V)', icon: <MousePointer className="w-5 h-5" />, desc: 'Selecciona, mueve y transforma' },
        { id: 'eraser', label: 'Borrador (B)', icon: <Eraser className="w-5 h-5" />, desc: 'Elimina entidades al tocarlas' },
        { id: 'trim', label: 'Recortar', icon: <Split className="w-5 h-5" />, desc: 'Corta segmentos hasta intersecciones' },
      ],
    },
    {
      title: 'Trazados Básicos',
      tools: [
        { id: 'line', label: 'Segmento (L)', icon: <Minus className="w-5 h-5" />, desc: 'Línea de extremo a extremo' },
        { id: 'circle', label: 'Círculo (C)', icon: <Circle className="w-5 h-5" />, desc: 'Circunferencia por centro y radio' },
        { id: 'arc', label: 'Arco / Compás (A)', icon: <Compass className="w-5 h-5" />, desc: 'Arco con compás técnico' },
        { id: 'rect', label: 'Rectángulo (R)', icon: <Box className="w-5 h-5" />, desc: 'Rectángulo definido por dos vértices' },
        { id: 'polygon', label: 'Polígono (P)', icon: <Shapes className="w-5 h-5" />, desc: 'Polígono regular inscrito' },
        { id: 'curve', label: 'Spline / Curva (S)', icon: <PenTool className="w-5 h-5" />, desc: 'Curva suave de Bézier continua' },
        { id: 'point', label: 'Punto (X)', icon: <span className="font-bold text-lg">•</span>, desc: 'Punto geométrico con cruz' },
      ],
    },
    {
      title: 'Geometría Métrica & Construcciones',
      tools: [
        { id: 'mediatriz', label: 'Mediatriz', icon: <Split className="w-5 h-5" />, desc: 'Eje mediatriz de un segmento con arcos' },
        { id: 'bisectriz', label: 'Bisectriz', icon: <CornerDownRight className="w-5 h-5" />, desc: 'Semirrecta bisectriz de un ángulo' },
        { id: 'tales', label: 'Teorema de Tales', icon: <Hash className="w-5 h-5" />, desc: 'División de segmento en partes iguales' },
        { id: 'tape_measure', label: 'Cinta Métrica', icon: <Ruler className="w-5 h-5" />, desc: 'Mide distancias y ángulos en tiempo real' },
      ],
    },
    {
      title: 'Anotación y Cota',
      tools: [
        { id: 'measure', label: 'Cota ISO (M)', icon: <Ruler className="w-5 h-5" />, desc: 'Línea de cota con flechas normalizadas' },
        { id: 'text', label: 'Texto Técnico (T)', icon: <Type className="w-5 h-5" />, desc: 'Caja de rotulación con giro y fuente' },
        { id: 'tag', label: 'Etiqueta Vértice', icon: <Tag className="w-5 h-5" />, desc: 'Identificador (A, B, C, V) normalizado' },
        { id: 'fill', label: 'Rayado / Trama (F)', icon: <Shapes className="w-5 h-5" />, desc: 'Rayado técnico a 45º o color' },
      ],
    },
    {
      title: 'Perspectiva & 3D',
      tools: [
        { id: 'isocircle', label: 'Isocírculo (I)', icon: <Circle className="w-5 h-5" />, desc: 'Elipse isométrica en 3 planos' },
        { id: 'isobox', label: 'Caja Isométrica (J)', icon: <Box className="w-5 h-5" />, desc: 'Prisma axonométrico con aristas' },
        { id: 'diedrico_template', label: 'Lámina Vistas + 3D', icon: <Shapes className="w-5 h-5" />, desc: 'Plantilla de diédrico y perspectiva' },
      ],
    },
  ];

  return (
    <>
      {/* Fixed Bottom Dock for Mobile */}
      <nav aria-label="Herramientas móviles" className="h-14 bg-[#14151b] border-t border-[#2d313d] px-2 flex items-center justify-around z-30 shrink-0 select-none pb-safe">
        {primaryDockTools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-[#20222a] active:bg-[#252834]'
              }`}
            >
              {tool.icon}
              <span className="text-[9px] font-medium mt-0.5">{tool.label}</span>
            </button>
          );
        })}

        {/* "More Tools" Button */}
        <button
          onClick={() => setShowAllToolsSheet(true)}
          className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition ${
            !primaryDockTools.some((t) => t.id === activeTool)
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-neutral-300 hover:text-white hover:bg-[#20222a] active:bg-[#252834]'
          }`}
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-[9px] font-medium mt-0.5">Más</span>
        </button>
      </nav>

      {/* Full Tools Bottom Sheet */}
      {showAllToolsSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowAllToolsSheet(false)}
        >
          <div
            className="w-full max-h-[80vh] bg-[#1a1c24] border-t border-[#2e323e] rounded-t-2xl flex flex-col shadow-2xl text-neutral-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="h-12 px-4 bg-[#14151b] border-b border-[#2e323e] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Todas las Herramientas CAD
              </span>
              <button
                onClick={() => setShowAllToolsSheet(false)}
                className="p-1.5 rounded-lg bg-[#22242c] text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Tools List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allCategories.map((cat) => (
                <div key={cat.title} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider px-1">
                    {cat.title}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.tools.map((t) => {
                      const isActive = activeTool === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (t.id === 'diedrico_template' && onOpenDiedrico) {
                              onOpenDiedrico();
                            } else {
                              onSelectTool(t.id as ToolType);
                            }
                            setShowAllToolsSheet(false);
                          }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                            isActive
                              ? 'bg-sky-600 border-sky-400 text-white font-semibold shadow-md'
                              : 'bg-[#14151a] border-[#2d313d] text-neutral-300 hover:text-white hover:bg-[#20222a]'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-[#22242c]'}`}>
                            {t.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate">{t.label}</div>
                            <div className="text-[10px] text-neutral-400 truncate">{t.desc}</div>
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
    </>
  );
};
