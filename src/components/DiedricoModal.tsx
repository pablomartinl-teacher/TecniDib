/**
 * VektorCAD - Dihedral & Axonometric System Configuration Modal
 * Allows selecting views (Alzado, Planta, Perfiles) and 3D Axonometric System (Isométrica, Caballera, Militar)
 */

import React, { useState } from 'react';
import { X, Layers, Box, Check, Compass, Eye } from 'lucide-react';
import { AxonometricSystem, DiedricoConfig } from '../cad/geometry.ts';

interface DiedricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: DiedricoConfig) => void;
}

export const DiedricoModal: React.FC<DiedricoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [alzado, setAlzado] = useState(true);
  const [planta, setPlanta] = useState(true);
  const [perfilIzq, setPerfilIzq] = useState(true);
  const [perfilDer, setPerfilDer] = useState(false);
  const [groundLine, setGroundLine] = useState(true);
  const [axonSystem, setAxonSystem] = useState<AxonometricSystem>('isometric');
  const [includePrism, setIncludePrism] = useState(true);

  if (!isOpen) return null;

  const handleApply = () => {
    onConfirm({
      views: {
        alzado,
        planta,
        perfilIzq,
        perfilDer,
        groundLine,
      },
      axonometricSystem: axonSystem,
      includePrism,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#181a20] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-600/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Configurar Sistema Diédrico y Axonometría</h3>
              <p className="text-xs text-slate-400">Norma UNE-EN ISO 5456-2 • Selección de Vistas y Perspectiva 3D</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          {/* 1. Vistas diédricas normalizadas */}
          <div>
            <label className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              1. Vistas Normalizadas a Incluir
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={alzado}
                  onChange={(e) => setAlzado(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                />
                <span className="text-xs font-medium">Alzado (Frontal)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={planta}
                  onChange={(e) => setPlanta(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                />
                <span className="text-xs font-medium">Planta (Superior)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={perfilIzq}
                  onChange={(e) => setPerfilIzq(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                />
                <span className="text-xs font-medium">Perfil Izquierdo</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={perfilDer}
                  onChange={(e) => setPerfilDer(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                />
                <span className="text-xs font-medium">Perfil Derecho</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition col-span-2 border-t border-slate-800/80 mt-1 pt-2">
                <input
                  type="checkbox"
                  checked={groundLine}
                  onChange={(e) => setGroundLine(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 accent-sky-500"
                />
                <span className="text-xs text-slate-300 font-medium">Línea de Tierra (LT) y Ejes de Abatimiento</span>
              </label>
            </div>
          </div>

          {/* 2. Sistema Axonométrico 3D */}
          <div>
            <label className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              2. Sistema de Representación Axonométrica 3D
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Isométrica */}
              <button
                type="button"
                onClick={() => setAxonSystem('isometric')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  axonSystem === 'isometric'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Isométrica</span>
                    {axonSystem === 'isometric' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Ejes a 120º uniformes. Escala 1:1 en los 3 ejes.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-sky-300/80 mt-2">X: 30º • Y: 150º • Z: 90º</span>
              </button>

              {/* Caballera */}
              <button
                type="button"
                onClick={() => setAxonSystem('cavalier')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  axonSystem === 'cavalier'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Caballera</span>
                    {axonSystem === 'cavalier' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Frontal X-Z sin deformar. Y a 135º (red. 1/2).
                  </p>
                </div>
                <span className="text-[10px] font-mono text-sky-300/80 mt-2">X: 0º • Y: 135º (μ=0.5)</span>
              </button>

              {/* Militar */}
              <button
                type="button"
                onClick={() => setAxonSystem('military')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  axonSystem === 'military'
                    ? 'bg-sky-600/20 border-sky-500 text-white shadow-md shadow-sky-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">Militar</span>
                    {axonSystem === 'military' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Planta horizontal a 90º real. Altura Z vertical 1:1.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-sky-300/80 mt-2">Planta 90º • Z: 1:1</span>
              </button>
            </div>
          </div>

          {/* 3. Prisma 3D de referencia */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePrism}
                onChange={(e) => setIncludePrism(e.target.checked)}
                className="rounded text-sky-500 focus:ring-0 accent-sky-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Incluir Prisma Envolvente 3D de Referencia
                </span>
                <span className="text-[11px] text-slate-400">
                  Inserta un cubo auxiliar con aristas vistas y ocultas discontinuas según el sistema elegido
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Generar en Lámina</span>
          </button>
        </div>
      </div>
    </div>
  );
};
