/**
 * VektorCAD - High-precision Multi-Page PDF & Vector Export Engine
 * 1:1 pixel-perfect fidelity (exact stroke widths, texts, markers, patterns, transforms, images)
 */

import { jsPDF } from 'jspdf';
import type {
  CadEntity,
  PageDocument,
  SheetSize,
  EllipseEntity,
  TextEntity,
  ImageEntity,
  LineEntity,
  CircleEntity,
  ArcEntity,
  PolygonEntity,
  CurveEntity,
  RectEntity,
  PointEntity,
  SymbolEntity,
  TagEntity,
  MeasureEntity,
  FillEntity,
} from './types.ts';
import {
  calculateIsoDimension,
  getEntityPolygonVertices,
  getSvgArcPath,
  smoothPath,
} from './geometry.ts';

export interface ExportPdfOptions {
  fileName?: string;
  allPages?: boolean;
  scale?: number; // Rasterization scale factor: default 300 DPI (~11.811 px/mm)
  backgroundColor?: string;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Extracts plain text lines from rich html content
 */
function extractTextLines(htmlOrText: string): string[] {
  if (!htmlOrText) return [];
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = htmlOrText
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, '\n');
    const text = temp.textContent || temp.innerText || '';
    const lines = text.split('\n');
    return lines.length > 0 ? lines : [text];
  }
  return htmlOrText
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n');
}

/**
 * Renders an array of CAD entities into clean SVG XML elements matching CadCanvas 1:1
 */
