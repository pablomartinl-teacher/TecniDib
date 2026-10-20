/**
 * VektorCAD - Technical Shortcuts & Keyboard Reference Modal
 * Complete guide for professional CAD workflow and hotkeys
 */

import React from 'react';
import { X, Keyboard, MousePointer, Compass, Ruler, Zap, Sparkles } from 'lucide-react';

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Trazado y Dibujo Técnico',
      icon: <Compass className="w-4 h-4 text-sky-400" />,
      items: [
        { key: 'L', desc: 'Línea / Segmento (Shift para ortogonal)' },
        { key: 'C', desc: 'Circunferencia (por centro y radio)' },
        { key: 'R', desc: 'Arco técnico / Compás (centro, radio, barrido)' },
        { key: 'M', desc: 'Acotación normalizada ISO / UNE' },
        { key: 'G', desc: 'Polígono regular (prefija número de lados)' },
        { key: 'A', desc: 'Línea con ángulo exacto en grados' },
        { key: 'P', desc: 'Recta paralela a otra existente' },
        { key: 'O', desc: 'Recta perpendicular a otra existente' },
        { key: 'X', desc: 'Caja de texto técnico enriquecido' },
        { key: 'T', desc: 'Punto geométrico normalizado' },
        { key: 'E', desc: 'Recortar (Trim) líneas en intersección' },
      ],
    },
    {
      title: 'Edición y Modificación',
      icon: <MousePointer className="w-4 h-4 text-emerald-400" />,
      items: [
        { key: 'V', desc: 'Herramienta Puntero / Selección' },
        { key: 'Supr / Backspace', desc: 'Eliminar selección activa' },
        { key: 'Ctrl + Z', desc: 'Deshacer última acción' },
        { key: 'Ctrl + Y', desc: 'Rehacer acción' },
        { key: 'Ctrl + D', desc: 'Duplicar elementos seleccionados (+8mm)' },
        { key: 'Alt + Arrastrar', desc: 'Clonar elementos en tiempo real' },
        { key: 'Esc', desc: 'Cancelar dibujo actual o deseleccionar' },
      ],
    },
    {
      title: 'Precisión y Modos CAD',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      items: [
        { key: 'F8', desc: 'Modo Ortogonal (bloqueo a 0º, 90º, 180º, 270º)' },
        { key: 'F9', desc: 'Imán Snap magnético (extremos, medios, centros)' },
        { key: 'F7', desc: 'Ajuste a la rejilla métrica' },
        { key: 'Shift (mantenido)', desc: 'Restricción ortogonal temporal mientras trazas' },
        { key: 'Clic derecho', desc: 'Menú contextual con operaciones rápidas' },
      ],
    },
    {
      title: 'Navegación y Vistas',
      icon: <Ruler className="w-4 h-4 text-purple-400" />,
      items: [
        { key: 'Espacio + Arrastre', desc: 'Panorámica / Desplazar lámina (Hand)' },
        { key: 'Rueda del Ratón', desc: 'Zoom continuo milimétrico' },
        { key: 'Z', desc: 'Ajustar lámina completa a pantalla (100%)' },
        { key: 'Tab', desc: 'Alternar Modo Enfoque / Pantalla Completa' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Guía de Atajos & Comandos CAD</h2>
              <p className="text-[11px] text-slate-400">VektorCAD - Flujo de trabajo técnico acelerado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Pro-Tips Banner */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <Sparkles size={14} />
              <span>Técnicas de Precisión Estándar CAD:</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span>
                  <strong>Cota directa:</strong> Durante un trazo, teclea la medida (ej. <code className="text-amber-300 bg-slate-800 px-1 rounded">50</code>) y pulsa <kbd className="text-slate-400">Enter</kbd>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span>
                  <strong>Entrada polar:</strong> Teclea longitud y ángulo con &lt; (ej. <code className="text-amber-300 bg-slate-800 px-1 rounded">80&lt;45</code>) y pulsa <kbd className="text-slate-400">Enter</kbd>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sky-400 font-bold">•</span>
                <span>
                  <strong>Selección Ventana (Izq → Der):</strong> Caja azul sólida. Selecciona solo lo que está 100% dentro.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Selección Captura (Der → Izq):</strong> Caja verde discontinua. Selecciona cualquier objeto que toque o cruce.
                </span>
              </li>
            </ul>
          </div>

          {/* Grids of shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((sec, idx) => (
              <div key={idx} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/70 space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-[11px] pb-1 border-b border-slate-800">
                  {sec.icon}
                  <span>{sec.title}</span>
                </div>
                <div className="space-y-1.5">
                  {sec.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-slate-300 leading-tight">{item.desc}</span>
                      <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded font-mono text-[10px] text-amber-300 shrink-0">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Pulsa <kbd className="px-1 bg-slate-800 rounded text-slate-200">?</kbd> en cualquier momento para abrir esta ayuda</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
