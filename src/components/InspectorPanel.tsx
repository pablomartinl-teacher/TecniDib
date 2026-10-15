/**
 * Dockable Live Inspector & Layer Panel
 * Real-time entity property editing, transformation tools, and CAD layer management
 */

import React, { useState } from 'react';
import {
  CadEntity,
  LayerConfig,
  SheetSize,
  DashStyle,
  MarkerStyle,
  LineEntity,
  CircleEntity,
  ArcEntity,
  MeasureEntity,
  TextEntity,
  EllipseEntity,
  Isoplane,
} from '../cad/types.ts';
import {
  Layers,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  FlipHorizontal2,
  Compass,
  Check,
  Hash,
} from 'lucide-react';

export interface InspectorPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  selectedEntities: CadEntity[];
  onUpdateEntity: (entity: CadEntity) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onMirrorSelected: () => void;
  layers: LayerConfig[];
  activeLayerId: string;
  onSelectActiveLayer: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
  onAddLayer: (name: string, color: string) => void;
  sheetSize: SheetSize;
  totalEntities: number;
  showCompassArcs: boolean;
  onToggleCompassArcs: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  onToggleOpen,
  selectedEntities,
  onUpdateEntity,
  onDeleteSelected,
  onDuplicateSelected,
  onMirrorSelected,
  layers,
  activeLayerId,
  onSelectActiveLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onAddLayer,
  sheetSize,
  totalEntities,
  showCompassArcs,
  onToggleCompassArcs,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerColor, setNewLayerColor] = useState('#2563eb');

  const singleEntity = selectedEntities.length === 1 ? selectedEntities[0] : null;

  const handleCreateLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;
    onAddLayer(newLayerName.trim(), newLayerColor);
    setNewLayerName('');
  };

  const standardWidths = [0.18, 0.25, 0.35, 0.5, 0.7, 1.0, 1.4];

  return (
    <aside aria-label="Inspector y Capas" className={`relative flex transition-all duration-200 z-20 ${isOpen ? 'w-80' : 'w-0'}`}>
      {/* Toggle button on the left edge */}
      <button
        type="button"
        onClick={onToggleOpen}
        title={isOpen ? 'Ocultar Inspector' : 'Mostrar Inspector y Capas'}
        className="absolute -left-7 top-14 bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-l-md border-l border-y border-slate-700 shadow-md flex items-center justify-center transition-colors focus:outline-none"
      >
        {isOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      {isOpen && (
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none overflow-hidden">
          {/* Header Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/70">
            <button
              type="button"
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'properties'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders size={14} />
              <span>Propiedades</span>
              {selectedEntities.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">
                  {selectedEntities.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'layers'
                  ? 'border-blue-500 text-blue-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Capas CAD ({layers.length})</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'properties' && (
              <div>
                {selectedEntities.length === 0 && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Lámina Actual
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Formato:</span>{' '}
                          <strong className="text-white">{sheetSize.name}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Orientación:</span>{' '}
                          <span className="text-slate-300 capitalize">{sheetSize.orientation}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Ancho:</span>{' '}
                          <strong className="text-cyan-400">{sheetSize.w} mm</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Alto:</span>{' '}
                          <strong className="text-cyan-400">{sheetSize.h} mm</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 space-y-2.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Opciones Técnicas</span>
                        <Hash size={13} className="text-slate-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total entidades:</span>
                        <strong className="text-amber-400 font-mono">{totalEntities}</strong>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <Compass size={14} className="text-amber-400" />
                          <span>Trazos aux. de compás</span>
                        </label>
                        <input
                          type="checkbox"
                          checked={showCompassArcs}
                          onChange={onToggleCompassArcs}
                          className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="text-slate-400 text-[11px] leading-relaxed p-3 bg-slate-950/40 rounded border border-slate-800/60">
                      💡 <em>Haz clic sobre una línea, circunferencia o cota en el lienzo para inspeccionar y ajustar sus cotas métricas exactas.</em>
                    </div>
                  </div>
                )}

                {/* Multiple Entities Selected */}
                {selectedEntities.length > 1 && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg">
                      <div className="font-semibold text-blue-300 mb-1">
                        {selectedEntities.length} Elementos seleccionados
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Puedes aplicar estilo por lotes o transformar el grupo completo.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-slate-400 text-[11px] block">Grosor de trazo grupal:</label>
                      <div className="flex flex-wrap gap-1">
                        {standardWidths.map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              selectedEntities.forEach((ent) => {
                                onUpdateEntity({ ...ent, style: { ...ent.style, width: w } });
                              });
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-mono border border-slate-700"
                          >
                            {w} mm
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Batch Actions */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <button
                        type="button"
                        onClick={onDuplicateSelected}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                      >
                        <Copy size={13} />
                        <span>Duplicar Selección (+8mm)</span>
                      </button>

                      <button
                        type="button"
                        onClick={onMirrorSelected}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                      >
                        <FlipHorizontal2 size={13} />
                        <span>Simetría Axial (Eje)</span>
                      </button>

                      <button
                        type="button"
                        onClick={onDeleteSelected}
                        className="w-full py-1.5 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded flex items-center justify-center gap-2 border border-red-800 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar Selección</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Single Entity Inspector */}
                {singleEntity && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-semibold text-amber-400 uppercase tracking-wide">
                        {singleEntity.type === 'line' && 'Segmento Recto'}
                        {singleEntity.type === 'circle' && 'Circunferencia'}
                        {singleEntity.type === 'arc' && 'Arco / Compás'}
                        {singleEntity.type === 'measure' && 'Cota Normalizada'}
                        {singleEntity.type === 'text' && 'Anotación / Texto'}
                        {singleEntity.type === 'rect' && 'Rectángulo'}
                        {singleEntity.type === 'polygon' && 'Polígono Regular'}
                        {singleEntity.type === 'point' && 'Punto Marcador'}
                        {singleEntity.type === 'symbol' && 'Símbolo Técnico'}
                        {singleEntity.type === 'ellipse' && 'Isocírculo / Elipse Isométrica'}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px]">ID: {singleEntity.id}</span>
                    </div>

                    {/* Numeric parameters based on entity type */}
                    {singleEntity.type === 'line' && (() => {
                      const l = singleEntity as LineEntity;
                      const length = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
                      const angleDeg = (Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI;
                      return (
                        <div className="space-y-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-slate-400 text-[10px]">P1 (X, Y) mm</label>
                              <div className="flex gap-1 font-mono mt-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={l.x1}
                                  onChange={(e) => onUpdateEntity({ ...l, x1: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={l.y1}
                                  onChange={(e) => onUpdateEntity({ ...l, y1: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[10px]">P2 (X, Y) mm</label>
                              <div className="flex gap-1 font-mono mt-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={l.x2}
                                  onChange={(e) => onUpdateEntity({ ...l, x2: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={l.y2}
                                  onChange={(e) => onUpdateEntity({ ...l, y2: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/70">
                            <span className="text-slate-400">Longitud:</span>
                            <span className="font-mono text-emerald-400 font-semibold">{length.toFixed(2)} mm</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Ángulo:</span>
                            <span className="font-mono text-amber-400">{angleDeg.toFixed(1)}°</span>
                          </div>
                        </div>
                      );
                    })()}

                    {singleEntity.type === 'circle' && (() => {
                      const c = singleEntity as CircleEntity;
                      return (
                        <div className="space-y-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-slate-400 text-[10px]">Centro (X, Y)</label>
                              <div className="flex gap-1 font-mono mt-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={c.cx}
                                  onChange={(e) => onUpdateEntity({ ...c, cx: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={c.cy}
                                  onChange={(e) => onUpdateEntity({ ...c, cy: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[10px]">Radio R (mm)</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={c.r}
                                onChange={(e) => onUpdateEntity({ ...c, r: Math.max(0.5, Number(e.target.value)) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-400 font-mono mt-0.5"
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/70">
                            <span className="text-slate-400">Diámetro Ø:</span>
                            <span className="font-mono text-emerald-400 font-semibold">{(c.r * 2).toFixed(2)} mm</span>
                          </div>
                        </div>
                      );
                    })()}

                    {singleEntity.type === 'ellipse' && (() => {
                      const el = singleEntity as EllipseEntity;
                      return (
                        <div className="space-y-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-slate-400 text-[10px]">Centro (X, Y)</label>
                              <div className="flex gap-1 font-mono mt-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={el.cx}
                                  onChange={(e) => onUpdateEntity({ ...el, cx: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={el.cy}
                                  onChange={(e) => onUpdateEntity({ ...el, cy: Number(e.target.value) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-400"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[10px]">Radio R (Mayor)</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={el.rx}
                                onChange={(e) => {
                                  const newRx = Math.max(0.5, Number(e.target.value));
                                  onUpdateEntity({ ...el, rx: newRx, ry: Math.round(newRx * (1 / Math.sqrt(3)) * 100) / 100 });
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-400 font-mono mt-0.5"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/70">
                            <div>
                              <span className="text-slate-400">Semieje Menor:</span>{' '}
                              <span className="font-mono text-cyan-300 font-semibold">{el.ry.toFixed(2)} mm</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Giro:</span>{' '}
                              <span className="font-mono text-amber-300">{el.rotation}°</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400 text-[11px]">Isoplano:</span>
                            <div className="flex gap-1">
                              {(['top', 'left', 'right'] as const).map((iso) => (
                                <button
                                  key={iso}
                                  type="button"
                                  onClick={() => {
                                    const rot = iso === 'top' ? 0 : iso === 'left' ? 120 : 60;
                                    onUpdateEntity({ ...el, isoplane: iso, rotation: rot });
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                    el.isoplane === iso ? 'bg-sky-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  {iso === 'top' ? 'Sup' : iso === 'left' ? 'Izq' : 'Der'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {singleEntity.type === 'measure' && (() => {
                      const m = singleEntity as MeasureEntity;
                      return (
                        <div className="space-y-2.5 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                          <div>
                            <label className="text-slate-400 text-[10px]">Texto de cota personalizado</label>
                            <input
                              type="text"
                              value={m.customText || ''}
                              placeholder="Ej: 50.0 mm ó 4x R12"
                              onChange={(e) => onUpdateEntity({ ...m, customText: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-300 mt-1"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400">Lado de desfase:</span>
                            <button
                              type="button"
                              onClick={() => onUpdateEntity({ ...m, offsetDir: m.offsetDir === 1 ? -1 : 1 })}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-[11px]"
                            >
                              Invertir ({m.offsetDir > 0 ? '+Lado' : '-Lado'})
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Common Style Controls */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Grosor de plumilla (UNE mm):</label>
                        <div className="grid grid-cols-4 gap-1">
                          {standardWidths.map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => onUpdateEntity({ ...singleEntity, style: { ...singleEntity.style, width: w } })}
                              className={`py-1 text-[11px] font-mono rounded border transition-colors ${
                                singleEntity.style.width === w
                                  ? 'bg-blue-600 border-blue-400 text-white font-bold'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color & Dash */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">Color de trazo:</label>
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-700">
                            <input
                              type="color"
                              value={singleEntity.style.color}
                              onChange={(e) =>
                                onUpdateEntity({ ...singleEntity, style: { ...singleEntity.style, color: e.target.value } })
                              }
                              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <span className="font-mono text-[10px] text-slate-300 uppercase truncate">
                              {singleEntity.style.color}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1">Tipo de línea:</label>
                          <select
                            value={singleEntity.style.dash}
                            onChange={(e) =>
                              onUpdateEntity({
                                ...singleEntity,
                                style: { ...singleEntity.style, dash: e.target.value as DashStyle },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[11px]"
                          >
                            <option value="none">Continua</option>
                            <option value="3,3">Discontinua (Oculta)</option>
                            <option value="10,2,2,2">Trazo y punto (Ejes)</option>
                            <option value="6,2">Guiones medios</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Single entity action buttons */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={onDuplicateSelected}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <Copy size={12} />
                          <span>Duplicar</span>
                        </button>
                        <button
                          type="button"
                          onClick={onMirrorSelected}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <FlipHorizontal2 size={12} />
                          <span>Simetría</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={onDeleteSelected}
                        className="w-full py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded flex items-center justify-center gap-1.5 border border-red-800 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Eliminar elemento</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Layers Tab */}
            {activeTab === 'layers' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Capas del Dibujo
                  </div>

                  <div className="space-y-1.5">
                    {layers.map((layer) => {
                      const isActive = layer.id === activeLayerId;
                      return (
                        <div
                          key={layer.id}
                          className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                            isActive
                              ? 'bg-blue-950/40 border-blue-600/70'
                              : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                          }`}
                        >
                          {/* Left: Active selector and color swatch */}
                          <button
                            type="button"
                            onClick={() => onSelectActiveLayer(layer.id)}
                            className="flex items-center gap-2 text-left flex-1 truncate pr-2"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/30"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className={`text-xs truncate ${isActive ? 'font-bold text-white' : 'text-slate-300'}`}>
                              {layer.name}
                            </span>
                            {isActive && <Check size={12} className="text-blue-400 shrink-0" />}
                          </button>

                          {/* Right: Visibility & Lock toggles */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleLayerVisibility(layer.id)}
                              title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                              className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                                layer.visible ? 'text-slate-300' : 'text-slate-600'
                              }`}
                            >
                              {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => onToggleLayerLock(layer.id)}
                              title={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
                              className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                                layer.locked ? 'text-amber-400' : 'text-slate-500'
                              }`}
                            >
                              {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Layer Form */}
                <form onSubmit={handleCreateLayer} className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Plus size={13} />
                    <span>Crear nueva capa</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLayerName}
                      onChange={(e) => setNewLayerName(e.target.value)}
                      placeholder="Nombre (ej: Cotas, Ejes)"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="color"
                      value={newLayerColor}
                      onChange={(e) => setNewLayerColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-700 bg-transparent shrink-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newLayerName.trim()}
                    className="w-full py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-semibold transition-colors"
                  >
                    Añadir Capa
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
