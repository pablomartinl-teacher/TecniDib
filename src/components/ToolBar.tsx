/**
 * Vertical CAD ToolBar with technical shortcuts and precision tool icons
 */

import React from 'react';
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
  Dot,
  Compass,
  Box,
} from 'lucide-react';

interface ToolBarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolItem {
  id: ToolType;
  label: string;
  key: string;
  description: string;
  icon: React.ReactNode;
}

export const ToolBar: React.FC<ToolBarProps> = ({ activeTool, onSelectTool }) => {
  const tools: ToolItem[] = [
    {
      id: 'cursor',
      label: 'Seleccionar',
      key: 'V',
      description: 'Seleccionar y mover (Caja arrastre, Alt duplicar, Shift orto, Supr borrar)',
      icon: <MousePointer className="w-5 h-5" />,
    },
    {
      id: 'line',
      label: 'Segmento',
      key: 'L',
      description: 'Segmento de recta (Shift para ortogonal, teclea medida + Enter)',
      icon: <Minus className="w-5 h-5" />,
    },
    {
      id: 'measure',
      label: 'Acotar ISO',
      key: 'M',
      description: 'Acotación normalizada (1º Inicio, 2º Fin, 3º Lado de cota)',
      icon: <Ruler className="w-5 h-5" />,
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
      label: 'Ángulo',
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
    {
      id: 'circle',
      label: 'Circunferencia',
      key: 'C',
      description: 'Circunferencia con centro y radio (o teclea radio en mm)',
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
      label: 'Spline / Curva',
      key: 'S',
      description: 'Curva técnica suave por puntos de paso (Doble clic para cerrar)',
      icon: <PenTool className="w-5 h-5" />,
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
      description: 'Rayado técnico normalizado a 45º o sombreado de polígono',
      icon: <Hash className="w-5 h-5" />,
    },
    {
      id: 'symbol',
      label: 'Símbolos ISO',
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
      id: 'mediatriz',
      label: 'Mediatriz',
      key: 'D',
      description: 'Mediatriz de un segmento con arcos de compás didácticos',
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
      description: 'Recortar segmento hasta la intersección más cercana',
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
      description: 'Cinta métrica: inspección no destructiva de distancias y ángulos',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <line x1="7" y1="7" x2="7" y2="11" />
          <line x1="11" y1="7" x2="11" y2="13" />
          <line x1="15" y1="7" x2="15" y2="11" />
          <line x1="19" y1="7" x2="19" y2="11" />
        </svg>
      ),
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
    {
      id: 'text',
      label: 'Texto',
      key: 'T',
      description: 'Caja de texto técnico enriquecido (Arrastra para delimitar caja)',
      icon: <Type className="w-5 h-5" />,
    },
    {
      id: 'tag',
      label: 'Etiqueta',
      key: 'E',
      description: 'Etiqueta de vértice / segmento con autoalineación',
      icon: <Tag className="w-5 h-5" />,
    },
    {
      id: 'isocircle',
      label: 'Isocírculo',
      key: 'I',
      description: 'Elipse u óvalo isométrico en el isoplano activo (Superior, Izquierdo o Derecho)',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="12" cy="12" rx="9" ry="5.2" transform="rotate(-30 12 12)" />
          <line x1="12" y1="9.5" x2="12" y2="14.5" strokeWidth="1.2" />
          <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      id: 'isobox',
      label: 'Caja Isométrica',
      key: 'J',
      description: 'Prisma envolvente en perspectiva isométrica (30º / 150º / 90º) con aristas ocultas',
      icon: <Box className="w-5 h-5" />,
    },
    {
      id: 'diedrico_template',
      label: 'Lámina Diédrico + 3D',
      key: 'D',
      description: 'Plantilla normalizada con vistas diédricas (LT, Alzado, Planta, Perfil) y trípode axonométrico',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2,2" />
          <line x1="3" y1="12" x2="12" y2="12" />
          <line x1="16" y1="12" x2="20" y2="14" />
          <line x1="16" y1="12" x2="12" y2="14" />
          <line x1="16" y1="12" x2="16" y2="7" />
        </svg>
      ),
    },
    {
      id: 'eraser',
      label: 'Borrador',
      key: 'B',
      description: 'Borrador (Clic sobre entidad o arrastra caja para borrar múltiple)',
      icon: <Eraser className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-14 bg-[#181920] border-r border-[#2d313d] flex flex-col items-center py-2 gap-1 overflow-y-auto select-none z-20 shadow-md">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-10 h-10 rounded-xl relative flex flex-col items-center justify-center transition group ${
              isActive
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 ring-1 ring-sky-400'
                : 'text-neutral-400 hover:text-white hover:bg-[#252833]'
            }`}
            title={`${tool.label} [Tecla: ${tool.key}] - ${tool.description}`}
          >
            {tool.icon}
            {/* Keyboard shortcut tiny badge */}
            <span
              className={`absolute bottom-0.5 right-1 text-[8px] font-mono font-bold leading-none ${
                isActive ? 'text-sky-200' : 'text-neutral-400 group-hover:text-neutral-300'
              }`}
            >
              {tool.key}
            </span>
          </button>
        );
      })}
    </aside>
  );
};
