/**
 * Virtual Drawing Instruments (Escuadra 45º, Cartabón 30º/60º, Regla Graduada)
 * Simulating traditional technical drawing within a modern CAD workspace
 */

import React, { useState } from 'react';
import { Point2D } from '../cad/types.ts';
import { RotateCw, Move, Eye, EyeOff } from 'lucide-react';

interface InstrumentOverlayProps {
  sheetWidth: number;
  sheetHeight: number;
  zoomLevel: number;
  visible: boolean;
  onToggleVisible: () => void;
}

export const InstrumentOverlay: React.FC<InstrumentOverlayProps> = ({
  sheetWidth,
  sheetHeight,
  zoomLevel,
  visible,
  onToggleVisible,
}) => {
  const [activeTab, setActiveTab] = useState<'escuadra' | 'cartabon' | 'both'>('both');
  const [escuadraAngle, setEscuadraAngle] = useState<number>(0);
  const [cartabonAngle, setCartabonAngle] = useState<number>(0);
  const [escuadraPos, setEscuadraPos] = useState<Point2D>({ x: 50, y: 70 });
  const [cartabonPos, setCartabonPos] = useState<Point2D>({ x: 130, y: 90 });
  const [draggingItem, setDraggingItem] = useState<'escuadra' | 'cartabon' | null>(null);
  const [dragOffset, setDragOffset] = useState<Point2D>({ x: 0, y: 0 });

  if (!visible) return null;

  const handlePointerDown = (item: 'escuadra' | 'cartabon', e: React.PointerEvent) => {
    e.stopPropagation();
    setDraggingItem(item);
    const pos = item === 'escuadra' ? escuadraPos : cartabonPos;
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingItem) return;
    const newPos = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    if (draggingItem === 'escuadra') {
      setEscuadraPos(newPos);
    } else {
      setCartabonPos(newPos);
    }
  };

  const handlePointerUp = () => {
    setDraggingItem(null);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* SVG Layer for Rendered Instruments */}
      <svg className="w-full h-full absolute inset-0 pointer-events-none">
        {/* ESCUADRA (45º - 45º - 90º) Isosceles Right Triangle */}
        {(activeTab === 'both' || activeTab === 'escuadra') && (
          <g
            transform={`translate(${escuadraPos.x}, ${escuadraPos.y}) rotate(${escuadraAngle})`}
            className="pointer-events-auto cursor-grab active:cursor-grabbing transition-transform duration-75"
            onPointerDown={(e) => handlePointerDown('escuadra', e)}
          >
            {/* Outer Triangle (Hypotenuse = 180, Legs = ~127.2) */}
            <polygon
              points="0,0 120,0 0,120"
              fill="rgba(245, 158, 11, 0.22)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />
            {/* Inner Cutout (Traditional drafting hole) */}
            <polygon
              points="20,20 85,20 20,85"
              fill="rgba(255, 255, 255, 0.05)"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            {/* Millimeter ruler markings on horizontal leg */}
            {Array.from({ length: 12 }).map((_, i) => (
              <g key={`e-tick-${i}`}>
                <line
                  x1={i * 10}
                  y1={0}
                  x2={i * 10}
                  y2={i % 5 === 0 ? 8 : 4}
                  stroke="#b45309"
                  strokeWidth="0.8"
                />
                {i > 0 && i % 2 === 0 && (
                  <text
                    x={i * 10}
                    y={13}
                    fontSize="7"
                    fontFamily="monospace"
                    fill="#92400e"
                    textAnchor="middle"
                  >
                    {i}
                  </text>
                )}
              </g>
            ))}
            {/* Angle Labels */}
            <text x="25" y="15" fontSize="8" fontWeight="bold" fill="#b45309">
              90º
            </text>
            <text x="100" y="15" fontSize="8" fontWeight="bold" fill="#b45309">
              45º
            </text>
            <text x="5" y="110" fontSize="8" fontWeight="bold" fill="#b45309">
              45º
            </text>
            <text x="40" y="55" fontSize="9" fontWeight="bold" fill="#78350f" opacity="0.6">
              ESCUADRA 45º
            </text>
          </g>
        )}

        {/* CARTABÓN (30º - 60º - 90º) Scalene Right Triangle */}
        {(activeTab === 'both' || activeTab === 'cartabon') && (
          <g
            transform={`translate(${cartabonPos.x}, ${cartabonPos.y}) rotate(${cartabonAngle})`}
            className="pointer-events-auto cursor-grab active:cursor-grabbing transition-transform duration-75"
            onPointerDown={(e) => handlePointerDown('cartabon', e)}
          >
            {/* Outer Triangle (Leg A = 150, Leg B = 86.6) */}
            <polygon
              points="0,0 86.6,0 0,150"
              fill="rgba(16, 185, 129, 0.22)"
              stroke="#10b981"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />
            {/* Inner Cutout */}
            <polygon
              points="18,18 60,18 18,110"
              fill="rgba(255, 255, 255, 0.05)"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            {/* Millimeter ruler markings on vertical leg */}
            {Array.from({ length: 15 }).map((_, i) => (
              <g key={`c-tick-${i}`}>
                <line
                  x1={0}
                  y1={i * 10}
                  x2={i % 5 === 0 ? 8 : 4}
                  y2={i * 10}
                  stroke="#047857"
                  strokeWidth="0.8"
                />
                {i > 0 && i % 2 === 0 && (
                  <text
                    x={12}
                    y={i * 10 + 2.5}
                    fontSize="7"
                    fontFamily="monospace"
                    fill="#065f46"
                    textAnchor="start"
                  >
                    {i}
                  </text>
                )}
              </g>
            ))}
            {/* Angle Labels */}
            <text x="22" y="14" fontSize="8" fontWeight="bold" fill="#047857">
              90º
            </text>
            <text x="66" y="14" fontSize="8" fontWeight="bold" fill="#047857">
              60º
            </text>
            <text x="6" y="140" fontSize="8" fontWeight="bold" fill="#047857">
              30º
            </text>
            <text x="25" y="70" fontSize="9" fontWeight="bold" fill="#064e3b" opacity="0.6">
              CARTABÓN 30º/60º
            </text>
          </g>
        )}
      </svg>

      {/* Floating Instrument Control HUD */}
      <div className="absolute top-4 right-4 pointer-events-auto bg-[#1a1b20]/95 backdrop-blur-md border border-[#33353d] rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 text-xs text-neutral-200 w-64">
        <div className="flex items-center justify-between border-b border-[#33353d] pb-2">
          <span className="font-semibold text-sky-400 flex items-center gap-1.5">
            📐 Instrumental Clásico
          </span>
          <button
            onClick={onToggleVisible}
            className="text-neutral-400 hover:text-white p-1 hover:bg-[#2d2f38] rounded"
            title="Ocultar instrumentos"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-1 bg-[#121316] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('both')}
            className={`flex-1 py-1 rounded text-center font-medium transition ${
              activeTab === 'both' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Ambos
          </button>
          <button
            onClick={() => setActiveTab('escuadra')}
            className={`flex-1 py-1 rounded text-center font-medium transition ${
              activeTab === 'escuadra' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Escuadra (45º)
          </button>
          <button
            onClick={() => setActiveTab('cartabon')}
            className={`flex-1 py-1 rounded text-center font-medium transition ${
              activeTab === 'cartabon' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Cartabón (30/60º)
          </button>
        </div>

        {/* Escuadra controls */}
        {(activeTab === 'both' || activeTab === 'escuadra') && (
          <div className="bg-[#22242c] p-2 rounded-lg flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] text-amber-300 font-medium">
              <span>Escuadra (45º - 45º - 90º)</span>
              <span>{escuadraAngle}º</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={escuadraAngle}
                onChange={(e) => setEscuadraAngle(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <button
                onClick={() => setEscuadraAngle((a) => (a + 15) % 360)}
                className="p-1 bg-[#33353e] hover:bg-[#444652] rounded text-amber-300"
                title="Girar 15º"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Cartabon controls */}
        {(activeTab === 'both' || activeTab === 'cartabon') && (
          <div className="bg-[#22242c] p-2 rounded-lg flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] text-emerald-300 font-medium">
              <span>Cartabón (30º - 60º - 90º)</span>
              <span>{cartabonAngle}º</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={cartabonAngle}
                onChange={(e) => setCartabonAngle(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <button
                onClick={() => setCartabonAngle((a) => (a + 15) % 360)}
                className="p-1 bg-[#33353e] hover:bg-[#444652] rounded text-emerald-300"
                title="Girar 15º"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="text-[10px] text-neutral-400 bg-[#121316] p-2 rounded leading-relaxed">
          💡 Puedes <strong className="text-white">arrastrar las piezas con el ratón</strong> y girarlas en pasos de 15º para apoyar la escuadra en el cartabón como en clase.
        </div>
      </div>
    </div>
  );
};
