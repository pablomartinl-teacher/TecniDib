/**
 * PropertyBar for technical line styles, snaps, grid, colors, and dynamic tool parameters
 */

import React from 'react';
import { EntityStyle, DashStyle, MarkerStyle, SymbolType, ToolType, GridMode, Isoplane } from '../cad/types.ts';
import { Magnet, Grid, Lock, Palette, Box } from 'lucide-react';

interface PropertyBarProps {
  currentTool: ToolType;
  style: EntityStyle;
  onChangeStyle: (newStyle: Partial<EntityStyle>) => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  isCtrlHeld?: boolean;
  gridSnapEnabled: boolean;
  onToggleGridSnap: () => void;
  gridPitch: number;
  onChangeGridPitch: (pitch: number) => void;
  gridMode?: GridMode;
  onChangeGridMode?: (mode: GridMode) => void;
  isoplane?: Isoplane;
  onChangeIsoplane?: (iso: Isoplane) => void;
  orthoMode: boolean;
  onToggleOrtho: () => void;
  polySides: number;
  onChangePolySides: (sides: number) => void;
  symbolType: SymbolType;
  onChangeSymbolType: (sym: SymbolType) => void;
  paperTheme: 'white' | 'blueprint' | 'dark' | 'cream';
  onChangePaperTheme: (theme: 'white' | 'blueprint' | 'dark' | 'cream') => void;
  selectedCount?: number;
}

