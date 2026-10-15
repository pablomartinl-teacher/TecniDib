/**
 * Rich Text Editor Modal for technical annotations, enunciados and notes
 */

import React, { useRef, useEffect, useState } from 'react';
import { TextEntity } from '../cad/types.ts';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  X,
  Type,
} from 'lucide-react';

interface RichTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: TextEntity | null;
  onSave: (updatedText: TextEntity) => void;
}

export const RichTextModal: React.FC<RichTextModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(6);
  const [color, setColor] = useState<string>('#000000');
  const [align, setAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  useEffect(() => {
    if (!isOpen || !entity) return;
    setFontSize(entity.fontSize || 6);
    setColor(entity.style?.color || '#000000');
    setAlign(entity.align || 'left');
    if (editorRef.current) {
      editorRef.current.innerHTML = entity.textHtml || '';
    }
  }, [isOpen, entity]);

  if (!isOpen || !entity) return null;

  const handleCommand = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
  };

  const handleCaseTransform = (type: 'upper' | 'lower') => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    const transformed = type === 'upper' ? text.toUpperCase() : text.toLowerCase();
    range.deleteContents();
    range.insertNode(document.createTextNode(transformed));
  };

  const handleSave = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const heightCalc = Math.max(20, (editorRef.current.scrollHeight / 3.78));

    const updated: TextEntity = {
      ...entity,
      textHtml: html,
      fontSize,
      align,
      h: heightCalc,
      style: {
        ...entity.style,
        color,
      },
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2026] border border-[#353945] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-neutral-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2d313b]">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-white text-sm">Editor de Texto Técnico Enriquecido</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-[#2c303a] rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2.5 bg-[#14151b] border-b border-[#2d313b] flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 bg-[#20222a] p-1 rounded-lg">
            <button
              onClick={() => handleCommand('bold')}
              className="p-1.5 rounded hover:bg-[#343744] text-neutral-200"
              title="Negrita"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleCommand('italic')}
              className="p-1.5 rounded hover:bg-[#343744] text-neutral-200"
              title="Cursiva"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleCommand('underline')}
              className="p-1.5 rounded hover:bg-[#343744] text-neutral-200"
              title="Subrayado"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#20222a] p-1 rounded-lg">
            <button
              onClick={() => handleCaseTransform('upper')}
              className="px-2 py-1 text-[11px] font-bold rounded hover:bg-[#343744] text-neutral-200"
              title="MAYÚSCULAS"
            >
              AA
            </button>
            <button
              onClick={() => handleCaseTransform('lower')}
              className="px-2 py-1 text-[11px] font-bold rounded hover:bg-[#343744] text-neutral-200"
              title="minúsculas"
            >
              aa
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#20222a] p-1 rounded-lg">
            <button
              onClick={() => {
                setAlign('left');
                handleCommand('justifyLeft');
              }}
              className={`p-1.5 rounded text-neutral-200 ${align === 'left' ? 'bg-sky-600' : 'hover:bg-[#343744]'}`}
              title="Alinear Izquierda"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAlign('center');
                handleCommand('justifyCenter');
              }}
              className={`p-1.5 rounded text-neutral-200 ${align === 'center' ? 'bg-sky-600' : 'hover:bg-[#343744]'}`}
              title="Centrar"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAlign('right');
                handleCommand('justifyRight');
              }}
              className={`p-1.5 rounded text-neutral-200 ${align === 'right' ? 'bg-sky-600' : 'hover:bg-[#343744]'}`}
              title="Alinear Derecha"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setAlign('justify');
                handleCommand('justifyFull');
              }}
              className={`p-1.5 rounded text-neutral-200 ${align === 'justify' ? 'bg-sky-600' : 'hover:bg-[#343744]'}`}
              title="Justificar"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#20222a] px-2 py-1 rounded-lg">
            <span className="text-neutral-400 text-[11px]">Tamaño:</span>
            <input
              type="number"
              min="3"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value) || 6)}
              className="w-12 bg-[#14151b] border border-[#373a46] rounded px-1.5 py-0.5 text-center text-white"
            />
            <span className="text-neutral-400 text-[10px]">pt</span>
          </div>

          <div className="flex items-center gap-1 bg-[#20222a] px-2 py-1 rounded-lg">
            <span className="text-neutral-400 text-[11px]">Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
        </div>

        {/* Contenteditable Canvas */}
        <div className="p-4 bg-[#2b2d35]">
          <div
            ref={editorRef}
            contentEditable
            style={{ fontSize: `${fontSize * 1.8}px`, color, textAlign: align }}
            className="bg-white text-black p-4 rounded-xl min-h-[160px] max-h-[300px] overflow-y-auto outline-none shadow-inner leading-relaxed font-sans"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#2d313b] bg-[#16171e]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#2c303a] transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow transition"
          >
            <Check className="w-4 h-4" />
            Aplicar Texto
          </button>
        </div>
      </div>
    </div>
  );
};
