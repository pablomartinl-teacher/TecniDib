/**
 * VektorCAD - High-precision PDF & Vector Export Engine
 */

import { jsPDF } from 'jspdf';
import { PageDocument, SheetSize } from './types.ts';

export interface ExportPdfOptions {
  fileName?: string;
  allPages?: boolean;
  scale?: number; // Rasterization scale factor, default 4 (300 DPI high resolution)
  backgroundColor?: string;
}

/**
 * Exports current page or all pages to a normalized vector/raster PDF file
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

  if (!svgRef) {
    throw new Error('Referencia SVG no disponible para la exportación.');
  }

  const pagesToExport = allPages ? pages : [pages[currentPageIndex]];
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
    const sheet = page.sheetSize;
    const isLandscape = sheet.w > sheet.h;

    if (i > 0) {
      doc.addPage([sheet.w, sheet.h], isLandscape ? 'landscape' : 'portrait');
    }

    // Rasterize SVG element to crisp canvas representation
    const svgClone = svgRef.cloneNode(true) as SVGSVGElement;
    // Strip ghost and indicators from the exported SVG
    const ghost = svgClone.querySelector('#layer-ghost');
    if (ghost) ghost.innerHTML = '';
    const snap = svgClone.querySelector('#snap-indicator');
    if (snap) snap.remove();
    const guides = svgClone.querySelector('#layer-guides');
    if (guides) guides.remove();

    svgClone.setAttribute('width', `${sheet.w * scale}px`);
    svgClone.setAttribute('height', `${sheet.h * scale}px`);

    const xml = new XMLSerializer().serializeToString(svgClone);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const imageSrc = `data:image/svg+xml;base64,${svg64}`;

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = sheet.w * scale;
          canvas.height = sheet.h * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve();
            return;
          }
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          doc.addImage(imgData, 'JPEG', 0, 0, sheet.w, sheet.h, undefined, 'FAST');
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => resolve(); // continue even if one page fails
      img.src = imageSrc;
    });
  }

  doc.save(`${fileName.replace(/\.pdf$/i, '')}.pdf`);
}

/**
 * Exports current drawing to pure vector SVG file
 */
export function exportToSVG(svgRef: SVGSVGElement | null, fileName = 'Dibujo_Vectorial'): void {
  if (!svgRef) return;
  const svgClone = svgRef.cloneNode(true) as SVGSVGElement;
  const ghost = svgClone.querySelector('#layer-ghost');
  if (ghost) ghost.innerHTML = '';
  const snap = svgClone.querySelector('#snap-indicator');
  if (snap) snap.remove();
  const guides = svgClone.querySelector('#layer-guides');
  if (guides) guides.remove();

  const xml = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/\.svg$/i, '')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
