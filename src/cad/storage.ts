/**
 * VektorCAD - Persistence & Project Storage (IndexedDB + JSON)
 */

import { CadProject, PageDocument, SheetSize } from './types.ts';

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
        if (req.result) resolve(req.result as CadProject);
        else resolve(null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load from IndexedDB, trying localStorage', err);
    try {
      const saved = localStorage.getItem('vektorcad_project_fallback');
      if (saved) return JSON.parse(saved) as CadProject;
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

export function parseProjectFile(fileContent: string): CadProject {
  const parsed = JSON.parse(fileContent);
  // Backwards compatibility with the older HTML format
  if (parsed.pages && Array.isArray(parsed.pages)) {
    // Normal format or V4 format
    const pages: PageDocument[] = parsed.pages.map((p: any, idx: number) => ({
      id: p.id || `page-${idx + 1}`,
      title: p.title || `Lámina ${idx + 1}`,
      data: Array.isArray(p.data) ? p.data : [],
      history: Array.isArray(p.history) ? p.history : [],
      redoHistory: Array.isArray(p.redoHistory) ? p.redoHistory : [],
      bgImage: p.bgImage || null,
      sheetSize: p.sheetSize || (parsed.size ? { name: 'Personalizado', w: parsed.size.w, h: parsed.size.h, orientation: (parsed.size.w > parsed.size.h ? 'landscape' : 'portrait') as 'landscape' | 'portrait' } : DEFAULT_SHEET),
    }));

    return {
      version: parsed.version || '2.0.0',
      projectName: parsed.projectName || 'Proyecto_Importado',
      pages,
      currentPageIndex: typeof parsed.currentPageIndex === 'number' ? parsed.currentPageIndex : 0,
      globalSheetSize: pages[0]?.sheetSize || DEFAULT_SHEET,
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Single page legacy format
  if (parsed.data && Array.isArray(parsed.data)) {
    const singleSheet: SheetSize = parsed.size
      ? {
          name: 'Personalizado',
          w: parsed.size.w,
          h: parsed.size.h,
          orientation: (parsed.size.w > parsed.size.h ? 'landscape' : 'portrait') as 'landscape' | 'portrait',
        }
      : DEFAULT_SHEET;

    return {
      version: '2.0.0',
      projectName: 'Lamina_Legacy',
      pages: [
        {
          id: `page-1`,
          title: 'Lámina 1',
          data: parsed.data,
          history: [],
          redoHistory: [],
          bgImage: null,
          sheetSize: singleSheet,
        },
      ],
      currentPageIndex: 0,
      globalSheetSize: singleSheet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  throw new Error('Formato de archivo de proyecto CAD no reconocido');
}
