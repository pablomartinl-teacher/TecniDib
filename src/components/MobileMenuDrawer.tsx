/**
 * Mobile Drawer Menu for VektorCAD
 * Accessible slide-over providing full access to all desktop functions on mobile devices
 */

import React from 'react';
import {
  X,
  FileText,
  Download,
  Upload,
  FolderOpen,
  Save,
  Square,
  Scissors,
  Layers,
  Sparkles,
  HelpCircle,
  Compass,
  BookOpen,
  Box,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { SheetSize } from '../cad/types.ts';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onExportDXF: () => void;
  onSaveToFile: () => void;
  onOpenFileInput: () => void;
  onOpenPdfBaseInput: () => void;
  onOpenCropModal: () => void;
  onOpenMarginsModal: () => void;
  onOpenPageManager: () => void;
  onToggleInstruments: () => void;
  showInstruments: boolean;
  onOpenStudyModal: () => void;
  onPurge: () => void;
  onOpenShortcuts: () => void;
  onNewCanvas: () => void;
  hasBgImage: boolean;
  bgImageLocked: boolean;
  onToggleBgImageLock: () => void;
  showBgImage: boolean;
  onToggleBgImage: () => void;
  onRemoveBgImage: () => void;
  paperTheme: 'white' | 'blueprint' | 'dark' | 'cream';
  onChangePaperTheme: (theme: 'white' | 'blueprint' | 'dark' | 'cream') => void;
  saveStatus: string;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onExportPDF,
  onExportSVG,
  onExportDXF,
  onSaveToFile,
  onOpenFileInput,
  onOpenPdfBaseInput,
  onOpenCropModal,
  onOpenMarginsModal,
  onOpenPageManager,
  onToggleInstruments,
  showInstruments,
  onOpenStudyModal,
  onPurge,
  onOpenShortcuts,
  onNewCanvas,
  hasBgImage,
  bgImageLocked,
  onToggleBgImageLock,
  showBgImage,
  onToggleBgImage,
  onRemoveBgImage,
  paperTheme,
  onChangePaperTheme,
  saveStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-[#16171d] border-l border-[#2d313d] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d313d]">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Menú Principal
            </span>
            {saveStatus && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveStatus}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#22242c] text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* PDF Base & Background Image Controls */}
          {hasBgImage && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  PDF de Base Activo
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {bgImageLocked ? 'Bloqueado' : 'Desbloqueado'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onToggleBgImageLock();
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
                    bgImageLocked
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                  }`}
                >
                  {bgImageLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{bgImageLocked ? 'Desbloquear' : 'Bloquear'}</span>
                </button>
                <button
                  onClick={onToggleBgImage}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium bg-[#22242c] hover:bg-[#2c303c] text-neutral-200 border border-[#333744] transition"
                >
                  <span>{showBgImage ? 'Ocultar PDF' : 'Ver PDF'}</span>
                </button>
              </div>
              <button
                onClick={() => {
                  onRemoveBgImage();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar PDF de la lámina</span>
              </button>
            </div>
          )}

          {/* Export section */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Exportar Proyecto
            </h4>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => {
                  onExportPDF();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-300 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold">Descargar Lámina en PDF</span>
                </div>
                <span className="text-[11px] font-mono text-rose-400">UNE A4/A3</span>
              </button>
              <button
                onClick={() => {
                  onExportDXF();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span className="text-sm">Exportar DXF (AutoCAD)</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">R12</span>
              </button>
              <button
                onClick={() => {
                  onExportSVG();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">Exportar Vectorial SVG</span>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">Vector</span>
              </button>
            </div>
          </div>

          {/* Project Native Files (.vektor) */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Archivo de Proyecto (.vektor)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSaveToFile();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 transition font-medium text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar .vektor</span>
              </button>
              <button
                onClick={() => {
                  onOpenFileInput();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition font-medium text-xs"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir Proyecto</span>
              </button>
            </div>
          </div>

          {/* Inserts & Technical Modules */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Inserciones y Módulos
            </h4>
            <div className="space-y-1.5">
              {!hasBgImage && (
                <button
                  onClick={() => {
                    onOpenPdfBaseInput();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition text-sm"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Cargar PDF Base (Enunciado/Calco)</span>
                </button>
              )}
              <button
                onClick={() => {
                  onOpenCropModal();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition text-sm font-medium"
              >
                <Scissors className="w-4 h-4" />
                <span>Recorte de imagen / figura</span>
              </button>
              <button
                onClick={() => {
                  onOpenMarginsModal();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition text-sm"
              >
                <Square className="w-4 h-4 text-sky-400" />
                <span>Márgenes y Cajetín UNE</span>
              </button>
              <button
                onClick={() => {
                  onOpenPageManager();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition text-sm"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Gestor de Láminas</span>
              </button>
              <button
                onClick={() => {
                  onToggleInstruments();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-sm transition ${
                  showInstruments
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                    : 'bg-[#22242c] hover:bg-[#2b2e38] border-[#333742] text-neutral-200'
                }`}
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Escuadra y Cartabón Virtual</span>
              </button>
              <button
                onClick={() => {
                  onOpenStudyModal();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition text-sm"
              >
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span>Ejercicios & Geometría Métrica</span>
              </button>
            </div>
          </div>

          {/* Paper Theme */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Color de Lámina
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'white', label: 'Blanco', bg: '#fcfcfc', text: '#000' },
                  { id: 'blueprint', label: 'Cian', bg: '#0f3161', text: '#fff' },
                  { id: 'dark', label: 'Oscuro', bg: '#1b1d24', text: '#fff' },
                  { id: 'cream', label: 'Crema', bg: '#f8f4e8', text: '#000' },
                ] as const
              ).map((th) => (
                <button
                  key={th.id}
                  onClick={() => onChangePaperTheme(th.id)}
                  className={`py-2 px-1 rounded-lg text-[11px] font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                    paperTheme === th.id
                      ? 'border-sky-400 ring-2 ring-sky-500/40'
                      : 'border-[#333742] opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: th.bg, color: th.text }}
                >
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Mantenimiento
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onPurge();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-amber-300 transition text-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Purgar lámina (eliminar duplicados)</span>
              </button>
              <button
                onClick={() => {
                  onOpenShortcuts();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#22242c] hover:bg-[#2b2e38] border border-[#333742] text-neutral-200 transition text-sm"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Atajos y Guía de Dibujo</span>
              </button>
              <button
                onClick={() => {
                  onNewCanvas();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 text-rose-300 transition text-sm"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Nuevo proyecto en blanco</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2d313d] text-center text-[10px] text-neutral-500 font-mono">
          VektorCAD Technical Drawing • Mobile Edition
        </div>
      </div>
    </div>
  );
};
