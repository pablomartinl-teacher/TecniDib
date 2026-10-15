/**
 * Crop & Snipping Tool for exercise diagrams and PDF sheet snippets
 */

import React, { useRef, useState, useEffect } from 'react';
import { X, Crop, Check } from 'lucide-react';
import { ImageEntity } from '../cad/types.ts';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  canvasWidth: number;
  onInsertImage: (newImage: ImageEntity) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  canvasWidth,
  onInsertImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setLoadedImg(null);
      setCropRect(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setLoadedImg(img);
      setCropRect(null);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  useEffect(() => {
    if (!loadedImg || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = loadedImg.width;
    canvas.height = loadedImg.height;
    drawCanvas();
  }, [loadedImg, cropRect]);

  const drawCanvas = () => {
    if (!canvasRef.current || !loadedImg) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImg, 0, 0);

    if (cropRect && cropRect.w > 0 && cropRect.h > 0) {
      // Dim outer area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear cropped area
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.drawImage(
        loadedImg,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h,
        cropRect.x,
        cropRect.y,
        cropRect.w,
        cropRect.h
      );

      // Dash boundary box
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.setLineDash([]);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDragging(true);
    setStartPos(coords);
    setCropRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    setCropRect({
      x: Math.min(startPos.x, coords.x),
      y: Math.min(startPos.y, coords.y),
      w: Math.abs(coords.x - startPos.x),
      h: Math.abs(coords.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!cropRect || cropRect.w <= 5 || cropRect.h <= 5 || !loadedImg) {
      alert('Por favor, dibuja un recuadro de recorte arrastrando sobre la imagen.');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.w;
    tempCanvas.height = cropRect.h;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      loadedImg,
      cropRect.x,
      cropRect.y,
      cropRect.w,
      cropRect.h,
      0,
      0,
      cropRect.w,
      cropRect.h
    );

    const dataUrl = tempCanvas.toDataURL('image/png');
    // Calculate display mm dimensions
    let displayW = cropRect.w * 0.12;
    let displayH = cropRect.h * 0.12;
    if (displayW > canvasWidth * 0.6) {
      const ratio = displayW / displayH;
      displayW = canvasWidth * 0.6;
      displayH = displayW / ratio;
    }

    const newImageEntity: ImageEntity = {
      type: 'image',
      id: Date.now(),
      x: 30,
      y: 30,
      width: Math.round(displayW),
      height: Math.round(displayH),
      href: dataUrl,
      style: {
        width: 0.5,
        color: '#000000',
        dash: 'none',
        marker: 'none',
      },
    };

    onInsertImage(newImageEntity);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-between w-full max-w-4xl pb-3 text-neutral-200">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">
            Herramienta de Recorte: Selecciona el enunciado o figura a insertar
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2c303a]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-[#181920] border-2 border-[#333540] rounded-xl overflow-auto max-w-4xl max-h-[70vh] shadow-2xl relative flex items-center justify-center">
        {loadedImg ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="cursor-crosshair max-w-full max-h-[70vh] object-contain"
          />
        ) : (
          <div className="p-16 text-neutral-400 text-sm">Cargando imagen o PDF...</div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#282a33] text-neutral-300 hover:bg-[#343744] transition"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-6 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg transition"
        >
          <Check className="w-4 h-4" />
          Insertar Recorte en la Lámina
        </button>
      </div>
    </div>
  );
};
