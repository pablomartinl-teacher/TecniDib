/**
 * VektorCAD - Persistence & Project Storage (IndexedDB + JSON)
 */

import { CadProject, PageDocument, SheetSize, CadEntity, TextEntity, EntityStyle, DashStyle, MarkerStyle } from './types.ts';

const DB_NAME = 'VektorCAD_DB';
const STORE_NAME = 'project_store';
const DB_VERSION = 1;

export const DEFAULT_SHEET: SheetSize = {
  name: 'DIN A4 Horizontal',
  w: 297,
  h: 210,
  orientation: 'landscape',
};

export const SHEET_PRESETS: SheetSize[] = [
  { name: 'DIN A4 Horizontal', w: 297, h: 210, orientation: 'landscape' },
  { name: 'DIN A4 Vertical', w: 210, h: 297, orientation: 'portrait' },
  { name: 'DIN A3 Horizontal', w: 420, h: 297, orientation: 'landscape' },
  { name: 'DIN A3 Vertical', w: 297, h: 420, orientation: 'portrait' },
  { name: 'DIN A2 Horizontal', w: 594, h: 420, orientation: 'landscape' },
];

export function createDefaultPage(index = 1, sheet = DEFAULT_SHEET): PageDocument {
  return {
    id: `page-${Date.now()}-${index}`,
    title: `Lámina ${index}`,
    data: [],
    history: [],
    redoHistory: [],
    bgImage: null,
    sheetSize: { ...sheet },
  };
}

export function createDefaultProject(): CadProject {
  return {
    version: '2.0.0',
    projectName: 'Proyecto_Dibujo_Tecnico',
    pages: [createDefaultPage(1, DEFAULT_SHEET)],
    currentPageIndex: 0,
    globalSheetSize: { ...DEFAULT_SHEET },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this environment'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProjectToDB(project: CadProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(project, 'current_project');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB, fallback to localStorage', err);
    try {
      localStorage.setItem('vektorcad_project_fallback', JSON.stringify(project));
    } catch {
      // ignore
    }
  }
}

export async function loadProjectFromDB(): Promise<CadProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_project');
      req.onsuccess = () => {
        if (req.result) resolve(normalizeProject(req.result));
        else resolve(null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load from IndexedDB, trying localStorage', err);
    try {
      const saved = localStorage.getItem('vektorcad_project_fallback');
      if (saved) return normalizeProject(JSON.parse(saved));
    } catch {
      // ignore
    }
    return null;
  }
}

export function downloadProjectFile(project: CadProject, filename = 'Proyecto_VektorCAD') {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/\.json$/i, '')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Normalizes an entity to ensure all fields (especially texts, dimensions, and splines) are fully intact
 */