export function renderEntitiesToSvg(entities: CadEntity[], hiddenLayers?: Set<string>): string {
  let out = '';

  for (const ent of entities) {
    if (hiddenLayers && ent.layer && hiddenLayers.has(ent.layer)) {
      continue;
    }

    const baseStyle = ent.style || {
      width: 0.5,
      color: '#000000',
      dash: 'none',
      marker: 'none',
    };

    const strokeColor = baseStyle.color || '#000000';
    const sw = baseStyle.width || 0.5;
    const dashAttr =
      baseStyle.dash && baseStyle.dash !== 'none'
        ? `stroke-dasharray="${baseStyle.dash}"`
        : '';

    let markerAttr = '';
    if (baseStyle.marker === 'arrow') {
      markerAttr = 'marker-start="url(#arrow-start)" marker-end="url(#arrow-end)"';
    } else if (baseStyle.marker === 'tick') {
      markerAttr = 'marker-start="url(#tick)" marker-end="url(#tick)"';
    }

    const hasFill =
      baseStyle.fillColor &&
      baseStyle.fillColor !== '#ffffff' &&
      baseStyle.fillColor !== 'none' &&
      baseStyle.fillColor !== 'transparent';
    const fillAttr = hasFill ? `fill="${baseStyle.fillColor}"` : 'fill="none"';
    const fillOpacity = baseStyle.opacity ?? (hasFill ? 0.75 : 0);
    const fillOpacityAttr = hasFill ? `fill-opacity="${fillOpacity}"` : '';

    switch (ent.type) {
      case 'line':
        out += `<line x1="${ent.x1}" y1="${ent.y1}" x2="${ent.x2}" y2="${ent.y2}" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr} ${markerAttr} stroke-linecap="round"/>\n`;
        break;

      case 'measure': {
        const dim = calculateIsoDimension(
          { x: ent.x1, y: ent.y1 },
          { x: ent.x2, y: ent.y2 },
          ent.offsetDir,
          ent.offsetDistance || 6,
          baseStyle
        );
        const textVal = escapeXml(ent.customText || `${dim.mag.toFixed(1)} mm`);
        out += `
          <g>
            <line x1="${dim.ext1.x1}" y1="${dim.ext1.y1}" x2="${dim.ext1.x2}" y2="${dim.ext1.y2}" stroke="${strokeColor}" stroke-width="0.25" ${dashAttr}/>
            <line x1="${dim.ext2.x1}" y1="${dim.ext2.y1}" x2="${dim.ext2.x2}" y2="${dim.ext2.y2}" stroke="${strokeColor}" stroke-width="0.25" ${dashAttr}/>
            <line x1="${dim.dimLine.x1}" y1="${dim.dimLine.y1}" x2="${dim.dimLine.x2}" y2="${dim.dimLine.y2}" stroke="${strokeColor}" stroke-width="${sw}" marker-start="url(#arrow-start)" marker-end="url(#arrow-end)"/>
            <text x="${dim.text.x}" y="${dim.text.y - 1.2}" fill="${strokeColor}" font-size="${dim.text.fontSize}" font-family="monospace" font-weight="600" text-anchor="middle" transform="rotate(${dim.text.angle}, ${dim.text.x}, ${dim.text.y})">${textVal}</text>
          </g>
        `;
        break;
      }

      case 'circle':
        out += `
          <g>
            <circle cx="${ent.cx}" cy="${ent.cy}" r="${ent.r}" ${fillAttr} ${fillOpacityAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>
            <line x1="${ent.cx - 3}" y1="${ent.cy}" x2="${ent.cx + 3}" y2="${ent.cy}" stroke="${strokeColor}" stroke-width="0.25"/>
            <line x1="${ent.cx}" y1="${ent.cy - 3}" x2="${ent.cx}" y2="${ent.cy + 3}" stroke="${strokeColor}" stroke-width="0.25"/>
          </g>
        `;
        break;

      case 'arc': {
        const pathData = getSvgArcPath(ent.cx, ent.cy, ent.r, ent.startAngle, ent.sweepAngle);
        out += `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>\n`;
        break;
      }

      case 'polygon': {
        const vertices = getEntityPolygonVertices(ent);
        const ptsStr = vertices.map((v) => `${v.x},${v.y}`).join(' ');
        out += `<polygon points="${ptsStr}" ${fillAttr} ${fillOpacityAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>\n`;
        break;
      }

      case 'curve': {
        const pathData = smoothPath(ent.points);
        out += `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>\n`;
        break;
      }

      case 'rect':
        out += `<rect x="${ent.x}" y="${ent.y}" width="${ent.w}" height="${ent.h}" ${fillAttr} ${fillOpacityAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>\n`;
        break;

      case 'point':
        out += `
          <g>
            <line x1="${ent.x - 2.5}" y1="${ent.y}" x2="${ent.x + 2.5}" y2="${ent.y}" stroke="${strokeColor}" stroke-width="${sw}"/>
            <line x1="${ent.x}" y1="${ent.y - 2.5}" x2="${ent.x}" y2="${ent.y + 2.5}" stroke="${strokeColor}" stroke-width="${sw}"/>
          </g>
        `;
        break;

      case 'symbol': {
        const cx = ent.x;
        const cy = ent.y;
        if (ent.symbolType === 'perp') {
          out += `
            <g>
              <rect x="${cx - 2.5}" y="${cy - 2.5}" width="5" height="5" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>
              <circle cx="${cx}" cy="${cy}" r="${sw * 0.8}" fill="${strokeColor}"/>
            </g>
          `;
        } else if (ent.symbolType === 'para') {
          out += `
            <g>
              <line x1="${cx - 1.5}" y1="${cy + 3}" x2="${cx + 1}" y2="${cy - 3}" stroke="${strokeColor}" stroke-width="${sw}"/>
              <line x1="${cx + 1.5}" y1="${cy + 3}" x2="${cx + 4}" y2="${cy - 3}" stroke="${strokeColor}" stroke-width="${sw}"/>
            </g>
          `;
        } else if (ent.symbolType === 'coin') {
          out += `
            <g>
              <line x1="${cx - 2.5}" y1="${cy - 1.5}" x2="${cx + 2.5}" y2="${cy - 1.5}" stroke="${strokeColor}" stroke-width="${sw}"/>
              <line x1="${cx - 2.5}" y1="${cy}" x2="${cx + 2.5}" y2="${cy}" stroke="${strokeColor}" stroke-width="${sw}"/>
              <line x1="${cx - 2.5}" y1="${cy + 1.5}" x2="${cx + 2.5}" y2="${cy + 1.5}" stroke="${strokeColor}" stroke-width="${sw}"/>
            </g>
          `;
        }
        break;
      }

      case 'tag':
        out += `<text x="${ent.x}" y="${ent.y}" fill="${strokeColor}" font-size="${ent.fontSize || 4}" font-family="sans-serif" font-weight="bold" transform="rotate(${ent.angle || 0}, ${ent.x}, ${ent.y})">${escapeXml(ent.text)}</text>\n`;
        break;

      case 'text': {
        const textEnt = ent as TextEntity;
        const fontSize = textEnt.fontSize || 5;
        const boxW = typeof textEnt.w === 'number' && textEnt.w > 0 ? textEnt.w : 60;
        const boxH = typeof textEnt.h === 'number' && textEnt.h > 0 ? textEnt.h : 25;
        const rotTransform = textEnt.angle
          ? `transform="rotate(${textEnt.angle} ${textEnt.x + boxW / 2} ${textEnt.y + boxH / 2})"`
          : '';

        const lines = extractTextLines(textEnt.textHtml || textEnt.text || '');
        const tspans = lines
          .map(
            (l, idx) =>
              `<tspan x="${textEnt.x + (textEnt.align === 'center' ? boxW / 2 : textEnt.align === 'right' ? boxW - 2 : 2)}" dy="${idx === 0 ? '1em' : '1.3em'}">${escapeXml(l)}</tspan>`
          )
          .join('');
        const textAnchor = textEnt.align === 'center' ? 'middle' : textEnt.align === 'right' ? 'end' : 'start';

        out += `
          <g ${rotTransform}>
            <text x="${textEnt.x}" y="${textEnt.y}" fill="${strokeColor}" font-size="${fontSize}" font-family="sans-serif" text-anchor="${textAnchor}">
              ${tspans}
            </text>
          </g>
        `;
        break;
      }

      case 'fill': {
        const pts = ent.points.map((p) => `${p.x},${p.y}`).join(' ');
        const patternId = `pat-pdf-${ent.id}`;
        const hasPatternBg =
          baseStyle.fillColor &&
          baseStyle.fillColor !== 'none' &&
          baseStyle.fillColor !== 'transparent' &&
          baseStyle.fillColor !== '#ffffff';
        out += `
          <g>
            <defs>
              <pattern id="${patternId}" width="${ent.hatchSpacing || 4}" height="${ent.hatchSpacing || 4}" patternTransform="rotate(${ent.hatchAngle ?? 45} 0 0)" patternUnits="userSpaceOnUse">
                ${hasPatternBg ? `<rect width="100%" height="100%" fill="${baseStyle.fillColor}" fill-opacity="${baseStyle.opacity ?? 0.35}"/>` : ''}
                <line x1="0" y1="0" x2="0" y2="${ent.hatchSpacing || 4}" stroke="${strokeColor}" stroke-width="${Math.max(0.2, sw * 0.75)}"/>
              </pattern>
            </defs>
            <polygon points="${pts}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>
          </g>
        `;
        break;
      }

      case 'image': {
        if (ent.href && typeof ent.href === 'string' && ent.href.trim() !== '' && ent.href !== 'null') {
          const imgEnt = ent as ImageEntity;
          const rotTransform = imgEnt.rotation
            ? `transform="rotate(${imgEnt.rotation} ${imgEnt.x + imgEnt.width / 2} ${imgEnt.y + imgEnt.height / 2})"`
            : '';
          const opacAttr = typeof imgEnt.opacity === 'number' ? `opacity="${imgEnt.opacity}"` : '';
          out += `<g ${rotTransform}><image x="${imgEnt.x}" y="${imgEnt.y}" width="${imgEnt.width}" height="${imgEnt.height}" href="${imgEnt.href}" ${opacAttr}/></g>\n`;
        }
        break;
      }

      case 'ellipse': {
        const el = ent as EllipseEntity;
        out += `
          <g>
            <ellipse cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}" transform="rotate(${el.rotation || 0} ${el.cx} ${el.cy})" ${fillAttr} ${fillOpacityAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>
            <line x1="${el.cx - 2.5}" y1="${el.cy}" x2="${el.cx + 2.5}" y2="${el.cy}" stroke="${strokeColor}" stroke-width="0.25"/>
            <line x1="${el.cx}" y1="${el.cy - 2.5}" x2="${el.cx}" y2="${el.cy + 2.5}" stroke="${strokeColor}" stroke-width="0.25"/>
          </g>
        `;
        break;
      }

      default:
        break;
    }
  }

  return out;
}

