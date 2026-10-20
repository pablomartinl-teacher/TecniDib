/**
 * Quick CAD Command Bar & Coordinate Status HUD
 * AutoCAD-style command prompt with live coordinate tracking and command shortcuts
 */

import React, { useState } from 'react';
import { Point2D } from '../cad/types.ts';
import { Terminal, Send, HelpCircle } from 'lucide-react';

export interface CommandBarProps {
  coords: Point2D;
  promptText: string;
  onExecuteCommand: (cmd: string) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  coords,
  promptText,
  onExecuteCommand,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    onExecuteCommand(commandInput);
    setCommandInput('');
  };

  const quickCommands = [
    { key: 'L', label: 'Línea' },
    { key: 'C', label: 'Círculo' },
    { key: 'M', label: 'Cota ISO' },
    { key: 'MED', label: 'Mediatriz' },
    { key: 'BIS', label: 'Bisectriz' },
    { key: 'TALES', label: 'Tales' },
    { key: 'TRIM', label: 'Recortar' },
    { key: 'DIST', label: 'Medir' },
    { key: 'MIRROR', label: 'Simetría' },
    { key: 'PURGE', label: 'Purgar' },
    { key: 'HELP', label: 'Atajos' },
    { key: 'DXF', label: 'DXF' },
  ];

  return (
    <footer className="h-10 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between px-3 shrink-0 select-none z-30 font-mono">
      {/* Left: Terminal prompt & status instructions */}
      <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 mr-3">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold shrink-0">
          <Terminal size={14} />
          <span className="uppercase tracking-wider text-[11px] hidden sm:inline">COMANDO:</span>
        </div>

        <div className="truncate text-slate-200 bg-slate-950/60 px-2.5 py-0.5 rounded border border-slate-800/80 text-[11px] max-w-xs md:max-w-sm lg:max-w-md shrink">
          {promptText || 'Listo para dibujar. Selecciona herramienta o teclea comando.'}
        </div>

        {/* Quick CLI Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Atajo (L, C, M...)"
            className="bg-slate-950 border border-slate-700/80 rounded px-2 py-0.5 text-xs text-amber-300 placeholder-slate-500 w-28 sm:w-36 focus:outline-none focus:border-blue-500 uppercase font-mono"
          />
          <button
            type="submit"
            title="Ejecutar comando"
            className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          >
            <Send size={12} />
          </button>
        </form>

        {/* Quick Command Chips - gracefully hide to avoid squeezing coordinates */}
        <div className="hidden xl:flex items-center gap-1 overflow-hidden shrink">
          {quickCommands.slice(0, 6).map((cmd) => (
            <button
              key={cmd.key}
              type="button"
              onClick={() => onExecuteCommand(cmd.key)}
              title={`Activar ${cmd.label}`}
              className="px-1.5 py-0.5 bg-slate-800/70 hover:bg-slate-700 hover:text-white text-[10px] text-slate-300 rounded border border-slate-700/60 transition-colors shrink-0"
            >
              <strong className="text-amber-400 mr-1">{cmd.key}</strong>
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Real-time Coordinates & Help */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        <div className="flex items-center gap-3 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[11px]">
          <span className="text-slate-400">
            X: <strong className="text-cyan-400">{coords.x.toFixed(1)}</strong> mm
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Y: <strong className="text-emerald-400">{coords.y.toFixed(1)}</strong> mm
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((p) => !p)}
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
          title="Atajos y comandos de consola"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* Command cheat sheet popup */}
      {showHelp && (
        <div className="absolute bottom-11 right-3 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 text-xs text-slate-200 z-50">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800 font-semibold text-blue-400">
            <span>Comandos y Atajos Rápidos</span>
            <button
              onClick={() => setShowHelp(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1 text-[11px]">
            <div className="flex justify-between"><span className="text-amber-400 font-mono">L, LINEA</span><span>Segmento recto</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">C, CIRCULO</span><span>Circunferencia</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">M, COTA</span><span>Cota ISO normalizada</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">MED, MEDIATRIZ</span><span>Mediatriz de segmento</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">BIS, BISECTRIZ</span><span>Bisectriz de ángulo</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">TALES</span><span>División proporcional</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">TRIM, RECORTAR</span><span>Recorte por intersección</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">DIST, MEDIR</span><span>Cinta métrica informativa</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">MIRROR</span><span>Simetría axial</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">DXF</span><span>Exportar a AutoCAD DXF</span></div>
            <div className="flex justify-between"><span className="text-amber-400 font-mono">CLEAR</span><span>Vaciar lámina</span></div>
            <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              Consejo: Puedes teclear números directamente durante el trazado y pulsar Enter para fijar la medida exacta en milímetros.
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
