/**
 * Geometric Construction Step-by-Step Player
 * Allows animated playback, scrubbing, and demonstration of technical drawing steps
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  FastForward,
  X,
  Layers,
} from 'lucide-react';

export interface PlayerBarProps {
  isOpen: boolean;
  onClose: () => void;
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  isOpen,
  onClose,
  totalSteps,
  currentStep,
  onStepChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // ms per step

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onStepChange(
          currentStep >= totalSteps ? 1 : currentStep + 1
        );
      }, speed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStep, totalSteps, speed, onStepChange]);

  if (!isOpen) return null;

  return (
    <aside aria-label="Reproductor de pasos" className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3.5 z-40 text-slate-100 select-none animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs pr-2 border-r border-slate-700">
        <Layers size={15} />
        <span>Paso a Paso</span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onStepChange(0);
          }}
          title="Reiniciar al inicio (0 pasos)"
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onStepChange(Math.max(0, currentStep - 1));
          }}
          title="Paso anterior"
          disabled={currentStep <= 0}
          className="p-1.5 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300 hover:text-white transition-colors"
        >
          <SkipBack size={14} />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? 'Pausar' : 'Reproducir trazado paso a paso'}
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-md transition-colors"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onStepChange(Math.min(totalSteps, currentStep + 1));
          }}
          title="Paso siguiente"
          disabled={currentStep >= totalSteps}
          className="p-1.5 hover:bg-slate-800 disabled:opacity-40 rounded text-slate-300 hover:text-white transition-colors"
        >
          <SkipForward size={14} />
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onStepChange(totalSteps);
          }}
          title="Mostrar dibujo completo"
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
        >
          <FastForward size={14} />
        </button>
      </div>

      {/* Scrub Slider */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="range"
          min={0}
          max={Math.max(1, totalSteps)}
          value={currentStep}
          onChange={(e) => {
            setIsPlaying(false);
            onStepChange(Number(e.target.value));
          }}
          className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs font-mono text-slate-300 min-w-14">
          <strong className="text-cyan-400">{currentStep}</strong> / {totalSteps}
        </span>
      </div>

      {/* Speed Selector */}
      <div className="flex items-center gap-1 pl-2 border-l border-slate-700 text-xs">
        <span className="text-slate-400 text-[11px]">Vel:</span>
        <button
          type="button"
          onClick={() => setSpeed(1600)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${speed === 1600 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          0.5x
        </button>
        <button
          type="button"
          onClick={() => setSpeed(900)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${speed === 900 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          1x
        </button>
        <button
          type="button"
          onClick={() => setSpeed(400)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${speed === 400 ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          2x
        </button>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Cerrar reproductor"
        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-1 transition-colors"
      >
        <X size={15} />
      </button>
    </aside>
  );
};
