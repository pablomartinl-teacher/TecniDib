/**
 * VektorCAD - Main Canvas Component
 * Millimeter precision SVG rendering, interactive drawing, snapping HUD, and instrumental guides
 */

import React, { useRef, useEffect } from 'react';
import {
  CadEntity,
  SheetSize,
  ToolType,
  Point2D,
  SnapPoint,
  EntityStyle,
  LineEntity,
  GridMode,
  Isoplane,
  EllipseEntity,
} from '../cad/types.ts';
import {
  distance,
  getSvgArcPath,
  smoothPath,
  getPolygonVertices,
  calculateIsoDimension,
} from '../cad/geometry.ts';

interface CadCanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  sheetSize: SheetSize;
  zoomLevel: number;
  paperTheme: 'white' | 'blueprint' | 'dark' | 'cream';
  gridSnapEnabled: boolean;
  gridPitch: number;
  gridMode?: GridMode;
  isoplane?: Isoplane;
  entities: CadEntity[];
  selectedEntities: CadEntity[];
  referenceLine: LineEntity | null;
  activeSnap: SnapPoint | null;
  activeAlignX: number | null;
  activeAlignY: number | null;
  ghostHtml: string;
  bgImage: string | null;
  hiddenLayers?: Set<string>;
  cursorPos?: Point2D;
  showRulers?: boolean;
  keyboardInput?: string;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onContextMenu: (e: React.MouseEvent<SVGSVGElement>) => void;
  onDoubleClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  isPanning: boolean;
  cursorStyle: string;
}