export const PropertyBar: React.FC<PropertyBarProps> = ({
  currentTool,
  style,
  onChangeStyle,
  snapEnabled,
  onToggleSnap,
  isCtrlHeld = false,
  gridSnapEnabled,
  onToggleGridSnap,
  gridPitch,
  onChangeGridPitch,
  gridMode = 'orthogonal',
  onChangeGridMode,
  isoplane = 'top',
  onChangeIsoplane,
  orthoMode,
  onToggleOrtho,
  polySides,
  onChangePolySides,
  symbolType,
  onChangeSymbolType,
  paperTheme,
  onChangePaperTheme,
  selectedCount = 0,
}) => {
  return (
    <div className="h-10 bg-[#16171d] border-b border-[#2d313d] flex items-center justify-between px-3 text-xs text-neutral-300 select-none z-20 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-3">
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Snap magnet toggle */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
            isCtrlHeld && snapEnabled
              ? 'bg-amber-600/90 text-white border-amber-500 shadow-sm animate-pulse'
              : snapEnabled
              ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-sm'
              : 'bg-[#22242c] text-neutral-400 border-[#333744] hover:text-white'
          }`}
          title={
            isCtrlHeld && snapEnabled
              ? 'Imán en pausa temporal mientras mantienes pulsada la tecla Control (se reactivará al soltar)'
              : 'Imantado Magnético Automático (Extremos, Medios, Centros, Intersecciones). Mantén pulsado Ctrl para pausarlo temporalmente.'
          }
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>{isCtrlHeld && snapEnabled ? 'Imán PAUSA (Ctrl)' : snapEnabled ? 'Imán ON' : 'Imán OFF'}</span>
        </button>

        {/* Grid Snap & Pitch */}
        <div className="flex items-center gap-1 bg-[#20222a] px-2 py-0.5 rounded-md border border-[#333744] shrink-0">
          <button
            onClick={onToggleGridSnap}
            className={`flex items-center gap-1 p-1 rounded text-xs transition whitespace-nowrap ${
              gridSnapEnabled ? 'text-sky-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Activar/Desactivar ajuste a la rejilla métrica"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Rejilla</span>
          </button>
          <select
            value={gridPitch}
            onChange={(e) => onChangeGridPitch(parseInt(e.target.value))}
            className="bg-transparent text-[11px] text-neutral-200 outline-none cursor-pointer"
            title="Paso de rejilla en mm"
          >
            <option value="1">1 mm</option>
            <option value="5">5 mm</option>
            <option value="10">10 mm</option>
            <option value="20">20 mm</option>
          </select>
        </div>

        {/* Axonometric / Isometric Grid Mode Selector */}
        <div className="flex items-center gap-1 bg-[#20222a] px-2 py-0.5 rounded-md border border-[#333744] shrink-0">
          <select
            value={gridMode}
            onChange={(e) => onChangeGridMode?.(e.target.value as GridMode)}
            className="bg-transparent text-[11px] text-sky-400 font-semibold outline-none cursor-pointer"
            title="Sistema de Referencia: Cuadrícula Cartesiana o Axonometría"
          >
            <option value="orthogonal">📐 Cartesiana 90º</option>
            <option value="isometric">🔺 Isométrica 30º-150º</option>
            <option value="cavalier">📏 Caballera 45º</option>
          </select>
        </div>

        {/* Isoplane Selector (Top / Left / Right) when in Isometric Mode */}
        {gridMode === 'isometric' && (
          <div className="flex items-center gap-1 bg-sky-950/70 border border-sky-600/70 rounded-md px-1.5 py-0.5 shadow-sm">
            <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">Isoplano:</span>
            <button
              type="button"
              onClick={() => onChangeIsoplane?.('top')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                isoplane === 'top' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Isoplano Superior (Planta) [30º / 150º]"
            >
              Sup
            </button>
            <button
              type="button"
              onClick={() => onChangeIsoplane?.('left')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                isoplane === 'left' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Isoplano Izquierdo (Perfil) [90º / 150º]"
            >
              Izq
            </button>
            <button
              type="button"
              onClick={() => onChangeIsoplane?.('right')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                isoplane === 'right' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Isoplano Derecho (Alzado) [90º / 30º]"
            >
              Der
            </button>
          </div>
        )}

        {/* Ortho Lock (Shift) */}
        <button
          onClick={onToggleOrtho}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition border ${
            orthoMode
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-[#20222a] text-neutral-400 border-[#333744] hover:text-white'
          }`}
          title="Modo Ortogonal (0º, 45º, 90º, 180º) [Tecla: Shift]"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Orto</span>
        </button>

        <div className="h-4 border-r border-[#2d313d]" />

        {/* Selection indicator */}
        {selectedCount > 0 && (
          <span className="bg-sky-500/20 text-sky-400 text-[10px] px-2 py-0.5 rounded font-semibold border border-sky-500/40 animate-pulse">
            {selectedCount === 1 ? '1 seleccionado' : `${selectedCount} seleccionados`}
          </span>
        )}

        {/* Color picker (Trazo) */}
        <div className="flex items-center gap-1.5" title="Color del trazo">
          <span className="text-neutral-400">Trazo:</span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={style.color}
              onChange={(e) => onChangeStyle({ color: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
        </div>

        {/* Fill Color (Relleno / Fondo) */}
        <div className="flex items-center gap-1.5" title="Color de fondo o relleno de formas cerradas">
          <span className="text-neutral-400">Relleno:</span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={
                style.fillColor && style.fillColor !== 'none' && style.fillColor !== 'transparent'
                  ? style.fillColor
                  : '#38bdf8'
              }
              onChange={(e) => onChangeStyle({ fillColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                const isNone =
                  !style.fillColor ||
                  style.fillColor === 'none' ||
                  style.fillColor === 'transparent';
                onChangeStyle({ fillColor: isNone ? '#38bdf8' : 'none' });
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition border ${
                style.fillColor &&
                style.fillColor !== 'none' &&
                style.fillColor !== 'transparent'
                  ? 'bg-sky-950 text-sky-300 border-sky-700'
                  : 'bg-[#20222a] text-neutral-400 border-[#333744] hover:text-white'
              }`}
              title="Activar/Desactivar relleno de figuras"
            >
              {style.fillColor &&
              style.fillColor !== 'none' &&
              style.fillColor !== 'transparent'
                ? 'Con relleno'
                : 'Sin relleno'}
            </button>
          </div>
        </div>

        {/* Line Thickness (Normalized UNE) */}
        <div className="flex items-center gap-1.5" title="Grosor normalizado UNE (mm)">
          <span className="text-neutral-400">Grosor:</span>
          <select
            value={style.width}
            onChange={(e) => onChangeStyle({ width: parseFloat(e.target.value) })}
            className="bg-[#20222a] text-white border border-[#333744] rounded px-1.5 py-0.5 text-xs font-mono"
          >
            <option value="0.2">0.2 mm (Auxiliar)</option>
            <option value="0.35">0.35 mm (Normal)</option>
            <option value="0.5">0.5 mm (Principal)</option>
            <option value="0.7">0.7 mm (Contorno)</option>
            <option value="1.0">1.0 mm (Marco)</option>
            <option value="1.4">1.4 mm (Grueso)</option>
          </select>
        </div>

        {/* Dash Type */}
        <div className="flex items-center gap-1.5" title="Tipo de trazo">
          <span className="text-neutral-400">Trazo:</span>
          <select
            value={style.dash}
            onChange={(e) => onChangeStyle({ dash: e.target.value as DashStyle })}
            className="bg-[#20222a] text-white border border-[#333744] rounded px-1.5 py-0.5 text-xs"
          >
            <option value="none">Continua (Tipo A)</option>
            <option value="6,2">Trazos (Tipo E - Ocultas)</option>
            <option value="10,2,2,2">Trazo y punto (Tipo G - Ejes)</option>
            <option value="3,3">Trazos finos (Tipo F)</option>
          </select>
        </div>

        {/* Marker Finishing */}
        <div className="flex items-center gap-1.5" title="Acabado de extremos">
          <span className="text-neutral-400">Acabado:</span>
          <select
            value={style.marker}
            onChange={(e) => onChangeStyle({ marker: e.target.value as MarkerStyle })}
            className="bg-[#20222a] text-white border border-[#333744] rounded px-1.5 py-0.5 text-xs"
          >
            <option value="none">Ninguno</option>
            <option value="arrow">Flechas ISO</option>
            <option value="tick">Líneas 45º</option>
          </select>
        </div>

        {/* Dynamic: Polygon sides */}
        {currentTool === 'polygon' && (
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span>Lados:</span>
            <input
              type="number"
              min="3"
              max="24"
              value={polySides}
              onChange={(e) => onChangePolySides(parseInt(e.target.value) || 5)}
              className="w-12 bg-[#20222a] text-white border border-[#333744] rounded px-1 py-0.5 text-center"
            />
          </div>
        )}

        {/* Dynamic: Symbol Type */}
        {currentTool === 'symbol' && (
          <div className="flex items-center gap-1.5 text-sky-400 font-medium">
            <span>Símbolo:</span>
            <select
              value={symbolType}
              onChange={(e) => onChangeSymbolType(e.target.value as SymbolType)}
              className="bg-[#20222a] text-white border border-[#333744] rounded px-1.5 py-0.5 text-xs"
            >
              <option value="perp">Perpendicular (⟂)</option>
              <option value="para">Paralelo (//)</option>
              <option value="coin">Coincidente (≡)</option>
              <option value="angle">Ángulo (∡)</option>
              <option value="center">Centro (+)</option>
            </select>
          </div>
        )}
      </div>

      {/* Right side: Paper Theme Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-neutral-400 hidden xl:inline text-[11px]">Tema Lámina:</span>
        <div className="flex items-center bg-[#20222a] p-0.5 rounded-lg border border-[#333744] text-[11px]">
          <button
            onClick={() => onChangePaperTheme('white')}
            className={`px-2 py-0.5 rounded transition ${
              paperTheme === 'white' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Lámina blanca tradicional (Papel Canson)"
          >
            Blanco
          </button>
          <button
            onClick={() => onChangePaperTheme('blueprint')}
            className={`px-2 py-0.5 rounded transition ${
              paperTheme === 'blueprint' ? 'bg-blue-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Cianotipia / Blueprint Técnico"
          >
            Blueprint
          </button>
          <button
            onClick={() => onChangePaperTheme('dark')}
            className={`px-2 py-0.5 rounded transition ${
              paperTheme === 'dark' ? 'bg-neutral-800 text-sky-400 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
            title="CAD Oscuro Profesional"
          >
            Dark CAD
          </button>
          <button
            onClick={() => onChangePaperTheme('cream')}
            className={`px-2 py-0.5 rounded transition ${
              paperTheme === 'cream' ? 'bg-[#f6f2e8] text-neutral-800 font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
            title="Papel vegetal / pergamino"
          >
            Crema
          </button>
        </div>
      </div>
    </div>
  );
};
