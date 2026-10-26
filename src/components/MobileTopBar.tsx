/**
 * Mobile Top Bar for VektorCAD
 * Streamlined mobile header with page switching, undo/redo, mobile mode toggle, and menu drawer
 */

import React from 'react';
import {
  Menu,
  Undo2,
  Redo2,
  Plus,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { SheetSize } from '../cad/types.ts';

interface MobileTopBarProps {
  sheetSize: SheetSize;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  onOpenMenu: () => void;
  saveStatus: string;
  zoomLevel?: number;
  onZoomChange?: (delta: number) => void;
  onResetZoom?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  sheetSize,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isMobileMode,
  onToggleMobileMode,
  onOpenMenu,
  saveStatus,
  zoomLevel,
  onZoomChange,
  onResetZoom,
}) => {
  return (
    <header className="h-12 bg-[#16171d] border-b border-[#2d313d] flex items-center justify-between px-2.5 z-30 select-none text-white shrink-0">
      {/* Brand & Page Navigator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-sm">
          <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center font-mono text-[10px] text-white">
            V
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            VektorCAD
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 gap-0.5 text-xs">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-neutral-300">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onAddPage}
            className="p-1 rounded text-emerald-400 hover:text-emerald-300 transition"
            title="Añadir nueva lámina"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Mobile Mode toggle badge & Quick Zoom Stepper */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleMobileMode}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition ${
            isMobileMode
              ? 'bg-sky-600/30 text-sky-300 border-sky-400 shadow-sm'
              : 'bg-[#22242c] text-neutral-400 border-[#333744] hover:text-white'
          }`}
          title="Modo móvil activo (toca para cambiar a vista de escritorio)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="text-[11px]">Móvil</span>
        </button>

        {/* Quick Zoom Stepper */}
        {zoomLevel !== undefined && onZoomChange && onResetZoom && (
          <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 gap-0.5 text-xs">
            <button
              onClick={() => onZoomChange(-15)}
              className="p-1 rounded text-neutral-400 hover:text-white active:scale-95 transition"
              title="Alejar lámina (Zoom -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetZoom}
              className="font-mono text-[11px] px-1 text-neutral-300 hover:text-sky-300 font-bold transition"
              title="Ajustar zoom al 100%"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => onZoomChange(15)}
              className="p-1 rounded text-neutral-400 hover:text-white active:scale-95 transition"
              title="Acercar lámina (Zoom +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right: Undo, Redo, Menu Drawer Button */}
      <div className="flex items-center gap-1">
        {saveStatus && (
          <span className="hidden md:inline text-[10px] text-emerald-400 truncate max-w-[100px]">
            {saveStatus}
          </span>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-neutral-300 hover:text-white disabled:opacity-30 transition"
            title="Deshacer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-neutral-300 hover:text-white disabled:opacity-30 transition"
            title="Rehacer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Menu Hamburger */}
        <button
          onClick={onOpenMenu}
          className="p-2 rounded-lg bg-[#22242c] hover:bg-[#2c303c] border border-[#333742] text-white transition flex items-center justify-center"
          title="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
