/**
 * VektorCAD - High-precision Multi-Page PDF & Vector Export Engine
 * Renders each page's specific CAD entities cleanly into individual PDF pages
 */

import { jsPDF } from 'jspdf';
import type { CadEntity, PageDocument, SheetSize, EllipseEntity } from './types.ts';
import {
  calculateIsoDimension,
  getPolygonVertices,
  getSvgArcPath,
  smoothPath,
} from './geometry.ts';

export interface ExportPdfOptions {
  fileName?: string;
  allPages?: boolean;
  scale?: number; // Rasterization scale factor, default 4 (300 DPI high resolution)
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
 * Renders an array of CAD entities into clean SVG XML elements
 */
export function renderEntitiesToSvg(entities: CadEntity[]): string {
  let out = '';

  for (const ent of entities) {
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
      markerAttr = 'marker-end="url(#arrow-end)"';
    } else if (baseStyle.marker === 'tick') {
      markerAttr = 'marker-start="url(#tick)" marker-end="url(#tick)"';
    }

    const fillAttr =
      baseStyle.fillColor && baseStyle.fillColor !== '#ffffff' && baseStyle.fillColor !== 'none'
        ? `fill="${baseStyle.fillColor}"`
        : 'fill="none"';

    switch (ent.type) {
      case 'line':
        out += `<line x1="${ent.x1}" y1="${ent.y1}" x2="${ent.x2}" y2="${ent.y2}" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr} ${markerAttr} stroke-linecap="round"/>`;
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
            <circle cx="${ent.cx}" cy="${ent.cy}" r="${ent.r}" ${fillAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>
            <line x1="${ent.cx - 3}" y1="${ent.cy}" x2="${ent.cx + 3}" y2="${ent.cy}" stroke="${strokeColor}" stroke-width="0.25"/>
            <line x1="${ent.cx}" y1="${ent.cy - 3}" x2="${ent.cx}" y2="${ent.cy + 3}" stroke="${strokeColor}" stroke-width="0.25"/>
          </g>
        `;
        break;

      case 'arc': {
        const pathData = getSvgArcPath(ent.cx, ent.cy, ent.r, ent.startAngle, ent.sweepAngle);
        out += `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>`;
        break;
      }

      case 'polygon': {
        const vertices = getPolygonVertices(ent.cx, ent.cy, ent.r, ent.sides, ent.angle);
        const ptsStr = vertices.map((v) => `${v.x},${v.y}`).join(' ');
        out += `<polygon points="${ptsStr}" ${fillAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>`;
        break;
      }

      case 'curve': {
        const pathData = smoothPath(ent.points);
        out += `<path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>`;
        break;
      }

      case 'rect':
        out += `<rect x="${ent.x}" y="${ent.y}" width="${ent.w}" height="${ent.h}" ${fillAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>`;
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
        out += `<text x="${ent.x}" y="${ent.y}" fill="${strokeColor}" font-size="${ent.fontSize || 4}" font-family="sans-serif" font-weight="bold" transform="rotate(${ent.angle || 0}, ${ent.x}, ${ent.y})">${escapeXml(ent.text)}</text>`;
        break;

      case 'text': {
        const fontSize = ent.fontSize || 5;
        const rawText = (ent.textHtml || '')
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();
        const lines = rawText.split('\n');
        out += `<text x="${ent.x}" y="${ent.y + fontSize}" fill="${strokeColor}" font-size="${fontSize}" font-family="sans-serif">`;
        lines.forEach((line, idx) => {
          out += `<tspan x="${ent.x}" dy="${idx === 0 ? 0 : fontSize * 1.3}">${escapeXml(line)}</tspan>`;
        });
        out += `</text>`;
        break;
      }

      case 'fill': {
        const pts = ent.points.map((p) => `${p.x},${p.y}`).join(' ');
        const patternId = `pat-${ent.id}`;
        out += `
          <g>
            <defs>
              <pattern id="${patternId}" width="${ent.hatchSpacing || 4}" height="${ent.hatchSpacing || 4}" patternTransform="rotate(${ent.hatchAngle || 45} 0 0)" patternUnits="userSpaceOnUse">
                ${baseStyle.fillColor ? `<rect width="100%" height="100%" fill="${baseStyle.fillColor}" />` : ''}
                <line x1="0" y1="0" x2="0" y2="${ent.hatchSpacing || 4}" stroke="${strokeColor}" stroke-width="${sw * 0.7}"/>
              </pattern>
            </defs>
            <polygon points="${pts}" fill="url(#${patternId})" stroke="${strokeColor}" stroke-width="${sw}"/>
          </g>
        `;
        break;
      }

      case 'image':
        out += `<image x="${ent.x}" y="${ent.y}" width="${ent.width}" height="${ent.height}" href="${ent.href}"/>`;
        break;

      case 'ellipse': {
        const el = ent as EllipseEntity;
        out += `
          <g>
            <ellipse cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}" transform="rotate(${el.rotation || 0} ${el.cx} ${el.cy})" ${fillAttr} stroke="${strokeColor}" stroke-width="${sw}" ${dashAttr}/>
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
  scale = 4,
  backgroundColor = '#ffffff'
): string {
  const sheet = page.sheetSize || {
    name: 'A4',
    w: 297,
    h: 210,
    orientation: 'landscape',
  };

  const widthPx = sheet.w * scale;
  const heightPx = sheet.h * scale;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sheet.w} ${sheet.h}" width="${widthPx}px" height="${heightPx}px">
  <defs>
    <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
    <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
    <marker id="tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <line x1="2" y1="8" x2="8" y2="2" stroke="#000000" stroke-width="1.5" />
    </marker>
  </defs>

  <!-- Clean solid paper background -->
  <rect width="100%" height="100%" fill="${backgroundColor}" />

  <!-- Background PDF / imported exercise image if present -->
  ${page.bgImage ? `<image x="0" y="0" width="100%" height="100%" href="${page.bgImage}" preserveAspectRatio="xMidYMid meet" opacity="0.85"/>` : ''}

  <!-- Page Solution Entities -->
  <g id="layer-solucion">
    ${renderEntitiesToSvg(page.data || [])}
  </g>
</svg>
  `.trim();
}

/**
 * Exports current page or all pages to a normalized multi-page PDF document
 */
export async function exportProjectToPDF(
  pages: PageDocument[],
  currentPageIndex: number,
  svgRef: SVGSVGElement | null,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    fileName = 'Lamina_Tecnica_VektorCAD',
    allPages = false,
    scale = 4,
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

    // Build the specific SVG for THIS page to ensure each page renders its own unique entities
    const pageSvg = renderPageToSvgString(page, scale, backgroundColor);

    await new Promise<void>((resolve, reject) => {
      const blob = new Blob([pageSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(sheet.w * scale);
          canvas.height = Math.round(sheet.h * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve();
            return;
          }

          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          doc.addImage(imgData, 'JPEG', 0, 0, sheet.w, sheet.h, undefined, 'FAST');
          resolve();
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(); // Continue even if one page fails
      };

      img.src = url;
    });
  }

  doc.save(`${fileName.replace(/\.pdf$/i, '')}.pdf`);
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
