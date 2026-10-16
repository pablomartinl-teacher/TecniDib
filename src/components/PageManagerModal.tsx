/**
 * Page & Sheet Manager Modal
 * Visual organizer for reordering, renaming, duplicating, and managing CAD sheets
 */

import React, { useState } from 'react';
import {
  X,
  ArrowUp,
  ArrowDown,
  Layers,
  Edit2,
  Copy,
  Trash2,
  Plus,
  Eye,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { PageDocument, SheetSize } from '../cad/types.ts';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageDocument[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onReorderPages: (newPages: PageDocument[], newActiveIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  onSelectPage,
  onReorderPages,
  onAddPage,
  onDeletePage,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;

    let newActive = currentPageIndex;
    if (currentPageIndex === index) {
      newActive = index - 1;
    } else if (currentPageIndex === index - 1) {
      newActive = index;
    }
    onReorderPages(newPages, newActive);
  };

  const handleMoveDown = (index: number) => {
    if (index >= pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;

    let newActive = currentPageIndex;
    if (currentPageIndex === index) {
      newActive = index + 1;
    } else if (currentPageIndex === index + 1) {
      newActive = index;
    }
    onReorderPages(newPages, newActive);
  };

  const handleMoveToPosition = (fromIndex: number) => {
    const input = prompt(
      `Mover "${pages[fromIndex].title}" a la posición (1 a ${pages.length}):`,
      (fromIndex + 1).toString()
    );
    if (!input) return;
    const toPos = parseInt(input, 10) - 1;
    if (isNaN(toPos) || toPos < 0 || toPos >= pages.length || toPos === fromIndex) return;

    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toPos, 0, moved);

    let newActive = currentPageIndex;
    if (currentPageIndex === fromIndex) {
      newActive = toPos;
    } else if (fromIndex < currentPageIndex && toPos >= currentPageIndex) {
      newActive = currentPageIndex - 1;
    } else if (fromIndex > currentPageIndex && toPos <= currentPageIndex) {
      newActive = currentPageIndex + 1;
    }

    onReorderPages(newPages, newActive);
  };

  const handleStartRename = (index: number) => {
    setEditingIndex(index);
    setEditTitle(pages[index].title || `Lámina ${index + 1}`);
  };

  const handleSaveRename = (index: number) => {
    const clean = editTitle.trim();
    if (clean) {
      const newPages = [...pages];
      newPages[index] = { ...newPages[index], title: clean };
      onReorderPages(newPages, currentPageIndex);
    }
    setEditingIndex(null);
  };

  const handleDuplicate = (index: number) => {
    const src = pages[index];
    const copy: PageDocument = {
      ...src,
      id: `page-${Date.now()}`,
      title: `${src.title || `Lámina ${index + 1}`} (Copia)`,
      data: JSON.parse(JSON.stringify(src.data)),
      history: [],
      redoHistory: [],
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, copy);
    onReorderPages(newPages, index + 1);
  };

  const handleReverseOrder = () => {
    if (pages.length <= 1) return;
    if (!confirm('¿Deseas invertir el orden completo de todas las láminas?')) return;
    const newPages = [...pages].reverse();
    const newActive = pages.length - 1 - currentPageIndex;
    onReorderPages(newPages, newActive);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#1a1c23] border border-[#2e323e] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e323e] bg-[#161820]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">Reorganizar y Gestionar Láminas</h2>
              <p className="text-xs text-gray-400">
                Cambia el orden, renombra, duplica o reorganiza las páginas de tu proyecto CAD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252834] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {pages.map((p, index) => {
            const isCurrent = index === currentPageIndex;
            return (
              <div
                key={p.id || index}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-sky-950/30 border-sky-500/50 shadow-sm'
                    : 'bg-[#13141a] border-[#252833] hover:border-[#333742]'
                }`}
              >
                {/* Left: Position & Title */}
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-[#222530] text-gray-400 border border-[#2e323e]'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingIndex === index ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(index);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-xs bg-[#1f222c] border border-sky-500 rounded text-white focus:outline-hidden w-full max-w-xs"
                        />
                        <button
                          onClick={() => handleSaveRename(index)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Guardar nombre"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white truncate">
                          {p.title || `Lámina ${index + 1}`}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium shrink-0">
                            Actual
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{p.sheetSize?.name || 'A4'} ({p.sheetSize?.w || 297}x{p.sheetSize?.h || 210} mm)</span>
                      <span>•</span>
                      <span>{p.data?.length || 0} entidades</span>
                    </div>
                  </div>
                </div>

                {/* Right: Order & Action controls */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#252834] disabled:opacity-20 disabled:hover:bg-transparent transition"
                    title="Mover arriba"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pages.length - 1}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#252834] disabled:opacity-20 disabled:hover:bg-transparent transition"
                    title="Mover abajo"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Move to explicit position */}
                  <button
                    onClick={() => handleMoveToPosition(index)}
                    className="p-1.5 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 transition"
                    title="Mover a posición específica (número)"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => handleStartRename(index)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252834] transition"
                    title="Cambiar título"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(index)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252834] transition"
                    title="Duplicar lámina"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Switch to this page */}
                  {!isCurrent && (
                    <button
                      onClick={() => {
                        onSelectPage(index);
                        onClose();
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/30 transition flex items-center gap-1 ml-1"
                      title="Abrir esta lámina en el lienzo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver</span>
                    </button>
                  )}

                  {/* Delete (only if > 1 page) */}
                  {pages.length > 1 && (
                    <button
                      onClick={() => onDeletePage(index)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition ml-1"
                      title="Eliminar lámina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#2e323e] bg-[#161820]">
          <div className="flex items-center gap-2">
            <button
              onClick={onAddPage}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Lámina</span>
            </button>

            {pages.length > 1 && (
              <button
                onClick={handleReverseOrder}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-[#222530] transition flex items-center gap-1"
                title="Invertir orden de todas las láminas"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invertir Orden</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