export const CadCanvas: React.FC<CadCanvasProps> = ({
  svgRef,
  sheetSize,
  zoomLevel,
  paperTheme,
  gridSnapEnabled,
  gridPitch,
  gridMode = 'orthogonal',
  isoplane = 'top',
  entities,
  selectedEntities,
  referenceLine,
  activeSnap,
  activeAlignX,
  activeAlignY,
  ghostHtml,
  bgImage,
  hiddenLayers,
  cursorPos = { x: 0, y: 0 },
  showRulers = true,
  keyboardInput = '',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onDoubleClick,
  isPanning,
  cursorStyle,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Background colors per theme
  const getThemeBg = () => {
    switch (paperTheme) {
      case 'white':
        return '#fcfcfc';
      case 'blueprint':
        return '#0f3161';
      case 'dark':
        return '#1b1d24';
      case 'cream':
        return '#f8f4e8';
      default:
        return '#ffffff';
    }
  };

  const getThemeGridColor = () => {
    switch (paperTheme) {
      case 'white':
        return 'rgba(0, 0, 0, 0.08)';
      case 'blueprint':
        return 'rgba(255, 255, 255, 0.15)';
      case 'dark':
        return 'rgba(255, 255, 255, 0.08)';
      case 'cream':
        return 'rgba(120, 90, 40, 0.12)';
      default:
        return 'rgba(0, 0, 0, 0.08)';
    }
  };

  // Render an entity into SVG JSX
  const renderEntity = (ent: CadEntity) => {
    if (hiddenLayers && ent.layer && hiddenLayers.has(ent.layer)) {
      return null;
    }
    const isSelected = selectedEntities.some((e) => e.id === ent.id);
    const isRef = referenceLine?.id === ent.id;

    const baseStyle = ent.style || {
      width: 0.5,
      color: '#000000',
      dash: 'none',
      marker: 'none',
    };

    let strokeColor = baseStyle.color;
    if (paperTheme === 'blueprint' && (strokeColor === '#000000' || strokeColor === '#000')) {
      strokeColor = '#ffffff';
    } else if (paperTheme === 'dark' && (strokeColor === '#000000' || strokeColor === '#000')) {
      strokeColor = '#e0e2ec';
    }

    if (isSelected || isRef) {
      strokeColor = '#0284c7'; // Active CAD blue highlight
    }

    const sw = isSelected || isRef ? parseFloat(baseStyle.width.toString()) + 0.5 : baseStyle.width;
    const strokeDasharray = baseStyle.dash !== 'none' ? baseStyle.dash : undefined;

    let markerStart: string | undefined;
    let markerEnd: string | undefined;
    if (baseStyle.marker === 'arrow') {
      markerStart = 'url(#arrow-start)';
      markerEnd = 'url(#arrow-end)';
    } else if (baseStyle.marker === 'tick') {
      markerStart = 'url(#tick)';
      markerEnd = 'url(#tick)';
    }

    switch (ent.type) {
      case 'line':
        return (
          <line
            key={ent.id}
            x1={ent.x1}
            y1={ent.y1}
            x2={ent.x2}
            y2={ent.y2}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
            markerStart={markerStart}
            markerEnd={markerEnd}
            strokeLinecap="round"
          />
        );

      case 'measure': {
        const dim = calculateIsoDimension(
          { x: ent.x1, y: ent.y1 },
          { x: ent.x2, y: ent.y2 },
          ent.offsetDir,
          ent.offsetDistance || 6,
          baseStyle
        );
        const textVal = ent.customText || `${dim.mag.toFixed(1)} mm`;

        return (
          <g key={ent.id} opacity={isSelected ? 0.8 : 1}>
            {/* Extension lines */}
            <line
              x1={dim.ext1.x1}
              y1={dim.ext1.y1}
              x2={dim.ext1.x2}
              y2={dim.ext1.y2}
              stroke={strokeColor}
              strokeWidth={0.25}
              strokeDasharray={strokeDasharray}
            />
            <line
              x1={dim.ext2.x1}
              y1={dim.ext2.y1}
              x2={dim.ext2.x2}
              y2={dim.ext2.y2}
              stroke={strokeColor}
              strokeWidth={0.25}
              strokeDasharray={strokeDasharray}
            />
            {/* Main dimension line */}
            <line
              x1={dim.dimLine.x1}
              y1={dim.dimLine.y1}
              x2={dim.dimLine.x2}
              y2={dim.dimLine.y2}
              stroke={strokeColor}
              strokeWidth={sw}
              markerStart="url(#arrow-start)"
              markerEnd="url(#arrow-end)"
            />
            {/* Dimension value text */}
            <text
              x={dim.text.x}
              y={dim.text.y - 1.2}
              fill={strokeColor}
              fontSize={dim.text.fontSize}
              fontFamily="monospace"
              fontWeight="600"
              textAnchor="middle"
              transform={`rotate(${dim.text.angle}, ${dim.text.x}, ${dim.text.y})`}
            >
              {textVal}
            </text>
          </g>
        );
      }

      case 'circle':
        return (
          <g key={ent.id}>
            <circle
              cx={ent.cx}
              cy={ent.cy}
              r={ent.r}
              fill={baseStyle.fillColor && baseStyle.fillColor !== '#ffffff' ? baseStyle.fillColor : 'none'}
              stroke={strokeColor}
              strokeWidth={sw}
              strokeDasharray={strokeDasharray}
            />
            {/* Standard center mark cross */}
            <line
              x1={ent.cx - 3}
              y1={ent.cy}
              x2={ent.cx + 3}
              y2={ent.cy}
              stroke={strokeColor}
              strokeWidth={0.25}
            />
            <line
              x1={ent.cx}
              y1={ent.cy - 3}
              x2={ent.cx}
              y2={ent.cy + 3}
              stroke={strokeColor}
              strokeWidth={0.25}
            />
          </g>
        );

      case 'arc': {
        const pathData = getSvgArcPath(ent.cx, ent.cy, ent.r, ent.startAngle, ent.sweepAngle);
        return (
          <path
            key={ent.id}
            d={pathData}
            fill="none"
            stroke={strokeColor}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
          />
        );
      }

      case 'polygon': {
        const vertices = getPolygonVertices(ent.cx, ent.cy, ent.r, ent.sides, ent.angle);
        const ptsStr = vertices.map((v) => `${v.x},${v.y}`).join(' ');
        return (
          <polygon
            key={ent.id}
            points={ptsStr}
            fill={baseStyle.fillColor && baseStyle.fillColor !== '#ffffff' ? baseStyle.fillColor : 'none'}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
          />
        );
      }

      case 'curve': {
        const pathData = smoothPath(ent.points);
        return (
          <g key={ent.id}>
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={sw}
              strokeDasharray={strokeDasharray}
            />
            {isSelected &&
              ent.points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={1.8}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={1}
                />
              ))}
          </g>
        );
      }

      case 'rect':
        return (
          <rect
            key={ent.id}
            x={ent.x}
            y={ent.y}
            width={ent.w}
            height={ent.h}
            fill="none"
            stroke={strokeColor}
            strokeWidth={sw}
            strokeDasharray={strokeDasharray}
          />
        );

      case 'point':
        return (
          <g key={ent.id}>
            <line
              x1={ent.x - 2.5}
              y1={ent.y}
              x2={ent.x + 2.5}
              y2={ent.y}
              stroke={strokeColor}
              strokeWidth={sw}
            />
            <line
              x1={ent.x}
              y1={ent.y - 2.5}
              x2={ent.x}
              y2={ent.y + 2.5}
              stroke={strokeColor}
              strokeWidth={sw}
            />
          </g>
        );

      case 'symbol': {
        const cx = ent.x;
        const cy = ent.y;
        if (ent.symbolType === 'perp') {
          return (
            <g key={ent.id}>
              <rect
                x={cx - 2.5}
                y={cy - 2.5}
                width={5}
                height={5}
                fill="none"
                stroke={strokeColor}
                strokeWidth={sw}
              />
              <circle cx={cx} cy={cy} r={sw * 0.8} fill={strokeColor} />
            </g>
          );
        } else if (ent.symbolType === 'para') {
          return (
            <g key={ent.id}>
              <line
                x1={cx - 1.5}
                y1={cy + 3}
                x2={cx + 1}
                y2={cy - 3}
                stroke={strokeColor}
                strokeWidth={sw}
              />
              <line
                x1={cx + 1.5}
                y1={cy + 3}
                x2={cx + 4}
                y2={cy - 3}
                stroke={strokeColor}
                strokeWidth={sw}
              />
            </g>
          );
        } else if (ent.symbolType === 'coin') {
          return (
            <g key={ent.id}>
              <line
                x1={cx - 2.5}
                y1={cy - 1.5}
                x2={cx + 2.5}
                y2={cy - 1.5}
                stroke={strokeColor}
                strokeWidth={sw}
              />
              <line
                x1={cx - 2.5}
                y1={cy}
                x2={cx + 2.5}
                y2={cy}
                stroke={strokeColor}
                strokeWidth={sw}
              />
              <line
                x1={cx - 2.5}
                y1={cy + 1.5}
                x2={cx + 2.5}
                y2={cy + 1.5}
                stroke={strokeColor}
                strokeWidth={sw}
              />
            </g>
          );
        }
        return null;
      }

      case 'tag':
        return (
          <text
            key={ent.id}
            x={ent.x}
            y={ent.y}
            fill={strokeColor}
            fontSize={ent.fontSize || 4}
            fontFamily="sans-serif"
            fontWeight="bold"
            transform={`rotate(${ent.angle || 0}, ${ent.x}, ${ent.y})`}
          >
            {ent.text}
          </text>
        );

      case 'text': {
        const fontSize = ent.fontSize || 5;
        const boxW = typeof ent.w === 'number' && ent.w > 0 ? ent.w : 60;
        const boxH = typeof ent.h === 'number' && ent.h > 0 ? ent.h : 25;
        const handleW = 3.6;
        const handleH = 3.6;
        const halfW = handleW / 2;
        const halfH = handleH / 2;

        return (
          <g key={ent.id} className="group">
            {/* Clickable background hit area so selecting and moving text box always succeeds */}
            <rect
              x={ent.x}
              y={ent.y}
              width={boxW}
              height={boxH}
              fill="transparent"
              stroke="none"
              style={{ cursor: isSelected ? 'move' : 'pointer' }}
            />

            <foreignObject
              x={ent.x}
              y={ent.y}
              width={boxW}
              height={boxH}
              style={{ overflow: 'visible' }}
            >
              <div
                id={`cad-text-${ent.id}`}
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: `${fontSize}px`,
                  color: strokeColor,
                  width: '100%',
                  minHeight: '100%',
                  textAlign: ent.align || 'left',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  padding: '1px 2px',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  lineHeight: 1.25,
                }}
              >
                <style>{`#cad-text-${ent.id} p, #cad-text-${ent.id} div, #cad-text-${ent.id} span { margin: 0; padding: 0; line-height: 1.25; }`}</style>
                <div dangerouslySetInnerHTML={{ __html: ent.textHtml || ent.text || '' }} />
              </div>
            </foreignObject>

            {/* Bounding box and resize handles when selected */}
            {isSelected && (
              <g>
                {/* Bounding box dashed outline */}
                <rect
                  x={ent.x}
                  y={ent.y}
                  width={boxW}
                  height={boxH}
                  fill="rgba(2, 132, 199, 0.06)"
                  stroke="#0284c7"
                  strokeWidth={0.4}
                  strokeDasharray="2,2"
                  pointerEvents="none"
                />

                {/* Horizontal resize handles (Left and Right - width adjustment) */}
                <rect
                  x={ent.x - halfW}
                  y={ent.y + boxH / 2 - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'ew-resize' }}
                  data-text-handle="w"
                  data-text-id={ent.id}
                >
                  <title>Tirador horizontal izquierdo: arrastrar para ajustar ancho</title>
                </rect>
                <rect
                  x={ent.x + boxW - halfW}
                  y={ent.y + boxH / 2 - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'ew-resize' }}
                  data-text-handle="e"
                  data-text-id={ent.id}
                >
                  <title>Tirador horizontal derecho: arrastrar para ajustar ancho</title>
                </rect>

                {/* Vertical resize handles (Top and Bottom - height adjustment) */}
                <rect
                  x={ent.x + boxW / 2 - halfW}
                  y={ent.y - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'ns-resize' }}
                  data-text-handle="n"
                  data-text-id={ent.id}
                >
                  <title>Tirador vertical superior: arrastrar para ajustar alto</title>
                </rect>
                <rect
                  x={ent.x + boxW / 2 - halfW}
                  y={ent.y + boxH - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'ns-resize' }}
                  data-text-handle="s"
                  data-text-id={ent.id}
                >
                  <title>Tirador vertical inferior: arrastrar para ajustar alto</title>
                </rect>

                {/* Corner resize handles (diagonal adjustment) */}
                <rect
                  x={ent.x - halfW}
                  y={ent.y - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'nwse-resize' }}
                  data-text-handle="nw"
                  data-text-id={ent.id}
                >
                  <title>Esquina superior izquierda</title>
                </rect>
                <rect
                  x={ent.x + boxW - halfW}
                  y={ent.y - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'nesw-resize' }}
                  data-text-handle="ne"
                  data-text-id={ent.id}
                >
                  <title>Esquina superior derecha</title>
                </rect>
                <rect
                  x={ent.x - halfW}
                  y={ent.y + boxH - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'nesw-resize' }}
                  data-text-handle="sw"
                  data-text-id={ent.id}
                >
                  <title>Esquina inferior izquierda</title>
                </rect>
                <rect
                  x={ent.x + boxW - halfW}
                  y={ent.y + boxH - halfH}
                  width={handleW}
                  height={handleH}
                  rx={0.6}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={0.5}
                  style={{ cursor: 'nwse-resize' }}
                  data-text-handle="se"
                  data-text-id={ent.id}
                >
                  <title>Esquina inferior derecha</title>
                </rect>

                {/* Live dimension badge */}
                <text
                  x={ent.x + boxW / 2}
                  y={ent.y - 2.5}
                  fill="#0284c7"
                  fontSize={2.5}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {`${boxW.toFixed(1)} × ${boxH.toFixed(1)} mm`}
                </text>
              </g>
            )}
          </g>
        );
      }

      case 'fill': {
        const pts = ent.points.map((p) => `${p.x},${p.y}`).join(' ');
        const patternId = `pat-${ent.id}`;
        return (
          <g key={ent.id}>
            <defs>
              <pattern
                id={patternId}
                width={ent.hatchSpacing || 4}
                height={ent.hatchSpacing || 4}
                patternTransform={`rotate(${ent.hatchAngle || 45} 0 0)`}
                patternUnits="userSpaceOnUse"
              >
                {baseStyle.fillColor && (
                  <rect width="100%" height="100%" fill={baseStyle.fillColor} />
                )}
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={ent.hatchSpacing || 4}
                  stroke={strokeColor}
                  strokeWidth={sw * 0.7}
                />
              </pattern>
            </defs>
            <polygon points={pts} fill={`url(#${patternId})`} stroke={strokeColor} strokeWidth={sw} />
          </g>
        );
      }

      case 'image':
        if (!ent.href || typeof ent.href !== 'string' || ent.href.trim() === '' || ent.href === 'null') {
          return null;
        }
        return (
          <g key={ent.id}>
            <image
              x={ent.x}
              y={ent.y}
              width={ent.width}
              height={ent.height}
              href={ent.href}
              opacity={isSelected ? 0.75 : 1}
              onError={(e) => {
                (e.currentTarget as any).style.display = 'none';
              }}
            />
            {isSelected && (
              <rect
                x={ent.x}
                y={ent.y}
                width={ent.width}
                height={ent.height}
                fill="none"
                stroke="#0284c7"
                strokeWidth={0.8}
                strokeDasharray="4,4"
              />
            )}
          </g>
        );

      case 'ellipse': {
        const el = ent as EllipseEntity;
        return (
          <g key={el.id}>
            <ellipse
              cx={el.cx}
              cy={el.cy}
              rx={el.rx}
              ry={el.ry}
              transform={`rotate(${el.rotation || 0} ${el.cx} ${el.cy})`}
              fill={baseStyle.fillColor && baseStyle.fillColor !== '#ffffff' ? baseStyle.fillColor : 'none'}
              stroke={strokeColor}
              strokeWidth={sw}
              strokeDasharray={strokeDasharray}
            />
            {/* Center mark cross */}
            <line
              x1={el.cx - 2.5}
              y1={el.cy}
              x2={el.cx + 2.5}
              y2={el.cy}
              stroke={strokeColor}
              strokeWidth={0.25}
            />
            <line
              x1={el.cx}
              y1={el.cy - 2.5}
              x2={el.cx}
              y2={el.cy + 2.5}
              stroke={strokeColor}
              strokeWidth={0.25}
            />
          </g>
        );
      }

      default:
        return null;
    }
  };

  const scale = zoomLevel / 100;

  return (
    <main
      ref={containerRef}
      id="canvas-container"
      className="flex-1 bg-[#121316] overflow-auto relative flex items-center justify-center p-8 select-none"
    >
      <div
        id="svg-wrapper"
        className="flex items-center justify-center min-w-full min-h-full"
      >
        <svg
          ref={svgRef}
          id="dibujo-svg"
          viewBox={`0 0 ${sheetSize.w} ${sheetSize.h}`}
          style={{
            width: `${sheetSize.w * scale}mm`,
            height: `${sheetSize.h * scale}mm`,
            backgroundColor: getThemeBg(),
            cursor: cursorStyle,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onContextMenu={onContextMenu}
          onDoubleClick={onDoubleClick}
          className="transition-shadow duration-150 touch-none flex-shrink-0"
        >
          {/* Technical Drawing Markers & Patterns */}
          <defs>
            {/* Standard ISO 129 15-degree dimension arrows */}
            <marker
              id="arrow-end"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="context-stroke" />
            </marker>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="context-stroke" />
            </marker>
            {/* Standard architectural 45º tick */}
            <marker
              id="tick"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <line
                x1="8"
                y1="2"
                x2="2"
                y2="8"
                stroke="context-stroke"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </marker>
            {/* Standard 45 degree technical hatch pattern */}
            <pattern
              id="hatch-standard"
              width="4"
              height="4"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.4" />
            </pattern>
            {/* Standard Cartesian Millimeter Grid */}
            {gridSnapEnabled && gridMode === 'orthogonal' && (
              <pattern
                id="cad-grid"
                width={gridPitch}
                height={gridPitch}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${gridPitch} 0 L 0 0 0 ${gridPitch}`}
                  fill="none"
                  stroke={getThemeGridColor()}
                  strokeWidth="0.15"
                />
              </pattern>
            )}

            {/* Axonometric Isometric Grid Pattern (30º / 150º / 90º) */}
            {gridSnapEnabled && gridMode === 'isometric' && (() => {
              const isoW = gridPitch * Math.sqrt(3);
              const isoH = gridPitch;
              return (
                <pattern
                  id="cad-isometric-grid"
                  width={isoW}
                  height={isoH}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M 0 0 L ${isoW} ${isoH} M 0 ${isoH} L ${isoW} 0 M ${isoW / 2} 0 L ${isoW / 2} ${isoH} M 0 0 L 0 ${isoH}`}
                    fill="none"
                    stroke={getThemeGridColor()}
                    strokeWidth="0.15"
                  />
                  {/* Isometric node marker dots */}
                  <circle cx="0" cy="0" r="0.4" fill={getThemeGridColor()} />
                  <circle cx={isoW / 2} cy={isoH / 2} r="0.4" fill={getThemeGridColor()} />
                  <circle cx={isoW} cy={0} r="0.4" fill={getThemeGridColor()} />
                </pattern>
              );
            })()}

            {/* Axonometric Cavalier Grid Pattern (45º with reduction) */}
            {gridSnapEnabled && gridMode === 'cavalier' && (
              <pattern
                id="cad-cavalier-grid"
                width={gridPitch}
                height={gridPitch}
                patternUnits="userSpaceOnUse"
              >
                <rect width={gridPitch} height={gridPitch} fill="none" stroke={getThemeGridColor()} strokeWidth="0.15" />
                <line x1="0" y1={gridPitch} x2={gridPitch} y2="0" stroke={getThemeGridColor()} strokeWidth="0.15" strokeDasharray="1,1" />
              </pattern>
            )}
          </defs>

          {/* Grid Layer */}
          {gridSnapEnabled && (
            <rect
              width="100%"
              height="100%"
              fill={
                gridMode === 'isometric'
                  ? 'url(#cad-isometric-grid)'
                  : gridMode === 'cavalier'
                  ? 'url(#cad-cavalier-grid)'
                  : 'url(#cad-grid)'
              }
              pointerEvents="none"
            />
          )}

          {/* Background PDF/Exercise Image if loaded */}
          {bgImage && typeof bgImage === 'string' && bgImage.trim() !== '' && bgImage !== 'null' && (
            <image
              id="bg-pdf-image"
              x="0"
              y="0"
              width="100%"
              height="100%"
              href={bgImage}
              preserveAspectRatio="xMidYMid meet"
              pointerEvents="none"
              opacity="0.85"
              onError={(e) => {
                (e.currentTarget as any).style.display = 'none';
              }}
            />
          )}

          {/* Solution Entities Layer */}
          <g id="layer-solucion">{entities.map(renderEntity)}</g>

          {/* Orthogonal Alignment Guides */}
          <g id="layer-guides" pointerEvents="none">
            {activeAlignX !== null && (
              <line
                x1={activeAlignX}
                y1={-1000}
                x2={activeAlignX}
                y2={1000}
                stroke="#0284c7"
                strokeWidth={0.25}
                strokeDasharray="3,3"
                opacity={0.8}
              />
            )}
            {activeAlignY !== null && (
              <line
                x1={-1000}
                y1={activeAlignY}
                x2={1000}
                y2={activeAlignY}
                stroke="#0284c7"
                strokeWidth={0.25}
                strokeDasharray="3,3"
                opacity={0.8}
              />
            )}
          </g>

          {/* Interactive Ghost Preview Layer */}
          <g id="layer-ghost" dangerouslySetInnerHTML={{ __html: ghostHtml }} />

          {/* Snap Indicator HUD */}
          {activeSnap && (
            <g id="snap-indicator-group" pointerEvents="none">
              <circle
                cx={activeSnap.x}
                cy={activeSnap.y}
                r={2.5}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
                strokeWidth={0.6}
              />
              <line
                x1={activeSnap.x - 4}
                y1={activeSnap.y}
                x2={activeSnap.x + 4}
                y2={activeSnap.y}
                stroke="#10b981"
                strokeWidth={0.3}
              />
              <line
                x1={activeSnap.x}
                y1={activeSnap.y - 4}
                x2={activeSnap.x}
                y2={activeSnap.y + 4}
                stroke="#10b981"
                strokeWidth={0.3}
              />
              {activeSnap.label && (
                <text
                  x={activeSnap.x + 3.5}
                  y={activeSnap.y - 3.5}
                  fill="#10b981"
                  fontSize={2.5}
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {activeSnap.label}
                </text>
              )}
            </g>
          )}

          {/* Isometric Mode HUD Indicator */}
          {gridMode === 'isometric' && (
            <g id="isoplane-hud" pointerEvents="none" transform={`translate(${sheetSize.w - 46}, ${sheetSize.h - 11})`}>
              <rect
                width="42"
                height="7.5"
                rx="1.5"
                fill="rgba(15, 23, 42, 0.85)"
                stroke="#0284c7"
                strokeWidth="0.35"
              />
              <text
                x="21"
                y="5"
                fill="#38bdf8"
                fontSize="2.6"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                ISOPLANO: {isoplane === 'top' ? 'SUPERIOR' : isoplane === 'left' ? 'IZQUIERDO' : 'DERECHO'}
              </text>
            </g>
          )}

          {/* Live Keyboard Measure Input HUD */}
          {keyboardInput !== '' && (() => {
            const isPolar = keyboardInput.includes('<');
            const displayText = isPolar
              ? `📐 ${keyboardInput.split('<')[0]} mm ∠ ${keyboardInput.split('<')[1] || ''}º ↵`
              : `📏 ${keyboardInput} mm ↵`;
            const badgeW = Math.max(38, displayText.length * 2.2 + 12);
            const badgeX = Math.min(sheetSize.w - badgeW - 4, Math.max(4, cursorPos.x + 3));
            const badgeY = Math.max(8, cursorPos.y - 8);

            return (
              <g pointerEvents="none" transform={`translate(${badgeX}, ${badgeY})`}>
                <rect
                  x="0"
                  y="0"
                  width={badgeW}
                  height="7.2"
                  rx="1.4"
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth="0.45"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))"
                />
                <text
                  x="3"
                  y="5.1"
                  fill="#f8fafc"
                  fontSize="3.2"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isPolar ? (
                    <>📐 <tspan fill="#38bdf8">{keyboardInput.split('<')[0]}</tspan> mm ∠ <tspan fill="#f59e0b">{keyboardInput.split('<')[1] || ''}º</tspan> ↵</>
                  ) : (
                    <>📏 <tspan fill="#38bdf8">{keyboardInput}</tspan> mm ↵</>
                  )}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </main>
  );
};
