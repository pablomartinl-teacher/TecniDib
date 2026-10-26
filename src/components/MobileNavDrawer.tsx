/**
 * Mobile Navigation Drawer
 * Complete mobile drawer providing 100% access to all CAD project operations,
 * sheet management, formats, exports, didactic tools and APK/PWA installation
 */

import React, { useRef } from 'react';
import {
  X,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  BookOpen,
  FolderOpen,
  Save,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Scissors,
  Square,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2
} from 'lucide-react';
import { SheetSize } from '../cad/types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sheetSize: SheetSize;
  onChangeSheetSize: (newSize: SheetSize) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onOpenPageManager: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenMarginsModal: () => void;
  onOpenCropModal: () => void;
  onImportPDFBase: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveToFile: () => void;
  onLoadFromFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onExportDXF: () => void;
  onNewCanvas: () => void;
  showInstruments: boolean;
  onToggleInstruments: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  showPlayer: boolean;
  onTogglePlayer: () => void;
  onOpenStudyModal: () => void;
  onPurge?: () => void;
  onOpenShortcuts?: () => void;
  hasBgImage?: boolean;
  showBgImage?: boolean;
  onToggleBgImage?: () => void;
  onRemoveBgImage?: () => void;
  onResetZoom: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  sheetSize,
  onChangeSheetSize,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  onDeletePage,
  onOpenPageManager,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenMarginsModal,
  onOpenCropModal,
  onImportPDFBase,
  onSaveToFile,
  onLoadFromFile,
  onExportPDF,
  onExportSVG,
  onExportDXF,
  onNewCanvas,
  showInstruments,
  onToggleInstruments,
  showInspector,
  onToggleInspector,
  showPlayer,
  onTogglePlayer,
  onOpenStudyModal,
  onPurge,
  onOpenShortcuts,
  hasBgImage = false,
  showBgImage = true,
  onToggleBgImage,
  onRemoveBgImage,
  onResetZoom,
}) => {
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCustomSize = () => {
    const w = prompt('Ancho de la lámina en mm:', sheetSize.w.toString());
    const h = prompt('Alto de la lámina en mm:', sheetSize.h.toString());
    if (w && h) {
      const numW = parseFloat(w);
      const numH = parseFloat(h);
      if (numW > 20 && numH > 20) {
        onChangeSheetSize({
          name: `${numW}x${numH} mm`,
          w: numW,
          h: numH,
          orientation: numW > numH ? 'landscape' : 'portrait',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm h-full bg-[#181920] border-l border-[#2e323e] flex flex-col shadow-2xl text-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 bg-[#14151b] border-b border-[#2e323e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-600 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                Vektor<span className="text-sky-400">CAD</span> Móvil
              </div>
              <div className="text-[10px] text-neutral-400">Panel de Proyecto y Herramientas</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#22242c] text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* APK / PWA Install Card */}
          <div>
            <PWAInstallButton variant="drawer" />
          </div>

          {/* Sheet & Navigation */}
          <div className="bg-[#1e2029] rounded-xl border border-[#2d313d] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Lámina Actual</span>
              <button
                onClick={handleCustomSize}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#13141a] border border-[#333742] text-neutral-300 hover:text-white"
              >
                📏 {sheetSize.w} x {sheetSize.h} mm
              </button>
            </div>

            {/* Quick preset sizes */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() =>
                  onChangeSheetSize({ name: 'DIN A4 Horizontal', w: 297, h: 210, orientation: 'landscape' })
                }
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] transition ${
                  sheetSize.w === 297 && sheetSize.h === 210
                    ? 'border-sky-500 bg-sky-950/50 text-white font-semibold'
                    : 'border-[#2d313d] bg-[#14151a] text-neutral-400'
                }`}
              >
                DIN A4 Horizontal (297×210)
              </button>
              <button
                onClick={() =>
                  onChangeSheetSize({ name: 'DIN A4 Vertical', w: 210, h: 297, orientation: 'portrait' })
                }
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] transition ${
                  sheetSize.w === 210 && sheetSize.h === 297
                    ? 'border-sky-500 bg-sky-950/50 text-white font-semibold'
                    : 'border-[#2d313d] bg-[#14151a] text-neutral-400'
                }`}
              >
                DIN A4 Vertical (210×297)
              </button>
              <button
                onClick={() =>
                  onChangeSheetSize({ name: 'DIN A3 Horizontal', w: 420, h: 297, orientation: 'landscape' })
                }
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] transition ${
                  sheetSize.w === 420 && sheetSize.h === 297
                    ? 'border-sky-500 bg-sky-950/50 text-white font-semibold'
                    : 'border-[#2d313d] bg-[#14151a] text-neutral-400'
                }`}
              >
                DIN A3 Horizontal (420×297)
              </button>
              <button
                onClick={onResetZoom}
                className="py-1.5 px-2 rounded-lg border border-[#2d313d] bg-[#14151a] text-neutral-300 hover:text-white flex items-center justify-center gap-1 text-[11px]"
              >
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Ajustar Zoom 100%</span>
              </button>
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a2d38]">
              <div className="flex items-center gap-1">
                <button
                  onClick={onPrevPage}
                  disabled={currentPage <= 0}
                  className="p-1.5 rounded-lg bg-[#14151a] border border-[#2d313d] text-neutral-300 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-neutral-200">
                  Lámina {currentPage + 1} de {totalPages}
                </span>
                <button
                  onClick={onNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="p-1.5 rounded-lg bg-[#14151a] border border-[#2d313d] text-neutral-300 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onAddPage}
                  className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 hover:text-emerald-300"
                  title="Añadir nueva lámina"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {totalPages > 1 && (
                  <button
                    onClick={onDeletePage}
                    className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-400"
                    title="Eliminar lámina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenPageManager();
                  }}
                  className="p-1.5 rounded-lg bg-sky-950/60 border border-sky-600/40 text-sky-400"
                  title="Gestor de láminas"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Export section */}
          <div className="bg-[#1e2029] rounded-xl border border-[#2d313d] p-3 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Exportar Proyecto</span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onExportPDF();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Exportar a PDF (Impresión 1:1)</span>
                </div>
                <span className="text-[10px] bg-rose-800/80 px-2 py-0.5 rounded">300 DPI</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onSaveToFile();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-sky-600/40 text-sky-300 font-semibold text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-sky-400" />
                  <span>Guardar Proyecto (.vektor)</span>
                </div>
                <span className="text-[10px] text-neutral-400">Propio</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onExportDXF();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>DXF (AutoCAD)</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onExportSVG();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium transition"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>SVG Vectorial</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import section */}
          <div className="bg-[#1e2029] rounded-xl border border-[#2d313d] p-3 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Importar y Fondos</span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium transition"
              >
                <FolderOpen className="w-4 h-4 text-sky-400" />
                <span>Abrir archivo .vektor</span>
              </button>

              <button
                onClick={() => pdfInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium transition"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Cargar PDF base de fondo</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenCropModal();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium transition"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Insertar recorte / foto de enunciado</span>
              </button>
            </div>
          </div>

          {/* Technical Drawing & Instrumental */}
          <div className="bg-[#1e2029] rounded-xl border border-[#2d313d] p-3 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Instrumental Técnico</span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onToggleInstruments();
                  onClose();
                }}
                className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                  showInstruments
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-[#14151a] text-neutral-300 border-[#2d313d]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Escuadra/Cartabón</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenMarginsModal();
                }}
                className="p-2.5 rounded-lg bg-[#14151a] hover:bg-[#252833] border border-[#2d313d] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Square className="w-4 h-4 text-sky-400" />
                <span>Márgenes UNE</span>
              </button>

              <button
                onClick={() => {
                  onToggleInspector();
                  onClose();
                }}
                className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                  showInspector
                    ? 'bg-sky-600 text-white border-sky-500'
                    : 'bg-[#14151a] text-neutral-300 border-[#2d313d]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Inspector y Capas</span>
              </button>

              <button
                onClick={() => {
                  onTogglePlayer();
                  onClose();
                }}
                className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                  showPlayer
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-[#14151a] text-neutral-300 border-[#2d313d]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Paso a Paso</span>
              </button>
            </div>
          </div>

          {/* Didactic & Help */}
          <div className="bg-[#1e2029] rounded-xl border border-[#2d313d] p-3 space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Ayuda y Didáctica</span>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenStudyModal();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-sky-950/40 border border-sky-600/40 text-sky-300 text-xs font-semibold transition"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Estudio de Arquitectura Técnica CAD</span>
              </button>

              {onPurge && (
                <button
                  onClick={() => {
                    onClose();
                    onPurge();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-600/30 text-amber-300 text-xs font-medium transition"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Purgar lámina (limpiar huérfanos)</span>
                </button>
              )}

              {onOpenShortcuts && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenShortcuts();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#14151a] border border-[#2d313d] text-neutral-300 text-xs font-medium transition"
                >
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>Guía de atajos de teclado y comandos</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onNewCanvas();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-rose-950/30 border border-rose-600/30 text-rose-300 text-xs font-medium transition"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Nuevo lienzo en blanco</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            onImportPDFBase(e);
            onClose();
          }}
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".vektor,.json"
          className="hidden"
          onChange={(e) => {
            onLoadFromFile(e);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