/**
 * Builds the complete standalone SVG XML document for an individual PageDocument
 */
export function renderPageToSvgString(
  page: PageDocument,
  scale = 300 / 25.4,
  backgroundColor = '#ffffff',
  hiddenLayers?: Set<string>
): string {
  const sheet = page.sheetSize || {
    name: 'A4',
    w: 297,
    h: 210,
    orientation: 'landscape',
  };

  const widthPx = Math.round(sheet.w * scale);
  const heightPx = Math.round(sheet.h * scale);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheet.w} ${sheet.h}" width="${widthPx}px" height="${heightPx}px">
  <defs>
    <!-- Standard ISO 129 15-degree dimension arrows: arrow-end points at target line, arrow-start points at starting extension -->
    <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill="#000000" />
    </marker>
    <marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <line x1="8" y1="2" x2="2" y2="8" stroke="#000000" stroke-width="1.5" stroke-linecap="round" />
    </marker>
  </defs>

  <!-- Clean solid paper background -->
  <rect width="100%" height="100%" fill="${backgroundColor}" />

  <!-- Background PDF / imported exercise image if present -->
  ${page.bgImage ? `<image x="0" y="0" width="100%" height="100%" href="${page.bgImage}" preserveAspectRatio="xMidYMid meet" opacity="0.85"/>` : ''}

  <!-- Page Solution Entities Layer -->
  <g id="layer-solucion">
    ${renderEntitiesToSvg(page.data || [], hiddenLayers)}
  </g>
