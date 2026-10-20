/**
 * Vertical CAD ToolBar with intelligent category flyouts and precision shortcuts
 * Saves vertical screen space, improves workflow speed and technical hierarchy
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
  ChevronRight,
} from 'lucide-react';

interface ToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

export interface ToolItem {
  id: ToolType;
  label: string;
  key: string;
  description: string;
  icon: React.ReactNode;
}

interface ToolCategory {
  id: string;
  title: string;
  tools: ToolItem[];
}

export const ToolBar: React.FC<ToolBarProps> = ({ activeTool, onSelectTool }) => {
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);

  const categories: ToolCategory[] = [
    {
      id: 'selection',
      title: 'Puntero y Selección',
      tools: [
        {
          id: 'cursor',
          label: 'Seleccionar',
          key: 'V',
          description: 'Seleccionar y mover (Caja arrastre, Alt duplicar, Shift orto, Supr borrar)',
          icon: <MousePointer className="w-5 h-5" />,
        },
        {
          id: 'eraser',
          label: 'Borrador',
          key: 'B',
          description: 'Borrador rápido (Clic sobre entidad para eliminar)',
          icon: <Eraser className="w-5 h-5" />,
        },
      ],
    },
    {
      id: 'lines',
      title: 'Trazos y Rectas',
      tools: [
        {
          id: 'line',
          label: 'Segmento',
          key: 'L',
          description: 'Segmento de recta (Shift para ortogonal, teclea medida + Enter)',
          icon: <Minus className="w-5 h-5" />,
        },
        {
          id: 'parallel',
          label: 'Paralela',
          key: 'P',
          description: 'Línea paralela (Clic en recta de referencia, luego trazar)',
          icon: <Split className="w-5 h-5" />,
        },
        {
          id: 'perpendicular',
          label: 'Perpendicular',
          key: 'O',
          description: 'Línea perpendicular (Clic en recta de referencia, luego trazar)',
          icon: <CornerDownRight className="w-5 h-5" />,
        },
        {
          id: 'line_angle',
          label: 'Ángulo fijo',
          key: 'A',
          description: 'Línea con ángulo exacto prefijado en grados',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="20" x2="21" y2="20" />
              <line x1="3" y1="20" x2="17" y2="6" />
              <path d="M 12 20 A 9 9 0 0 0 9 13" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'curves',
      title: 'Curvas y Arcos',
      tools: [
        {
          id: 'circle',
          label: 'Circunferencia',
          key: 'C',
          description: 'Circunferencia por centro y radio (o teclea radio en mm)',
          icon: <Circle className="w-5 h-5" />,
        },
        {
          id: 'arc',
          label: 'Arco Compás',
          key: 'R',
          description: 'Arco técnico (1º Centro, 2º Radio/Inicio, 3º Ángulo de barrido)',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M 4 15 A 9 9 0 0 1 20 15" />
              <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            </svg>
          ),
        },
        {
          id: 'curve',
          label: 'Spline',
          key: 'S',
          description: 'Curva técnica continua por puntos de paso (Doble clic para terminar)',
          icon: <PenTool className="w-5 h-5" />,
        },
      ],
    },
    {
      id: 'shapes',
      title: 'Formas y Polígonos',
      tools: [
        {
          id: 'rect',
          label: 'Rectángulo',
          key: 'U',
          description: 'Rectángulo ortogonal por dos esquinas opuestas',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="1" />
            </svg>
          ),
        },
        {
          id: 'polygon',
          label: 'Polígono',
          key: 'G',
          description: 'Polígono regular inscrito (Configura lados en barra superior)',
          icon: <Shapes className="w-5 h-5" />,
        },
        {
          id: 'fill',
          label: 'Rayado 45º',
          key: 'F',
          description: 'Rayado técnico normalizado a 45º o sombreado',
          icon: <Hash className="w-5 h-5" />,
        },
        {
          id: 'point',
          label: 'Punto',
          key: 'X',
          description: 'Punto geométrico con cruz técnica de precisión',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'constructions',
      title: 'Geometría Didáctica',
      tools: [
        {
          id: 'mediatriz',
          label: 'Mediatriz',
          key: 'D',
          description: 'Mediatriz con trazado didáctico de arcos de compás',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="3,2" />
              <path d="M 9 7 A 6 6 0 0 1 15 17" strokeWidth="1.2" opacity="0.7" />
              <path d="M 15 7 A 6 6 0 0 0 9 17" strokeWidth="1.2" opacity="0.7" />
            </svg>
          ),
        },
        {
          id: 'bisectriz',
          label: 'Bisectriz',
          key: 'I',
          description: 'Bisectriz de un ángulo formado por 3 puntos o 2 rectas',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="4" y1="20" x2="20" y2="20" />
              <line x1="4" y1="20" x2="18" y2="6" />
              <line x1="4" y1="20" x2="20" y2="13" strokeDasharray="3,2" />
              <path d="M 11 20 A 7 7 0 0 0 10 15" strokeWidth="1.2" opacity="0.7" />
            </svg>
          ),
        },
        {
          id: 'tales',
          label: 'Tales',
          key: 'K',
          description: 'Dividir segmento en partes iguales (Teorema de Tales)',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="18" x2="21" y2="18" />
              <line x1="3" y1="18" x2="18" y2="6" />
              <line x1="8" y1="14" x2="9" y2="18" strokeDasharray="2,2" />
              <line x1="13" y1="10" x2="15" y2="18" strokeDasharray="2,2" />
              <line x1="18" y1="6" x2="21" y2="18" strokeDasharray="2,2" />
            </svg>
          ),
        },
        {
          id: 'trim',
          label: 'Recortar',
          key: 'N',
          description: 'Recortar segmento hasta la intersección más cercana (Trim)',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="4" y1="20" x2="12" y2="12" strokeDasharray="2,2" opacity="0.5" />
              <line x1="12" y1="12" x2="20" y2="4" />
              <circle cx="12" cy="12" r="2.5" fill="none" stroke="#f43f5e" />
            </svg>
          ),
        },
        {
          id: 'tape_measure',
          label: 'Medir',
          key: 'Q',
          description: 'Cinta métrica: inspección no destructiva de distancias',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="7" width="18" height="10" rx="2" />
              <line x1="7" y1="7" x2="7" y2="11" />
              <line x1="11" y1="7" x2="11" y2="13" />
              <line x1="15" y1="7" x2="15" y2="11" />
            </svg>
          ),
        },
      ],
    },
    {
      id: 'annotations_3d',
      title: 'Anotación y Sistemas',
      tools: [
        {
          id: 'measure',
          label: 'Acotar ISO',
          key: 'M',
          description: 'Acotación normalizada (1º Inicio, 2º Fin, 3º Lado de cota)',
          icon: <Ruler className="w-5 h-5" />,
        },
        {
          id: 'text',
          label: 'Texto',
          key: 'T',
          description: 'Caja de texto técnico enriquecido normalizado',
          icon: <Type className="w-5 h-5" />,
        },
        {
          id: 'tag',
          label: 'Etiqueta',
          key: 'E',
          description: 'Etiqueta de vértice / punto con autoalineación',
          icon: <Tag className="w-5 h-5" />,
        },
        {
          id: 'symbol',
          label: 'Símbolos',
          key: 'W',
          description: 'Símbolos técnicos (Perpendicular ⟂, Paralelo //, Coincidencia ≡)',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ),
        },
        {
          id: 'isobox',
          label: 'Caja ISO',
          key: 'J',
          description: 'Prisma envolvente en perspectiva isométrica (30º / 150º / 90º)',
          icon: <Box className="w-5 h-5" />,
        },
        {
          id: 'isocircle',
          label: 'Isocírculo',
          key: 'Y',
          description: 'Elipse isométrica en el isoplano activo',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <ellipse cx="12" cy="12" rx="9" ry="5.2" transform="rotate(-30 12 12)" />
              <line x1="12" y1="9.5" x2="12" y2="14.5" strokeWidth="1.2" />
            </svg>
          ),
        },
        {
          id: 'diedrico_template',
          label: 'Diédrico',
          key: 'Z',
          description: 'Plantilla normalizada con vistas diédricas y 3D axonométrico',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2,2" />
              <line x1="3" y1="12" x2="12" y2="12" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="w-14 bg-[#181920] border-r border-[#2d313d] flex flex-col items-center py-2.5 gap-2 select-none z-30 shadow-md shrink-0">
      {categories.map((cat) => {
        // Find if any tool in this category is currently active
        const activeInCat = cat.tools.find((t) => t.id === activeTool);
        // Default representative tool is the active one or the first one
        const currentRep = activeInCat || cat.tools[0];
        const isCatActive = Boolean(activeInCat);
        const isFlyoutOpen = openFlyout === cat.id;

        return (
          <div
            key={cat.id}
            className="relative"
            onMouseEnter={() => setOpenFlyout(cat.id)}
            onMouseLeave={() => setOpenFlyout(null)}
          >
            {/* Primary Category Button */}
            <button
              onClick={() => {
                onSelectTool(currentRep.id);
                setOpenFlyout(null);
              }}
              className={`w-10 h-10 rounded-xl relative flex flex-col items-center justify-center transition group ${
                isCatActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 ring-1 ring-sky-400'
                  : 'text-neutral-400 hover:text-white hover:bg-[#252833]'
              }`}
              title={`${currentRep.label} [${currentRep.key}] - ${currentRep.description}`}
            >
              {currentRep.icon}
              {/* Keyboard shortcut */}
              <span
                className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none ${
                  isCatActive ? 'text-sky-200' : 'text-neutral-400 group-hover:text-neutral-300'
                }`}
              >
                {currentRep.key}
              </span>
              {/* Flyout indicator arrow */}
              <svg
                className="absolute top-1 right-1 w-2 h-2 text-neutral-400 opacity-60 group-hover:opacity-100"
                viewBox="0 0 10 10"
                fill="currentColor"
              >
                <polygon points="2,3 8,3 5,7" />
              </svg>
            </button>

            {/* Flyout Submenu Drawer */}
            {isFlyoutOpen && (
              <div
                className="absolute left-12 top-0 ml-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 min-w-[210px] animate-in fade-in slide-in-from-left-2 duration-100"
                style={{ top: '-4px' }}
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  {cat.title}
                </div>
                {cat.tools.map((tool) => {
                  const isToolActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTool(tool.id);
                        setOpenFlyout(null);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isToolActive
                          ? 'bg-sky-600/30 text-sky-300 border border-sky-500/50'
                          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isToolActive ? 'text-sky-400' : 'text-slate-400'}>{tool.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">{tool.label}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">{tool.description}</span>
                        </div>
                      </div>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-amber-300 shrink-0 ml-2">
                        {tool.key}
                      </kbd>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};
