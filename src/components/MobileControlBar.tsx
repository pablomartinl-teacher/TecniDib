/**
 * Mobile Floating Quick Controls for VektorCAD
 * Provides immediate touch switches for Snapping, Ortho, Grid, Zoom and PDF Base Lock
 */

import React, { useState } from 'react';
import {
  Magnet,
  Grid,
  Lock,
  Unlock,
  Maximize2,
  FileText,
  Sliders,
  Palette,
} from 'lucide-react';
import { EntityStyle } from '../cad/types.ts';

interface MobileControlBarProps {
  snapEnabled: boolean;
  onToggleSnap: () => void;
  orthoMode: boolean;
  onToggleOrtho: () => void;
  gridSnapEnabled: boolean;
  onToggleGridSnap: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  hasBgImage: boolean;
  bgImageLocked: boolean;
  onToggleBgImageLock: () => void;
  currentStyle: EntityStyle;
  onChangeStyle: (newStyle: Partial<EntityStyle>) => void;
}

export const MobileControlBar: React.FC<MobileControlBarProps> = ({
  snapEnabled,
  onToggleSnap,
  orthoMode,
  onToggleOrtho,
  gridSnapEnabled,
  onToggleGridSnap,
  onResetZoom,
  zoomLevel,
  hasBgImage,
  bgImageLocked,
  onToggleBgImageLock,
  currentStyle,
  onChangeStyle,
}) => {
  const [showStylePicker, setShowStylePicker] = useState(false);

  return (
    <>
      {/* Floating Quick Style Drawer */}
      {showStylePicker && (
        <div className="fixed bottom-28 left-3 right-3 z-30 p-3 rounded-2xl bg-[#16171d]/95 backdrop-blur-md border border-[#2d313d] shadow-2xl text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#2d313d] pb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-sky-400" />
              Trazo Técnico UNE
            </span>
            <button
              onClick={() => setShowStylePicker(false)}
              className="text-neutral-400 hover:text-white font-medium"
            >
              Cerrar
            </button>
          </div>

          {/* Width presets */}
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1.5">
              Grosor Normalizado:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { w: 0.2, label: '0.2 mm', desc: 'Fino / Auxiliar' },
                { w: 0.5, label: '0.5 mm', desc: 'Principal' },
                { w: 0.8, label: '0.8 mm', desc: 'Grueso' },
              ].map((preset) => (
                <button
                  key={preset.w}
                  onClick={() => onChangeStyle({ width: preset.w })}
                  className={`p-2 rounded-xl border text-center transition ${
                    currentStyle.width === preset.w
                      ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                      : 'bg-[#20222a] border-[#2f323e] text-neutral-300'
                  }`}
                >
                  <div className="font-bold">{preset.label}</div>
                  <div className="text-[9px] text-neutral-400">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1.5">Color:</div>
            <div className="flex items-center gap-2">
              {['#000000', '#0284c7', '#dc2626', '#16a34a', '#d97706', '#9333ea'].map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeStyle({ color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    currentStyle.color === c ? 'border-white scale-110 shadow-md' : 'border-neutral-600'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating horizontal pill toolbar */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-[#16171d]/90 backdrop-blur-md border border-[#2d313d] rounded-full shadow-2xl max-w-[95vw] overflow-x-auto [scrollbar-width:none]">
        {/* Magnet / Snap */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition ${
            snapEnabled
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[#22242c] text-neutral-400 hover:text-white'
          }`}
        >
          <Magnet className="w-3.5 h-3.5" />
          <span>Imán</span>
        </button>

        {/* Ortho */}
        <button
          onClick={onToggleOrtho}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition ${
            orthoMode
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-[#22242c] text-neutral-400 hover:text-white'
          }`}
        >
          <span>Orto</span>
        </button>

        {/* Grid */}
        <button
          onClick={onToggleGridSnap}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition ${
            gridSnapEnabled
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-[#22242c] text-neutral-400 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Quick Style */}
        <button
          onClick={() => setShowStylePicker((prev) => !prev)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-[#22242c] text-neutral-200 hover:text-white"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-neutral-500"
            style={{ backgroundColor: currentStyle.color }}
          />
          <span>{currentStyle.width}mm</span>
        </button>

        {/* Reset Zoom */}
        <button
          onClick={onResetZoom}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#22242c] text-neutral-300 hover:text-white"
          title="Ajustar lámina al 100%"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{zoomLevel}%</span>
        </button>

        {/* PDF Base Lock / Unlock Toggle when background PDF is present */}
        {hasBgImage && (
          <button
            onClick={onToggleBgImageLock}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition ${
              bgImageLocked
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 animate-pulse'
            }`}
            title="Bloquear/Desbloquear PDF de base"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            {bgImageLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{bgImageLocked ? 'Bloqueado' : 'Libre'}</span>
          </button>
        )}
      </div>
    </>
  );
};
