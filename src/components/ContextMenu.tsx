/**
 * VektorCAD - Canvas Right-Click Context Menu
 * Rapid technical CAD operations directly on entities or blank sheet
 */

import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Trash2,
  Sparkles,
  Maximize2,
  HelpCircle,
  X,
  Split,
  Combine,
  Layers,
  FlipHorizontal,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CadEntity } from '../cad/types.ts';

export interface ContextMenuProps {
  x: number;
  y: number;
  selectedEntities: CadEntity[];
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUngroup?: () => void;
  onClosePolygon?: () => void;
  onMirror?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onPurge: () => void;
  onResetZoom: () => void;
  onOpenShortcuts: () => void;
  onCancelAction: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  selectedEntities,
  onClose,
  onDuplicate,
  onDelete,
  onUngroup,
  onClosePolygon,
  onMirror,
  onBringToFront,
  onSendToBack,
  onPurge,
  onResetZoom,
  onOpenShortcuts,
  onCancelAction,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const hasSelection = selectedEntities.length > 0;
  const hasPolygon = selectedEntities.some((e) => e.type === 'polygon');
  const hasMultipleLines =
    selectedEntities.filter((e) => e.type === 'line' || e.type === 'measure').length >= 2;

  // Clamp menu inside screen viewport
  const menuWidth = 240;
  const menuHeight = hasSelection ? 300 : 180;
  const safeX = Math.min(x, window.innerWidth - menuWidth - 12);
  const safeY = Math.min(y, window.innerHeight - menuHeight - 12);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-60 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-2xl py-1 text-xs text-slate-200 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ left: `${Math.max(8, safeX)}px`, top: `${Math.max(8, safeY)}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header status */}
      <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span>{hasSelection ? `${selectedEntities.length} elemento(s)` : 'Lienzo técnico'}</span>
        <span className="text-slate-500">CAD Context</span>
      </div>

      {/* Selection specific actions */}
      {hasSelection && (
        <div className="py-1 border-b border-slate-800/80">
          {hasPolygon && onUngroup && (
            <button
              onClick={() => {
                onUngroup();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-sky-600/30 text-sky-300 hover:text-white transition-colors text-left"
            >
              <Split size={14} className="text-sky-400" />
              <span>Desagrupar en segmentos</span>
            </button>
          )}

          {hasMultipleLines && onClosePolygon && (
            <button
              onClick={() => {
                onClosePolygon();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-emerald-600/30 text-emerald-300 hover:text-white transition-colors text-left"
            >
              <Combine size={14} className="text-emerald-400" />
              <span>Cerrar a polígono con relleno</span>
            </button>
          )}

          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Copy size={14} className="text-slate-400" />
              <span>Duplicar</span>
            </div>
            <kbd className="text-[10px] text-slate-500 font-mono">Ctrl+D</kbd>
          </button>

          {onMirror && (
            <button
              onClick={() => {
                onMirror();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <FlipHorizontal size={14} className="text-slate-400" />
              <span>Simetría horizontal (Mirror)</span>
            </button>
          )}

          {onBringToFront && (
            <button
              onClick={() => {
                onBringToFront();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <ChevronUp size={14} className="text-slate-400" />
              <span>Traer al frente</span>
            </button>
          )}

          {onSendToBack && (
            <button
              onClick={() => {
                onSendToBack();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <ChevronDown size={14} className="text-slate-400" />
              <span>Enviar al fondo</span>
            </button>
          )}

          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={14} className="text-rose-400" />
              <span>Eliminar</span>
            </div>
            <kbd className="text-[10px] text-rose-500/70 font-mono">Supr</kbd>
          </button>
        </div>
      )}

      {/* Global canvas actions */}
      <div className="py-1">
        <button
          onClick={() => {
            onPurge();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-800 hover:text-amber-300 transition-colors text-left text-slate-300"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>Purgar y limpiar lámina</span>
        </button>

        <button
          onClick={() => {
            onResetZoom();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left text-slate-300"
        >
          <div className="flex items-center gap-2.5">
            <Maximize2 size={14} className="text-slate-400" />
            <span>Ajustar vista al 100%</span>
          </div>
          <kbd className="text-[10px] text-slate-500 font-mono">Z</kbd>
        </button>

        <button
          onClick={() => {
            onOpenShortcuts();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 hover:text-sky-300 transition-colors text-left text-slate-300"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle size={14} className="text-sky-400" />
            <span>Guía de atajos y teclado</span>
          </div>
          <kbd className="text-[10px] text-sky-400 font-mono">?</kbd>
        </button>

        <button
          onClick={() => {
            onCancelAction();
            onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 hover:text-white transition-colors text-left text-slate-400"
        >
          <div className="flex items-center gap-2.5">
            <X size={14} className="text-slate-500" />
            <span>Cancelar acción</span>
          </div>
          <kbd className="text-[10px] text-slate-500 font-mono">Esc</kbd>
        </button>
      </div>
    </div>
  );
};