</svg>
  `.trim();
}

/**
 * Loads an image from a data URL or blob asynchronously
 */
function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string' || src.trim() === '') {
      return resolve(null);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Helper to draw technical ISO arrows onto Canvas 2D
 */
function drawCanvasArrowHead(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  fromX: number,
  fromY: number,
  color: string,
  sw: number
) {
  const angle = Math.atan2(tipY - fromY, tipX - fromX);
  const arrowLength = Math.max(8, sw * 4);
  const arrowWidth = Math.max(3, sw * 1.5);

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(
    tipX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
    tipY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
  );
  ctx.lineTo(
    tipX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
    tipY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Direct High-DPI Canvas 2D Renderer
 * Eliminates SVG-in-Image security taint and foreignObject blocking
 */
export async function renderPageToCanvas(
  page: PageDocument,
  scale = 300 / 25.4,
  backgroundColor = '#ffffff',
  hiddenLayers?: Set<string>
): Promise<HTMLCanvasElement> {
  const sheet = page.sheetSize || {
    name: 'A4',
    w: 297,
    h: 210,
    orientation: 'landscape',
  };

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sheet.w * scale);
  canvas.height = Math.round(sheet.h * scale);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('No 2d context available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Fill solid paper background
  ctx.fillStyle = backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw background image / PDF sheet if present
  if (page.bgImage) {
    try {
      const bgImg = await loadImageElement(page.bgImage);
      if (bgImg) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } catch (e) {
      console.warn('Could not render bgImage on PDF canvas', e);
    }
  }

  // 3. Render each entity with exact millimeter precision
  const entities = page.data || [];
  for (const ent of entities) {
    if (hiddenLayers && ent.layer && hiddenLayers.has(ent.layer)) {
      continue;
    }

    const baseStyle = ent.style || {
      width: 0.5,
      color: '#000000',
      dash: 'none',
      marker: 'none',
    };

    const strokeColor = baseStyle.color || '#000000';
    const sw = (baseStyle.width || 0.5) * scale;
    const hasFill =
      baseStyle.fillColor &&
      baseStyle.fillColor !== '#ffffff' &&
      baseStyle.fillColor !== 'none' &&
      baseStyle.fillColor !== 'transparent';

    switch (ent.type) {
      case 'line': {
        const line = ent as LineEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = 'round';
        if (baseStyle.dash && baseStyle.dash !== 'none') {
          const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
          ctx.setLineDash(dashes);
        }
        ctx.beginPath();
        ctx.moveTo(line.x1 * scale, line.y1 * scale);
        ctx.lineTo(line.x2 * scale, line.y2 * scale);
        ctx.stroke();

        if (baseStyle.marker === 'arrow') {
          drawCanvasArrowHead(ctx, line.x1 * scale, line.y1 * scale, line.x2 * scale, line.y2 * scale, strokeColor, sw);
          drawCanvasArrowHead(ctx, line.x2 * scale, line.y2 * scale, line.x1 * scale, line.y1 * scale, strokeColor, sw);
        } else if (baseStyle.marker === 'tick') {
          ctx.beginPath();
          ctx.moveTo((line.x1 - 1.5) * scale, (line.y1 + 1.5) * scale);
          ctx.lineTo((line.x1 + 1.5) * scale, (line.y1 - 1.5) * scale);
          ctx.moveTo((line.x2 - 1.5) * scale, (line.y2 + 1.5) * scale);
          ctx.lineTo((line.x2 + 1.5) * scale, (line.y2 - 1.5) * scale);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'measure': {
        const meas = ent as MeasureEntity;
        const dim = calculateIsoDimension(
          { x: meas.x1, y: meas.y1 },
          { x: meas.x2, y: meas.y2 },
          meas.offsetDir,
          meas.offsetDistance || 6,
          baseStyle
        );
        const textVal = meas.customText || `${dim.mag.toFixed(1)} mm`;

        ctx.save();
        // Extension lines (thin 0.25mm)
        ctx.lineWidth = 0.25 * scale;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(dim.ext1.x1 * scale, dim.ext1.y1 * scale);
        ctx.lineTo(dim.ext1.x2 * scale, dim.ext1.y2 * scale);
        ctx.moveTo(dim.ext2.x1 * scale, dim.ext2.y1 * scale);
        ctx.lineTo(dim.ext2.x2 * scale, dim.ext2.y2 * scale);
        ctx.stroke();

        // Main dimension line
        ctx.lineWidth = sw;
        ctx.beginPath();
        ctx.moveTo(dim.dimLine.x1 * scale, dim.dimLine.y1 * scale);
        ctx.lineTo(dim.dimLine.x2 * scale, dim.dimLine.y2 * scale);
        ctx.stroke();

        // Arrowheads
        drawCanvasArrowHead(ctx, dim.dimLine.x1 * scale, dim.dimLine.y1 * scale, dim.dimLine.x2 * scale, dim.dimLine.y2 * scale, strokeColor, sw);
        drawCanvasArrowHead(ctx, dim.dimLine.x2 * scale, dim.dimLine.y2 * scale, dim.dimLine.x1 * scale, dim.dimLine.y1 * scale, strokeColor, sw);

        // Text
        ctx.translate(dim.text.x * scale, dim.text.y * scale);
        ctx.rotate((dim.text.angle * Math.PI) / 180);
        ctx.fillStyle = strokeColor;
        ctx.font = `600 ${dim.text.fontSize * scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(textVal, 0, -1.2 * scale);
        ctx.restore();
        break;
      }

      case 'circle': {
        const circ = ent as CircleEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        if (hasFill && baseStyle.fillColor) {
          ctx.fillStyle = baseStyle.fillColor;
          ctx.globalAlpha = baseStyle.opacity ?? 0.75;
          ctx.beginPath();
          ctx.arc(circ.cx * scale, circ.cy * scale, circ.r * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (baseStyle.dash && baseStyle.dash !== 'none') {
          const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
          ctx.setLineDash(dashes);
        }
        ctx.beginPath();
        ctx.arc(circ.cx * scale, circ.cy * scale, circ.r * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Standard center cross mark
        ctx.setLineDash([]);
        ctx.lineWidth = 0.25 * scale;
        ctx.beginPath();
        ctx.moveTo((circ.cx - 3) * scale, circ.cy * scale);
        ctx.lineTo((circ.cx + 3) * scale, circ.cy * scale);
        ctx.moveTo(circ.cx * scale, (circ.cy - 3) * scale);
        ctx.lineTo(circ.cx * scale, (circ.cy + 3) * scale);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'arc': {
        const arc = ent as ArcEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        if (baseStyle.dash && baseStyle.dash !== 'none') {
          const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
          ctx.setLineDash(dashes);
        }
        ctx.beginPath();
        const endAngle = arc.startAngle + arc.sweepAngle;
        const ccw = arc.sweepAngle < 0;
        ctx.arc(arc.cx * scale, arc.cy * scale, arc.r * scale, arc.startAngle, endAngle, ccw);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'polygon': {
        const poly = ent as PolygonEntity;
        const verts = getEntityPolygonVertices(poly);
        if (verts.length >= 3) {
          ctx.save();
          ctx.lineWidth = sw;
          ctx.strokeStyle = strokeColor;
          ctx.beginPath();
          ctx.moveTo(verts[0].x * scale, verts[0].y * scale);
          for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(verts[i].x * scale, verts[i].y * scale);
          }
          ctx.closePath();
          if (hasFill && baseStyle.fillColor) {
            ctx.fillStyle = baseStyle.fillColor;
            ctx.globalAlpha = baseStyle.opacity ?? 0.75;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (baseStyle.dash && baseStyle.dash !== 'none') {
            const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
            ctx.setLineDash(dashes);
          }
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      case 'curve': {
        const crv = ent as CurveEntity;
        if (crv.points && crv.points.length >= 2) {
          const pathData = smoothPath(crv.points);
          ctx.save();
          ctx.lineWidth = sw;
          ctx.strokeStyle = strokeColor;
          if (baseStyle.dash && baseStyle.dash !== 'none') {
            const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
            ctx.setLineDash(dashes);
          }
          try {
            const p2d = new Path2D(pathData);
            ctx.scale(scale, scale);
            ctx.stroke(p2d);
          } catch {
            // Fallback polyline
            ctx.beginPath();
            ctx.moveTo(crv.points[0].x * scale, crv.points[0].y * scale);
            for (let i = 1; i < crv.points.length; i++) {
              ctx.lineTo(crv.points[i].x * scale, crv.points[i].y * scale);
            }
            ctx.stroke();
          }
          ctx.restore();
        }
        break;
      }

      case 'rect': {
        const rect = ent as RectEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        if (hasFill && baseStyle.fillColor) {
          ctx.fillStyle = baseStyle.fillColor;
          ctx.globalAlpha = baseStyle.opacity ?? 0.75;
          ctx.fillRect(rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale);
          ctx.globalAlpha = 1;
        }
        if (baseStyle.dash && baseStyle.dash !== 'none') {
          const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
          ctx.setLineDash(dashes);
        }
        ctx.strokeRect(rect.x * scale, rect.y * scale, rect.w * scale, rect.h * scale);
        ctx.restore();
        break;
      }

      case 'point': {
        const pt = ent as PointEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo((pt.x - 2.5) * scale, pt.y * scale);
        ctx.lineTo((pt.x + 2.5) * scale, pt.y * scale);
        ctx.moveTo(pt.x * scale, (pt.y - 2.5) * scale);
        ctx.lineTo(pt.x * scale, (pt.y + 2.5) * scale);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'symbol': {
        const sym = ent as SymbolEntity;
        const cx = sym.x * scale;
        const cy = sym.y * scale;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        if (sym.symbolType === 'perp') {
          ctx.strokeRect(cx - 2.5 * scale, cy - 2.5 * scale, 5 * scale, 5 * scale);
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(cx, cy, sw * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (sym.symbolType === 'para') {
          ctx.beginPath();
          ctx.moveTo(cx - 1.5 * scale, cy + 3 * scale);
          ctx.lineTo(cx + 1 * scale, cy - 3 * scale);
          ctx.moveTo(cx + 1.5 * scale, cy + 3 * scale);
          ctx.lineTo(cx + 4 * scale, cy - 3 * scale);
          ctx.stroke();
        } else if (sym.symbolType === 'coin') {
          ctx.beginPath();
          ctx.moveTo(cx - 2.5 * scale, cy - 1.5 * scale);
          ctx.lineTo(cx + 2.5 * scale, cy - 1.5 * scale);
          ctx.moveTo(cx - 2.5 * scale, cy);
          ctx.lineTo(cx + 2.5 * scale, cy);
          ctx.moveTo(cx - 2.5 * scale, cy + 1.5 * scale);
          ctx.lineTo(cx + 2.5 * scale, cy + 1.5 * scale);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'tag': {
        const tag = ent as TagEntity;
        ctx.save();
        ctx.translate(tag.x * scale, tag.y * scale);
        if (tag.angle) ctx.rotate((tag.angle * Math.PI) / 180);
        ctx.fillStyle = strokeColor;
        ctx.font = `bold ${(tag.fontSize || 4) * scale}px sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(tag.text, 0, 0);
        ctx.restore();
        break;
      }

      case 'text': {
        const textEnt = ent as TextEntity;
        const boxW = typeof textEnt.w === 'number' && textEnt.w > 0 ? textEnt.w : 60;
        const boxH = typeof textEnt.h === 'number' && textEnt.h > 0 ? textEnt.h : 25;
        const fontSizePx = (textEnt.fontSize || 5) * scale;
        const lines = extractTextLines(textEnt.textHtml || textEnt.text || '');

        ctx.save();
        // Free rotation around center of text box
        const centerX = (textEnt.x + boxW / 2) * scale;
        const centerY = (textEnt.y + boxH / 2) * scale;
        if (textEnt.angle) {
          ctx.translate(centerX, centerY);
          ctx.rotate((textEnt.angle * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        ctx.fillStyle = strokeColor;
        ctx.font = `${fontSizePx}px sans-serif`;
        ctx.textBaseline = 'top';

        let startX = textEnt.x * scale + 2 * scale;
        if (textEnt.align === 'center') {
          startX = (textEnt.x + boxW / 2) * scale;
          ctx.textAlign = 'center';
        } else if (textEnt.align === 'right') {
          startX = (textEnt.x + boxW) * scale - 2 * scale;
          ctx.textAlign = 'right';
        } else {
          ctx.textAlign = 'left';
        }

        const lineHeight = fontSizePx * 1.3;
        let curY = textEnt.y * scale + 2 * scale;
        for (const line of lines) {
          ctx.fillText(line, startX, curY);
          curY += lineHeight;
        }
        ctx.restore();
        break;
      }

      case 'image': {
        const imgEnt = ent as ImageEntity;
        if (imgEnt.href && typeof imgEnt.href === 'string' && imgEnt.href.trim() !== '') {
          try {
            const imgEl = await loadImageElement(imgEnt.href);
            if (imgEl) {
              const imgW = (imgEnt.width || 50) * scale;
              const imgH = (imgEnt.height || 50) * scale;
              const centerX = imgEnt.x * scale + imgW / 2;
              const centerY = imgEnt.y * scale + imgH / 2;

              ctx.save();
              if (imgEnt.rotation) {
                ctx.translate(centerX, centerY);
                ctx.rotate((imgEnt.rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
              }
              ctx.globalAlpha = imgEnt.opacity ?? 1;
              ctx.drawImage(imgEl, imgEnt.x * scale, imgEnt.y * scale, imgW, imgH);
              ctx.restore();
            }
          } catch (e) {
            console.warn('Could not draw image entity to PDF canvas', e);
          }
        }
        break;
      }

      case 'fill': {
        const fillEnt = ent as FillEntity;
        if (fillEnt.points && fillEnt.points.length >= 3) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(fillEnt.points[0].x * scale, fillEnt.points[0].y * scale);
          for (let i = 1; i < fillEnt.points.length; i++) {
            ctx.lineTo(fillEnt.points[i].x * scale, fillEnt.points[i].y * scale);
          }
          ctx.closePath();

          // Background fill if configured
          if (hasFill && baseStyle.fillColor) {
            ctx.fillStyle = baseStyle.fillColor;
            ctx.globalAlpha = baseStyle.opacity ?? 0.35;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Clip to boundary and draw 45º technical hatching
          ctx.save();
          ctx.clip();
          ctx.lineWidth = Math.max(0.2, sw * 0.75);
          ctx.strokeStyle = strokeColor;
          const spacing = (fillEnt.hatchSpacing || 4) * scale;
          const hatchAngle = (fillEnt.hatchAngle ?? 45) * (Math.PI / 180);

          // Bounding box of points
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          for (const p of fillEnt.points) {
            if (p.x * scale < minX) minX = p.x * scale;
            if (p.x * scale > maxX) maxX = p.x * scale;
            if (p.y * scale < minY) minY = p.y * scale;
            if (p.y * scale > maxY) maxY = p.y * scale;
          }
          const diag = Math.hypot(maxX - minX, maxY - minY) * 1.5;
          const midX = (minX + maxX) / 2;
          const midY = (minY + maxY) / 2;

          ctx.translate(midX, midY);
          ctx.rotate(hatchAngle);
          for (let offset = -diag; offset <= diag; offset += spacing) {
            ctx.beginPath();
            ctx.moveTo(offset, -diag);
            ctx.lineTo(offset, diag);
            ctx.stroke();
          }
          ctx.restore(); // restore clip

          // Outline
          ctx.lineWidth = sw;
          ctx.strokeStyle = strokeColor;
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      case 'ellipse': {
        const el = ent as EllipseEntity;
        ctx.save();
        ctx.lineWidth = sw;
        ctx.strokeStyle = strokeColor;
        ctx.translate(el.cx * scale, el.cy * scale);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

        if (hasFill && baseStyle.fillColor) {
          ctx.fillStyle = baseStyle.fillColor;
          ctx.globalAlpha = baseStyle.opacity ?? 0.75;
          ctx.beginPath();
          ctx.ellipse(0, 0, el.rx * scale, el.ry * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (baseStyle.dash && baseStyle.dash !== 'none') {
          const dashes = baseStyle.dash.split(/[\s,]+/).map((n) => parseFloat(n) * scale).filter((n) => !isNaN(n));
          ctx.setLineDash(dashes);
        }
        ctx.beginPath();
        ctx.ellipse(0, 0, el.rx * scale, el.ry * scale, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Center mark
        ctx.setLineDash([]);
        ctx.lineWidth = 0.25 * scale;
        ctx.beginPath();
        ctx.moveTo(-2.5 * scale, 0);
        ctx.lineTo(2.5 * scale, 0);
        ctx.moveTo(0, -2.5 * scale);
        ctx.lineTo(0, 2.5 * scale);
        ctx.stroke();
        ctx.restore();
        break;
      }

      default:
        break;
    }
  }

  return canvas;
}

/**
 * Exports current page or all pages to a normalized multi-page PDF document
 * with 300 DPI lossless high-fidelity output.
 */
export async function exportProjectToPDF(
  pages: PageDocument[],
  currentPageIndex: number,
  svgRef: SVGSVGElement | null,
  options: ExportPdfOptions = {}
): Promise<void> {
  const PRINT_300_DPI_SCALE = 300 / 25.4;

  const {
    fileName = 'Lamina_Tecnica_VektorCAD',
    allPages = false,
    scale = PRINT_300_DPI_SCALE,
    backgroundColor = '#ffffff',
  } = options;

  const pagesToExport = allPages ? pages : [pages[currentPageIndex]];
  if (!pagesToExport || pagesToExport.length === 0) return;

  const firstSheet: SheetSize = pagesToExport[0]?.sheetSize || {
    name: 'A4',
    w: 297,
    h: 210,
    orientation: 'landscape',
  };

  const doc = new jsPDF({
    orientation: firstSheet.w > firstSheet.h ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [firstSheet.w, firstSheet.h],
    compress: true,
  });

  for (let i = 0; i < pagesToExport.length; i++) {
    const page = pagesToExport[i];
    const sheet = page.sheetSize || firstSheet;
    const isLandscape = sheet.w > sheet.h;

    if (i > 0) {
      doc.addPage([sheet.w, sheet.h], isLandscape ? 'landscape' : 'portrait');
    }

    // Direct Canvas 2D render - 100% pixel-perfect and immunity to foreignObject or taint bugs
    const canvas = await renderPageToCanvas(page, scale, backgroundColor);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, sheet.w, sheet.h, undefined, 'FAST');
  }

  const cleanName = `${fileName.replace(/\.pdf$/i, '').trim() || 'Lamina_CAD'}.pdf`;
  doc.save(cleanName);
}

/**
 * Exports drawing to pure vector SVG file
 */
export function exportToSVG(
  svgRef: SVGSVGElement | null,
  fileName = 'Dibujo_Vectorial',
  page?: PageDocument
): void {
  let xml = '';
  if (page) {
    xml = renderPageToSvgString(page, 1, '#ffffff');
  } else if (svgRef) {
    const svgClone = svgRef.cloneNode(true) as SVGSVGElement;
    const ghost = svgClone.querySelector('#layer-ghost');
    if (ghost) ghost.innerHTML = '';
    const snap = svgClone.querySelector('#snap-indicator');
    if (snap) snap.remove();
    const guides = svgClone.querySelector('#layer-guides');
    if (guides) guides.remove();
    xml = new XMLSerializer().serializeToString(svgClone);
  } else {
    return;
  }

  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/\.svg$/i, '')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