export function normalizeEntity(ent: any): CadEntity {
  if (!ent || typeof ent !== 'object') {
    return {
      type: 'point',
      id: Date.now() + Math.floor(Math.random() * 1000),
      x: 0,
      y: 0,
      style: { width: 0.5, color: '#000000', dash: 'none', marker: 'none' },
    };
  }

  const id = typeof ent.id === 'number' ? ent.id : Date.now() + Math.floor(Math.random() * 10000);
  const style: EntityStyle =
    ent.style && typeof ent.style === 'object'
      ? {
          width: typeof ent.style.width === 'number' ? ent.style.width : 0.5,
          color: ent.style.color || '#000000',
          fillColor: ent.style.fillColor,
          dash: (ent.style.dash || 'none') as DashStyle,
          marker: (ent.style.marker || 'none') as MarkerStyle,
          opacity: ent.style.opacity,
        }
      : { width: 0.5, color: '#000000', dash: 'none' as DashStyle, marker: 'none' as MarkerStyle };
  const layer = ent.layer || 'solucion';

  const rawType = (ent.type || ent.kind || ent.entityType || '').toString().toLowerCase().trim();
  let type = rawType;
  if (
    [
      'text',
      'texto',
      'mtext',
      'dtext',
      'textbox',
      'text_box',
      'caja_texto',
      'cuadro_texto',
      'annotation',
      'anotacion',
      'label',
      'etiqueta_texto',
      'note',
      'nota',
    ].includes(rawType)
  )
    type = 'text';
  else if (['measure', 'cota', 'dimension', 'acotacion'].includes(rawType)) type = 'measure';
  else if (['line', 'linea', 'segment', 'segmento'].includes(rawType)) type = 'line';
  else if (['circle', 'circulo', 'circunferencia'].includes(rawType)) type = 'circle';
  else if (['arc', 'arco'].includes(rawType)) type = 'arc';
  else if (['polygon', 'poligono'].includes(rawType)) type = 'polygon';
  else if (['curve', 'spline', 'path', 'curva'].includes(rawType)) type = 'curve';
  else if (['fill', 'hatch', 'trama', 'relleno'].includes(rawType)) type = 'fill';
  else if (['ellipse', 'elipse', 'isocircle', 'isocirculo'].includes(rawType)) type = 'ellipse';
  else if (['rect', 'rectangle', 'rectangulo', 'caja', 'box'].includes(rawType)) type = 'rect';
  else if (['point', 'punto'].includes(rawType)) type = 'point';
  else if (['symbol', 'simbolo'].includes(rawType)) type = 'symbol';
  else if (['tag', 'etiqueta'].includes(rawType)) type = 'tag';
  else if (['image', 'imagen'].includes(rawType)) type = 'image';

  switch (type) {
    case 'text': {
      const textHtml =
        typeof ent.textHtml === 'string' && ent.textHtml.length > 0
          ? ent.textHtml
          : ent.text
          ? ent.text.replace(/\n/g, '<br/>')
          : ent.content || ent.value || 'Nota técnica';
      const textPlain =
        typeof ent.text === 'string' && ent.text.length > 0
          ? ent.text
          : typeof textHtml === 'string'
          ? textHtml.replace(/<br\s*[\/]?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
          : 'Nota técnica';
      const w = typeof ent.w === 'number' && ent.w > 0 ? ent.w : (parseFloat(ent.w) || 60);
      const h = typeof ent.h === 'number' && ent.h > 0 ? ent.h : (parseFloat(ent.h) || 25);
      const fontSize =
        typeof ent.fontSize === 'number' && ent.fontSize > 0 ? ent.fontSize : (parseFloat(ent.fontSize) || 5);

      return {
        type: 'text',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        w,
        h,
        textHtml,
        text: textPlain,
        fontSize,
        align: ent.align || 'left',
        layer,
        style,
      } as TextEntity;
    }

    case 'tag':
      return {
        type: 'tag',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        text: ent.text || ent.label || ent.value || 'A',
        fontSize: typeof ent.fontSize === 'number' && ent.fontSize > 0 ? ent.fontSize : 4,
        angle: typeof ent.angle === 'number' ? ent.angle : 0,
        layer,
        style,
      };

    case 'line':
      return {
        type: 'line',
        id,
        x1: typeof ent.x1 === 'number' ? ent.x1 : parseFloat(ent.x1) || 0,
        y1: typeof ent.y1 === 'number' ? ent.y1 : parseFloat(ent.y1) || 0,
        x2: typeof ent.x2 === 'number' ? ent.x2 : parseFloat(ent.x2) || 0,
        y2: typeof ent.y2 === 'number' ? ent.y2 : parseFloat(ent.y2) || 0,
        layer,
        style,
      };

    case 'measure':
      return {
        type: 'measure',
        id,
        x1: typeof ent.x1 === 'number' ? ent.x1 : parseFloat(ent.x1) || 0,
        y1: typeof ent.y1 === 'number' ? ent.y1 : parseFloat(ent.y1) || 0,
        x2: typeof ent.x2 === 'number' ? ent.x2 : parseFloat(ent.x2) || 0,
        y2: typeof ent.y2 === 'number' ? ent.y2 : parseFloat(ent.y2) || 0,
        offsetDir: ent.offsetDir === -1 ? -1 : 1,
        offsetDistance: typeof ent.offsetDistance === 'number' ? ent.offsetDistance : 6,
        customText: ent.customText || undefined,
        layer,
        style,
      };

    case 'circle':
      return {
        type: 'circle',
        id,
        cx: typeof ent.cx === 'number' ? ent.cx : parseFloat(ent.cx) || 0,
        cy: typeof ent.cy === 'number' ? ent.cy : parseFloat(ent.cy) || 0,
        r: typeof ent.r === 'number' && ent.r > 0 ? ent.r : parseFloat(ent.r) || 10,
        hasCenterMarks: !!ent.hasCenterMarks,
        layer,
        style,
      };

    case 'arc':
      return {
        type: 'arc',
        id,
        cx: typeof ent.cx === 'number' ? ent.cx : parseFloat(ent.cx) || 0,
        cy: typeof ent.cy === 'number' ? ent.cy : parseFloat(ent.cy) || 0,
        r: typeof ent.r === 'number' && ent.r > 0 ? ent.r : parseFloat(ent.r) || 10,
        startAngle: typeof ent.startAngle === 'number' ? ent.startAngle : parseFloat(ent.startAngle) || 0,
        sweepAngle: typeof ent.sweepAngle === 'number' ? ent.sweepAngle : parseFloat(ent.sweepAngle) || Math.PI,
        layer,
        style,
      };

    case 'polygon': {
      const polygonPoints =
        Array.isArray(ent.points) && ent.points.length >= 3
          ? ent.points.map((p: any) => ({
              x: typeof p.x === 'number' ? p.x : parseFloat(p.x) || 0,
              y: typeof p.y === 'number' ? p.y : parseFloat(p.y) || 0,
            }))
          : undefined;
      return {
        type: 'polygon',
        id,
        cx: typeof ent.cx === 'number' ? ent.cx : parseFloat(ent.cx) || 0,
        cy: typeof ent.cy === 'number' ? ent.cy : parseFloat(ent.cy) || 0,
        r: typeof ent.r === 'number' && ent.r > 0 ? ent.r : parseFloat(ent.r) || 10,
        sides: polygonPoints ? polygonPoints.length : typeof ent.sides === 'number' && ent.sides >= 3 ? ent.sides : 5,
        angle: typeof ent.angle === 'number' ? ent.angle : parseFloat(ent.angle) || 0,
        points: polygonPoints,
        isIrregular: Boolean(ent.isIrregular || polygonPoints),
        layer,
        style,
      };
    }

    case 'curve':
      return {
        type: 'curve',
        id,
        points: Array.isArray(ent.points)
          ? ent.points.map((p: any) => ({
              x: typeof p.x === 'number' ? p.x : parseFloat(p.x) || 0,
              y: typeof p.y === 'number' ? p.y : parseFloat(p.y) || 0,
            }))
          : [],
        layer,
        style,
      };

    case 'fill':
      return {
        type: 'fill',
        id,
        points: Array.isArray(ent.points)
          ? ent.points.map((p: any) => ({
              x: typeof p.x === 'number' ? p.x : parseFloat(p.x) || 0,
              y: typeof p.y === 'number' ? p.y : parseFloat(p.y) || 0,
            }))
          : [],
        hatchAngle: typeof ent.hatchAngle === 'number' ? ent.hatchAngle : 45,
        hatchSpacing: typeof ent.hatchSpacing === 'number' ? ent.hatchSpacing : 4,
        layer,
        style,
      };

    case 'rect':
      return {
        type: 'rect',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        w: typeof ent.w === 'number' ? ent.w : parseFloat(ent.w) || 40,
        h: typeof ent.h === 'number' ? ent.h : parseFloat(ent.h) || 25,
        layer,
        style,
      };

    case 'point':
      return {
        type: 'point',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        layer,
        style,
      };

    case 'symbol':
      return {
        type: 'symbol',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        symbolType: ent.symbolType || 'perp',
        layer,
        style,
      };

    case 'ellipse':
      return {
        type: 'ellipse',
        id,
        cx: typeof ent.cx === 'number' ? ent.cx : parseFloat(ent.cx) || 0,
        cy: typeof ent.cy === 'number' ? ent.cy : parseFloat(ent.cy) || 0,
        rx: typeof ent.rx === 'number' ? ent.rx : parseFloat(ent.rx) || 20,
        ry: typeof ent.ry === 'number' ? ent.ry : parseFloat(ent.ry) || 10,
        rotation: typeof ent.rotation === 'number' ? ent.rotation : parseFloat(ent.rotation) || 0,
        isoplane: ent.isoplane || 'top',
        layer,
        style,
      };

    case 'image':
      return {
        type: 'image',
        id,
        x: typeof ent.x === 'number' ? ent.x : parseFloat(ent.x) || 0,
        y: typeof ent.y === 'number' ? ent.y : parseFloat(ent.y) || 0,
        width: typeof ent.width === 'number' ? ent.width : parseFloat(ent.width) || 50,
        height: typeof ent.height === 'number' ? ent.height : parseFloat(ent.height) || 50,
        href: ent.href || '',
        layer,
        style,
      };

    default:
      return { ...ent, id, type, style, layer };
  }
}

/**
 * Normalizes an entire CadProject, preserving all sheets, layers, and entities intact
 */
export function normalizeProject(proj: any): CadProject {
  if (!proj || typeof proj !== 'object') return createDefaultProject();
  const root = proj.project && typeof proj.project === 'object' ? proj.project : proj;

  // Multi-page format
  if (root.pages && Array.isArray(root.pages)) {
    const pages: PageDocument[] = root.pages.map((p: any, idx: number) => {
      const rawEntities = Array.isArray(p.data)
        ? p.data
        : Array.isArray(p.entities)
        ? p.entities
        : Array.isArray(p.elements)
        ? p.elements
        : [];

      return {
        id: p.id || `page-${Date.now()}-${idx + 1}`,
        title: p.title || `Lámina ${idx + 1}`,
        data: rawEntities.map(normalizeEntity),
        history: Array.isArray(p.history) ? p.history : [],
        redoHistory: Array.isArray(p.redoHistory) ? p.redoHistory : [],
        bgImage: p.bgImage || null,
        sheetSize:
          p.sheetSize ||
          (root.size
            ? {
                name: 'Personalizado',
                w: root.size.w,
                h: root.size.h,
                orientation: root.size.w > root.size.h ? 'landscape' : 'portrait',
              }
            : DEFAULT_SHEET),
      };
    });

    return {
      version: root.version || '2.0.0',
      projectName: root.projectName || 'Proyecto_CAD',
      pages: pages.length > 0 ? pages : [createDefaultPage(1, DEFAULT_SHEET)],
      currentPageIndex:
        typeof root.currentPageIndex === 'number' && root.currentPageIndex < pages.length
          ? root.currentPageIndex
          : 0,
      globalSheetSize: pages[0]?.sheetSize || DEFAULT_SHEET,
      layers: Array.isArray(root.layers) ? root.layers : undefined,
      createdAt: root.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Single page fallback
  const singleEntities = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.entities)
    ? root.entities
    : Array.isArray(root.elements)
    ? root.elements
    : Array.isArray(root)
    ? root
    : [];

  const singleSheet: SheetSize =
    root.sheetSize ||
    (root.size
      ? {
          name: 'Personalizado',
          w: root.size.w,
          h: root.size.h,
          orientation: root.size.w > root.size.h ? 'landscape' : 'portrait',
        }
      : DEFAULT_SHEET);

  return {
    version: '2.0.0',
    projectName: root.projectName || 'Lamina_Importada',
    pages: [
      {
        id: `page-1`,
        title: 'Lámina 1',
        data: singleEntities.map(normalizeEntity),
        history: [],
        redoHistory: [],
        bgImage: root.bgImage || null,
        sheetSize: singleSheet,
      },
    ],
    currentPageIndex: 0,
    globalSheetSize: singleSheet,
    layers: Array.isArray(root.layers) ? root.layers : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function parseProjectFile(fileContent: string): CadProject {
  const cleanContent = fileContent.trim().replace(/^\uFEFF/, '');
  const parsed = JSON.parse(cleanContent);
  return normalizeProject(parsed);
}
