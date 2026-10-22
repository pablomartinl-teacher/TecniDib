/**
 * TopBar Navigation & Action Header
 */

import React, { useRef } from 'react';
import {
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Scissors,
  Square,
  Compass,
  BookOpen,
  FolderOpen,
  Save,
  CheckCircle2,
  Layers,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import { SheetSize } from '../cad/types.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface TopBarProps {
  sheetSize: SheetSize;
  onChangeSheetSize: (newSize: SheetSize) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onMovePage: () => void;
  onDeletePage: () => void;
  onOpenPageManager: () => void;
  zoomLevel: number;
  onZoomChange: (delta: number) => void;
  onResetZoom: () => void;
  coords: { x: number; y: number };
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
  saveStatus: string;
  onPurge?: () => void;
  onOpenShortcuts?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  hasBgImage?: boolean;
  showBgImage?: boolean;
  onToggleBgImage?: () => void;
  onRemoveBgImage?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  sheetSize,
  onChangeSheetSize,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  onMovePage,
  onDeletePage,
  onOpenPageManager,
  zoomLevel,
  onZoomChange,
  onResetZoom,
  coords,
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
  saveStatus,
  onPurge,
  onOpenShortcuts,
  isFocusMode = false,
  onToggleFocusMode,
  hasBgImage = false,
  showBgImage = true,
  onToggleBgImage,
  onRemoveBgImage,
}) => {
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

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
    <header className="h-12 bg-[#1b1d24] border-b border-[#2d313d] flex items-center justify-between px-3 text-neutral-200 select-none z-30 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden gap-3">
      {/* Left side: Brand, Sheet format, Page navigation, Zoom */}
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-white mr-1 shrink-0">
          <span className="p-1 bg-sky-600 rounded-md text-white shadow-sm flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </span>
          <span className="text-sm hidden sm:inline text-sky-400">Vektor<span className="text-white">CAD</span></span>
        </div>

        {/* Sheet Format Selector */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 shrink-0">
          <button
            onClick={handleCustomSize}
            className="px-2 py-1 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#252833] rounded transition flex items-center gap-1 whitespace-nowrap"
            title="Cambiar dimensiones de la lámina"
          >
            📏 {sheetSize.w} x {sheetSize.h} mm
          </button>
        </div>

        {/* Multi-page controller */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 gap-0.5">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 0}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 hover:bg-[#252833] transition"
            title="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 font-semibold text-neutral-300 min-w-[50px] text-center">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages - 1}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 hover:bg-[#252833] transition"
            title="Página siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onAddPage}
            className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition"
            title="Añadir nueva lámina"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {totalPages > 1 && (
            <button
              onClick={onDeletePage}
              className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
              title="Eliminar lámina actual"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onOpenPageManager}
            className="p-1 rounded text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 transition"
            title="Reorganizar y gestionar orden de las láminas"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 gap-0.5">
          <button
            onClick={() => onZoomChange(-15)}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#252833] transition"
            title="Alejar (Ctrl + Rueda Abajo)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="text-[11px] font-mono font-medium px-1.5 text-neutral-300 hover:text-white"
            title="Ajustar zoom al 100%"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={() => onZoomChange(15)}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-[#252833] transition"
            title="Acercar (Ctrl + Rueda Arriba)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {saveStatus && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Right side: Tools, Imports, Exports & Study */}
      <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap ml-auto">
        {/* Virtual Escuadra/Cartabón Toggle */}
        <button
          onClick={onToggleInstruments}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 border ${
            showInstruments
              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
              : 'bg-[#22242c] text-neutral-300 hover:text-white border-[#333742]'
          }`}
          title="Simulación didáctica de Escuadra y Cartabón"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Escuadra/Cartabón</span>
        </button>

        {/* Margins */}
        <button
          onClick={onOpenMarginsModal}
          className="px-2 py-1 rounded-lg text-xs font-medium bg-[#22242c] hover:bg-[#2d303b] border border-[#333742] text-neutral-200 transition flex items-center gap-1"
          title="Generar márgenes y cajetín normalizado UNE"
        >
          <Square className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">Márgenes</span>
        </button>

        {/* PDF Base */}
        {hasBgImage ? (
          <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5 gap-1 shrink-0">
            <button
              onClick={onToggleBgImage}
              className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                showBgImage
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                  : 'text-neutral-400 hover:text-white hover:bg-[#252833]'
              }`}
              title={showBgImage ? 'Ocultar PDF base de la lámina' : 'Mostrar PDF base en la lámina'}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{showBgImage ? 'Ocultar PDF' : 'Ver PDF'}</span>
            </button>
            <button
              onClick={onRemoveBgImage}
              className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
              title="Quitar PDF base del lienzo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="px-2 py-1 rounded-lg text-xs font-medium bg-[#22242c] hover:bg-[#2d303b] border border-[#333742] text-neutral-200 transition flex items-center gap-1 shrink-0"
            title="Cargar PDF como fondo de calco/enunciado"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">PDF Base</span>
          </button>
        )}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onImportPDFBase}
        />

        {/* Cropper */}
        <button
          onClick={onOpenCropModal}
          className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-600/90 hover:bg-amber-500 text-white transition flex items-center gap-1 shadow-sm"
          title="Recortar y pegar figuras de ejercicios o PDFs"
        >
          <Scissors className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Recorte</span>
        </button>

        {/* Project Native .vektor Save/Open */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5">
          <button
            onClick={onSaveToFile}
            className="px-1.5 py-1 rounded text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#252833] transition flex items-center gap-1"
            title="Guardar Proyecto en formato nativo VektorCAD (.vektor) - Guarda láminas, capas, cotas y elementos sin pérdida"
          >
            <Save className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline text-[11px] font-mono">.vektor</span>
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="p-1 rounded text-neutral-300 hover:text-white hover:bg-[#252833] transition"
            title="Abrir Proyecto (.vektor, .vkcad, .json)"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".vektor,.vkcad,.json,application/json,application/vnd.vektorcad+json,text/plain"
            className="hidden"
            onChange={onLoadFromFile}
          />
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 hover:bg-[#252833] transition"
            title="Deshacer (Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 hover:bg-[#252833] transition"
            title="Rehacer (Ctrl + Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* PDF & DXF Export */}
        <div className="flex items-center bg-[#13141a] rounded-lg border border-[#2d313d] p-0.5">
          <button
            onClick={onExportPDF}
            className="px-2 py-1 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1 shadow-sm"
            title="Exportar a PDF oficial 1:1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={onExportDXF}
            className="px-2 py-1 rounded text-xs font-semibold hover:bg-[#252833] text-sky-400 hover:text-white transition flex items-center gap-1"
            title="Exportar a DXF de AutoCAD / CNC"
          >
            <span>DXF</span>
          </button>
          <button
            onClick={onExportSVG}
            className="px-1.5 py-1 rounded text-[11px] font-semibold hover:bg-[#252833] text-neutral-300 hover:text-white transition"
            title="Exportar a SVG vectorial puro"
          >
            SVG
          </button>
        </div>

        {/* Inspector Panel Toggle */}
        <button
          onClick={onToggleInspector}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 border ${
            showInspector
              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
              : 'bg-[#22242c] text-neutral-300 hover:text-white border-[#333742]'
          }`}
          title="Panel de Propiedades y Capas"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Capas</span>
        </button>

        {/* Construction Player */}
        <button
          onClick={onTogglePlayer}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 border ${
            showPlayer
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : 'bg-[#22242c] text-neutral-300 hover:text-white border-[#333742]'
          }`}
          title="Reproductor didáctico paso a paso"
        >
          <span className="hidden xl:inline">Paso a Paso</span>
        </button>

        {/* PWA / App Install Button */}
        <PWAInstallButton />

        {/* Study button */}
        <button
          onClick={onOpenStudyModal}
          className="px-2 py-1 rounded-lg text-xs font-semibold bg-sky-900/40 hover:bg-sky-800/60 border border-sky-600/50 text-sky-300 transition flex items-center gap-1"
          title="Ver Estudio de Arquitectura Técnica y Buenas Prácticas CAD"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xl:inline">Estudio CAD</span>
        </button>

        {/* CAD Purge / Limpiar lámina */}
        {onPurge && (
          <button
            onClick={onPurge}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 transition flex items-center gap-1 shadow-sm"
            title="Purgar lámina: eliminar segmentos de longitud 0, puntos huérfanos y textos vacíos"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Purgar</span>
          </button>
        )}

        {/* Shortcuts / Cheat Sheet */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-sky-300 hover:bg-[#252833] transition"
            title="Guía de Atajos de Teclado y Comandos (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Focus Mode / Fullscreen Canvas */}
        {onToggleFocusMode && (
          <button
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-lg transition ${
              isFocusMode
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400'
                : 'text-neutral-400 hover:text-white hover:bg-[#252833]'
            }`}
            title="Modo Enfoque / Pantalla Completa (Tab)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* New Canvas */}
        <button
          onClick={onNewCanvas}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#252833] transition"
          title="Nuevo Lienzo en Blanco"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
