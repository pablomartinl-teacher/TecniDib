/**
 * VektorCAD - Main Application Controller
 * Precision technical drawing CAD engine for education and engineering
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CadEntity,
  CadProject,
  PageDocument,
  Point2D,
  SheetSize,
  ToolType,
  EntityStyle,
  LineEntity,
  SnapPoint,
  TextEntity,
  ImageEntity,
  LayerConfig,
  GridMode,
  Isoplane,
  EllipseEntity,
} from './cad/types.ts';
import {
  distance,
  findSnapPoint,
  calculateIntersections,
  getHitEntity,
  getSvgArcPath,
  distPointToSegment,
  calculateMediatriz,
  calculateBisectriz,
  calculateThales,
  generateDxfString,
  snapToIsometricGrid,
  snapToCavalierGrid,
  projectToIsoplane,
  calculateIsocircle,
  createIsometricBox,
  createDiedricoTemplate,
} from './cad/geometry.ts';
import {
  createDefaultProject,
  createDefaultPage,
  saveProjectToDB,
  loadProjectFromDB,
  downloadProjectFile,
  parseProjectFile,
  SHEET_PRESETS,
} from './cad/storage.ts';
import { exportProjectToPDF, exportToSVG } from './cad/pdfExport.ts';

import { TopBar } from './components/TopBar.tsx';
import { PropertyBar } from './components/PropertyBar.tsx';
import { ToolBar } from './components/ToolBar.tsx';
import { CadCanvas } from './components/CadCanvas.tsx';
import { InstrumentOverlay } from './components/InstrumentOverlay.tsx';
import { MarginModal } from './components/MarginModal.tsx';
import { CropModal } from './components/CropModal.tsx';
import { EditModal } from './components/EditModal.tsx';
import { RichTextModal } from './components/RichTextModal.tsx';
import { ArchitectureStudyModal } from './components/ArchitectureStudyModal.tsx';
import { InspectorPanel } from './components/InspectorPanel.tsx';
import { CommandBar } from './components/CommandBar.tsx';
import { PlayerBar } from './components/PlayerBar.tsx';

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Project Document State
  const [project, setProject] = useState<CadProject>(createDefaultProject());
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Active Tool & Style State
  const [currentTool, setCurrentTool] = useState<ToolType>('line');
  const [currentStyle, setCurrentStyle] = useState<EntityStyle>({
    width: 0.5,
    color: '#000000',
    fillColor: '#ffffff',
    dash: 'none',
    marker: 'none',
  });

  // Snapping, Grid & Precision Options
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState<boolean>(false);
  const [gridPitch, setGridPitch] = useState<number>(10);
  const [gridMode, setGridMode] = useState<GridMode>('orthogonal');
  const [isoplane, setIsoplane] = useState<Isoplane>('top');
  const [orthoMode, setOrthoMode] = useState<boolean>(false);
  const [polySides, setPolySides] = useState<number>(5);
  const [symbolType, setSymbolType] = useState<'perp' | 'para' | 'coin' | 'angle' | 'center'>('perp');
  const [paperTheme, setPaperTheme] = useState<'white' | 'blueprint' | 'dark' | 'cream'>('white');
  const [zoomLevel, setZoomLevel] = useState<number>(95);

  // Mouse & HUD States
  const [coords, setCoords] = useState<Point2D>({ x: 0, y: 0 });
  const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);
  const [activeAlignX, setActiveAlignX] = useState<number | null>(null);
  const [activeAlignY, setActiveAlignY] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [showInstruments, setShowInstruments] = useState<boolean>(false);

  // Interactive Drawing Flow State
  const [step, setStep] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [p1, setP1] = useState<Point2D | null>(null);
  const [p2, setP2] = useState<Point2D | null>(null);
  const [curvePoints, setCurvePoints] = useState<Point2D[]>([]);
  const [keyboardInput, setKeyboardInput] = useState<string>('');
  const [ghostHtml, setGhostHtml] = useState<string>('');
  const [referenceLine, setReferenceLine] = useState<LineEntity | null>(null);
  const [customAngle, setCustomAngle] = useState<number>(0);

  // Selection & Clipboard
  const [selectedEntities, setSelectedEntities] = useState<CadEntity[]>([]);
  const [clipboard, setClipboard] = useState<CadEntity[]>([]);
  const [isBoxSelecting, setIsBoxSelecting] = useState<boolean>(false);
  const [boxStart, setBoxStart] = useState<Point2D | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point2D | null>(null);
  const [hasClonedInDrag, setHasClonedInDrag] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; sl: number; st: number } | null>(null);

  // Arc interaction
  const [arcStartAngle, setArcStartAngle] = useState<number>(0);
  const [arcSweepAngle, setArcSweepAngle] = useState<number>(0);
  const [arcCurrentAngle, setArcCurrentAngle] = useState<number>(0);

  // Modals
  const [isMarginsOpen, setIsMarginsOpen] = useState<boolean>(false);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingEntity, setEditingEntity] = useState<CadEntity | null>(null);
  const [isRichTextOpen, setIsRichTextOpen] = useState<boolean>(false);
  const [editingTextEntity, setEditingTextEntity] = useState<TextEntity | null>(null);
  const [isStudyOpen, setIsStudyOpen] = useState<boolean>(false);

  // Layers & Didactic Construction State
  const DEFAULT_LAYERS: LayerConfig[] = [
    { id: 'enunciado', name: '1. Enunciado / Base', color: '#3b82f6', defaultWidth: 0.5, visible: true, locked: false },
    { id: 'construccion', name: '2. Construcción (2H)', color: '#94a3b8', defaultWidth: 0.2, visible: true, locked: false },
    { id: 'solucion', name: '3. Solución (Tinta)', color: '#000000', defaultWidth: 0.7, visible: true, locked: false },
    { id: 'acotacion', name: '4. Acotación ISO', color: '#10b981', defaultWidth: 0.35, visible: true, locked: false },
  ];
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [activeLayerId, setActiveLayerId] = useState<string>('solucion');
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const [playerStep, setPlayerStep] = useState<number>(0);
  const [showCompassArcs, setShowCompassArcs] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Current page accessor
  const currentPage: PageDocument = project.pages[currentPageIndex] || project.pages[0];
  const allEntities: CadEntity[] = currentPage?.data || [];
  // When player is active, only show entities up to playerStep
  const entities: CadEntity[] = showPlayer ? allEntities.slice(0, playerStep) : allEntities;

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    loadProjectFromDB().then((stored) => {
      if (stored && stored.pages && stored.pages.length > 0) {
        setProject(stored);
        setCurrentPageIndex(stored.currentPageIndex || 0);
      }
    });
  }, []);

  // 2. Debounced Auto-save to IndexedDB
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProjectToDB({
        ...project,
        currentPageIndex,
        updatedAt: new Date().toISOString(),
      }).then(() => {
        setSaveStatus('✅ Guardado');
        const clearTimer = setTimeout(() => setSaveStatus(''), 2500);
        return () => clearTimeout(clearTimer);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [project, currentPageIndex]);

  // Commit changes to history stack & current page
  const pushState = useCallback((newEntities: CadEntity[]) => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const cur = updatedPages[currentPageIndex];
      if (!cur) return prev;

      const historyLimit = 30;
      const newHistory = [...cur.history, JSON.stringify(cur.data)];
      if (newHistory.length > historyLimit) newHistory.shift();

      updatedPages[currentPageIndex] = {
        ...cur,
        data: newEntities,
        history: newHistory,
        redoHistory: [],
      };

      return { ...prev, pages: updatedPages };
    });
  }, [currentPageIndex]);

  const undo = () => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const cur = updatedPages[currentPageIndex];
      if (!cur || cur.history.length === 0) return prev;

      const prevDataStr = cur.history[cur.history.length - 1];
      const newHistory = cur.history.slice(0, -1);
      const newRedo = [...cur.redoHistory, JSON.stringify(cur.data)];

      updatedPages[currentPageIndex] = {
        ...cur,
        data: JSON.parse(prevDataStr),
        history: newHistory,
        redoHistory: newRedo,
      };

      return { ...prev, pages: updatedPages };
    });
    cancelAction();
  };

  const redo = () => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const cur = updatedPages[currentPageIndex];
      if (!cur || cur.redoHistory.length === 0) return prev;

      const nextDataStr = cur.redoHistory[cur.redoHistory.length - 1];
      const newRedo = cur.redoHistory.slice(0, -1);
      const newHistory = [...cur.history, JSON.stringify(cur.data)];

      updatedPages[currentPageIndex] = {
        ...cur,
        data: JSON.parse(nextDataStr),
        history: newHistory,
        redoHistory: newRedo,
      };

      return { ...prev, pages: updatedPages };
    });
    cancelAction();
  };

  const cancelAction = () => {
    setIsDrawing(false);
    setStep(0);
    setP1(null);
    setP2(null);
    setCurvePoints([]);
    setGhostHtml('');
    setKeyboardInput('');
    setReferenceLine(null);
    setIsBoxSelecting(false);
    setBoxStart(null);
    setHasClonedInDrag(false);
    setActiveAlignX(null);
    setActiveAlignY(null);
  };

  // Convert client mouse/touch to SVG mm coordinates with snapping
  const getCanvasCoords = useCallback(
    (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement> | MouseEvent): Point2D => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const CTM = svgRef.current.getScreenCTM();
      if (!CTM) return { x: 0, y: 0 };

      const clientX = 'clientX' in e ? e.clientX : 0;
      const clientY = 'clientY' in e ? e.clientY : 0;

      const rawX = (clientX - CTM.e) / CTM.a;
      const rawY = (clientY - CTM.f) / CTM.d;

      // If user holds Ctrl, temporary disable snapping
      if (e.ctrlKey || !snapEnabled) {
        setActiveSnap(null);
        return { x: rawX, y: rawY };
      }

      const intersections = calculateIntersections(entities);
      const snap = findSnapPoint(
        { x: rawX, y: rawY },
        entities,
        intersections,
        4,
        gridSnapEnabled,
        gridPitch
      );

      setActiveSnap(snap);
      if (snap) {
        return { x: snap.x, y: snap.y };
      }

      if (gridSnapEnabled) {
        if (gridMode === 'isometric') {
          return snapToIsometricGrid({ x: rawX, y: rawY }, gridPitch);
        } else if (gridMode === 'cavalier') {
          return snapToCavalierGrid({ x: rawX, y: rawY }, gridPitch);
        }
      }

      return { x: rawX, y: rawY };
    },
    [entities, snapEnabled, gridSnapEnabled, gridPitch, gridMode]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input or contenteditable modal
      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'SELECT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Spacebar for canvas panning
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanning(true);
        return;
      }

      // Undo / Redo
      if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && e.code === 'KeyY') {
        e.preventDefault();
        redo();
        return;
      }

      // Copy / Paste
      if (e.ctrlKey && e.code === 'KeyC') {
        if (selectedEntities.length > 0) {
          e.preventDefault();
          setClipboard(JSON.parse(JSON.stringify(selectedEntities)));
          setSaveStatus('📋 Elementos Copiados');
          setTimeout(() => setSaveStatus(''), 2000);
        }
        return;
      }

      if (e.ctrlKey && e.code === 'KeyV') {
        if (clipboard.length > 0) {
          e.preventDefault();
          const t = Date.now();
          const offset = 8;
          const pasted: CadEntity[] = clipboard.map((orig, i) => {
            const clone = JSON.parse(JSON.stringify(orig)) as CadEntity;
            clone.id = t + i;
            if (clone.type === 'line' || clone.type === 'measure') {
              clone.x1 += offset;
              clone.y1 += offset;
              clone.x2 += offset;
              clone.y2 += offset;
            } else if (clone.type === 'circle' || clone.type === 'polygon' || clone.type === 'arc') {
              clone.cx += offset;
              clone.cy += offset;
            } else if (
              clone.type === 'point' ||
              clone.type === 'rect' ||
              clone.type === 'text' ||
              clone.type === 'tag' ||
              clone.type === 'symbol' ||
              clone.type === 'image'
            ) {
              clone.x += offset;
              clone.y += offset;
            } else if (clone.type === 'curve' || clone.type === 'fill') {
              clone.points.forEach((p) => {
                p.x += offset;
                p.y += offset;
              });
            }
            return clone;
          });

          pushState([...entities, ...pasted]);
          setSelectedEntities(pasted);
          setCurrentTool('cursor');
          setSaveStatus('📋 Elementos Pegados');
          setTimeout(() => setSaveStatus(''), 2000);
        }
        return;
      }

      // Escape key cancels action or closes modals
      if (e.key === 'Escape') {
        if (isCropOpen) setIsCropOpen(false);
        else if (isMarginsOpen) setIsMarginsOpen(false);
        else if (isEditOpen) setIsEditOpen(false);
        else if (isRichTextOpen) setIsRichTextOpen(false);
        else if (isStudyOpen) setIsStudyOpen(false);
        else cancelAction();
        return;
      }

      // Delete selected entities
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEntities.length > 0) {
        e.preventDefault();
        const selectedIds = new Set(selectedEntities.map((s) => s.id));
        const remaining = entities.filter((ent) => !selectedIds.has(ent.id));
        pushState(remaining);
        setSelectedEntities([]);
        return;
      }

      // F5 to toggle isoplane in isometric CAD mode
      if (e.key === 'F5') {
        e.preventDefault();
        setIsoplane((prev) => (prev === 'top' ? 'left' : prev === 'left' ? 'right' : 'top'));
        setSaveStatus('🔄 Isoplano cambiado');
        setTimeout(() => setSaveStatus(''), 1500);
        return;
      }

      // Direct numeric keyboard measure input (e.g. 50 + Enter)
      if (isDrawing && ['line', 'measure', 'circle', 'polygon', 'arc', 'parallel', 'perpendicular', 'line_angle', 'isocircle', 'isobox'].includes(currentTool)) {
        if (/^[0-9.]$/.test(e.key)) {
          setKeyboardInput((prev) => prev + e.key);
          return;
        }
        if (e.key === 'Backspace' && keyboardInput.length > 0) {
          setKeyboardInput((prev) => prev.slice(0, -1));
          return;
        }
        if (e.key === 'Enter' && keyboardInput !== '') {
          applyKeyboardMeasure();
          return;
        }
      }

      // Tool shortcut keys
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.code.startsWith('Key')) {
        const char = e.code.replace('Key', '').toLowerCase();
        const toolMap: Record<string, ToolType> = {
          v: 'cursor',
          l: 'line',
          m: 'measure',
          p: 'parallel',
          o: 'perpendicular',
          a: 'line_angle',
          c: 'circle',
          r: 'arc',
          s: 'curve',
          g: 'polygon',
          f: 'fill',
          w: 'symbol',
          x: 'point',
          t: 'text',
          e: 'tag',
          b: 'eraser',
          i: 'isocircle',
          j: 'isobox',
          d: 'diedrico_template',
        };
        if (toolMap[char]) {
          cancelAction();
          setCurrentTool(toolMap[char]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
        setPanStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isDrawing,
    currentTool,
    keyboardInput,
    entities,
    selectedEntities,
    clipboard,
    isCropOpen,
    isMarginsOpen,
    isEditOpen,
    isRichTextOpen,
    isStudyOpen,
    pushState,
  ]);

  // Apply keyboard dimension when user presses Enter
  const applyKeyboardMeasure = () => {
    const val = parseFloat(keyboardInput);
    if (isNaN(val) || val <= 0 || !p1) {
      setKeyboardInput('');
      return;
    }

    const t = Date.now();
    let updatedEntities = [...entities];

    if (['line', 'parallel', 'perpendicular', 'line_angle'].includes(currentTool)) {
      // Determine direction vector
      let dx = coords.x - p1.x;
      let dy = coords.y - p1.y;
      const mag = Math.hypot(dx, dy);
      if (mag === 0) {
        dx = 1;
        dy = 0;
      } else {
        dx /= mag;
        dy /= mag;
      }

      const finalX = p1.x + dx * val;
      const finalY = p1.y + dy * val;
      const newLine: LineEntity = {
        type: 'line',
        id: t,
        x1: p1.x,
        y1: p1.y,
        x2: finalX,
        y2: finalY,
        style: { ...currentStyle },
      };
      updatedEntities.push(newLine);
      pushState(updatedEntities);
      cancelAction();
    } else if (currentTool === 'measure') {
      if (step === 1) {
        let dx = coords.x - p1.x;
        let dy = coords.y - p1.y;
        const mag = Math.hypot(dx, dy);
        if (mag > 0) {
          dx /= mag;
          dy /= mag;
        } else {
          dx = 1;
          dy = 0;
        }
        setP2({ x: p1.x + dx * val, y: p1.y + dy * val });
        setStep(2);
        setKeyboardInput('');
        return;
      }
    } else if (currentTool === 'circle') {
      updatedEntities.push({
        type: 'circle',
        id: t,
        cx: p1.x,
        cy: p1.y,
        r: val,
        style: { ...currentStyle },
      });
      pushState(updatedEntities);
      cancelAction();
    } else if (currentTool === 'polygon') {
      const ang = Math.atan2(coords.y - p1.y, coords.x - p1.x);
      updatedEntities.push({
        type: 'polygon',
        id: t,
        cx: p1.x,
        cy: p1.y,
        r: val,
        sides: polySides,
        angle: ang,
        style: { ...currentStyle },
      });
      pushState(updatedEntities);
      cancelAction();
    } else if (currentTool === 'isocircle') {
      const { rx, ry, rotation } = calculateIsocircle(p1, val, isoplane);
      updatedEntities.push({
        type: 'ellipse',
        id: t,
        cx: p1.x,
        cy: p1.y,
        rx,
        ry,
        rotation,
        isoplane,
        layer: activeLayerId,
        style: { ...currentStyle },
      });
      pushState(updatedEntities);
      cancelAction();
    } else if (currentTool === 'isobox') {
      const boxLines = createIsometricBox(
        p1,
        val,
        val,
        val,
        { ...currentStyle, width: 0.5 },
        { ...currentStyle, width: 0.25, dash: '3,3', color: '#94a3b8' },
        activeLayerId
      );
      pushState([...entities, ...boxLines]);
      cancelAction();
    }

    setKeyboardInput('');
  };

  // Canvas Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // If middle click or space held, initiate pan
    if (e.button === 1 || isPanning) {
      const container = document.getElementById('canvas-container');
      if (container) {
        setPanStart({
          x: e.clientX,
          y: e.clientY,
          sl: container.scrollLeft,
          st: container.scrollTop,
        });
      }
      return;
    }

    if (e.button !== 0) return; // Only primary button

    const pos = getCanvasCoords(e);
    setCoords(pos);

    // Commit pending keyboard input if any
    if (keyboardInput !== '') {
      applyKeyboardMeasure();
      return;
    }

    // Cursor / Selection Tool
    if (currentTool === 'cursor') {
      const hit = getHitEntity(pos, entities, 6);
      if (hit) {
        setIsBoxSelecting(false);
        if (e.ctrlKey) {
          setSelectedEntities((prev) =>
            prev.some((el) => el.id === hit.id)
              ? prev.filter((el) => el.id !== hit.id)
              : [...prev, hit]
          );
        } else {
          if (!selectedEntities.some((el) => el.id === hit.id)) {
            setSelectedEntities([hit]);
          }
        }
        setP1(pos);
        setDragStartPos(pos);
        setHasClonedInDrag(false);
        setIsDrawing(true);
      } else {
        if (!e.ctrlKey) {
          setSelectedEntities([]);
        }
        setP1(pos);
        setBoxStart(pos);
        setIsBoxSelecting(true);
        setIsDrawing(true);
      }
      return;
    }

    // Eraser Tool
    if (currentTool === 'eraser') {
      const hit = getHitEntity(pos, entities, 6);
      if (hit) {
        pushState(entities.filter((el) => el.id !== hit.id));
      } else {
        setP1(pos);
        setBoxStart(pos);
        setIsDrawing(true);
      }
      return;
    }

    // Point Tool
    if (currentTool === 'point') {
      pushState([
        ...entities,
        {
          type: 'point',
          id: Date.now(),
          x: pos.x,
          y: pos.y,
          style: { ...currentStyle },
        },
      ]);
      return;
    }

    // Symbol Tool
    if (currentTool === 'symbol') {
      pushState([
        ...entities,
        {
          type: 'symbol',
          id: Date.now(),
          x: pos.x,
          y: pos.y,
          symbolType,
          style: { ...currentStyle },
        },
      ]);
      return;
    }

    // Oriented Tag Tool
    if (currentTool === 'tag') {
      const hit = getHitEntity(pos, entities, 6);
      let angle = 0;
      let ox = pos.x;
      let oy = pos.y;
      if (hit && (hit.type === 'line' || hit.type === 'measure')) {
        const dx = hit.x2 - hit.x1;
        const dy = hit.y2 - hit.y1;
        angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const mag = Math.hypot(dx, dy);
        if (mag > 0) {
          ox += (-dy / mag) * 4;
          oy += (dx / mag) * 4;
        }
      }
      const label = prompt('Introduce la etiqueta o vértice (Ej: A, P1, r):', 'A');
      if (label) {
        pushState([
          ...entities,
          {
            type: 'tag',
            id: Date.now(),
            x: ox,
            y: oy,
            text: label,
            angle,
            fontSize: 4,
            style: { ...currentStyle },
          },
        ]);
      }
      return;
    }

    // Trim Tool
    if (currentTool === 'trim') {
      const hit = getHitEntity(pos, entities, 6);
      if (hit && (hit.type === 'line' || hit.type === 'measure')) {
        const lineHit = hit as LineEntity;
        const intersections = calculateIntersections(entities);
        const cutPoints: Point2D[] = [];
        for (const ipt of intersections) {
          const { dist, t } = distPointToSegment(ipt, { x: lineHit.x1, y: lineHit.y1 }, { x: lineHit.x2, y: lineHit.y2 });
          if (dist < 0.2 && t > 0.01 && t < 0.99) {
            cutPoints.push(ipt);
          }
        }
        if (cutPoints.length > 0) {
          const dx = lineHit.x2 - lineHit.x1;
          const dy = lineHit.y2 - lineHit.y1;
          const len = Math.hypot(dx, dy);
          cutPoints.sort((a, b) => {
            const tA = ((a.x - lineHit.x1) * dx + (a.y - lineHit.y1) * dy) / (len * len);
            const tB = ((b.x - lineHit.x1) * dx + (b.y - lineHit.y1) * dy) / (len * len);
            return tA - tB;
          });
          const allPts = [{ x: lineHit.x1, y: lineHit.y1 }, ...cutPoints, { x: lineHit.x2, y: lineHit.y2 }];
          let minD = Infinity;
          let removeIdx = 0;
          for (let i = 0; i < allPts.length - 1; i++) {
            const d = distPointToSegment(pos, allPts[i], allPts[i + 1]).dist;
            if (d < minD) {
              minD = d;
              removeIdx = i;
            }
          }
          const remainingLines: LineEntity[] = [];
          const tNow = Date.now();
          for (let i = 0; i < allPts.length - 1; i++) {
            if (i !== removeIdx) {
              remainingLines.push({
                type: 'line',
                id: tNow + i,
                x1: allPts[i].x,
                y1: allPts[i].y,
                x2: allPts[i + 1].x,
                y2: allPts[i + 1].y,
                layer: lineHit.layer,
                style: lineHit.style,
              });
            }
          }
          pushState([...entities.filter((e) => e.id !== lineHit.id), ...remainingLines]);
          setSaveStatus('✂️ Segmento recortado');
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          pushState(entities.filter((e) => e.id !== lineHit.id));
        }
      }
      return;
    }

    // Tape Measure Tool
    if (currentTool === 'tape_measure') {
      if (step === 0) {
        setP1(pos);
        setStep(1);
        setIsDrawing(true);
      } else if (p1) {
        const d = distance(p1, pos);
        const dx = pos.x - p1.x;
        const dy = pos.y - p1.y;
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        setSaveStatus(`📏 Medida: ${d.toFixed(2)} mm (ΔX: ${dx.toFixed(1)}, ΔY: ${dy.toFixed(1)}, Áng: ${ang.toFixed(1)}º)`);
        setTimeout(() => setSaveStatus(''), 6000);
        cancelAction();
      }
      return;
    }

    // Mediatriz Tool
    if (currentTool === 'mediatriz') {
      if (step === 0) {
        const hit = getHitEntity(pos, entities, 6);
        if (hit && (hit.type === 'line' || hit.type === 'measure')) {
          const l = hit as LineEntity;
          const res = calculateMediatriz({ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }, showCompassArcs);
          const tNow = Date.now();
          const newEntities: CadEntity[] = [
            {
              type: 'line',
              id: tNow,
              x1: res.line.x1,
              y1: res.line.y1,
              x2: res.line.x2,
              y2: res.line.y2,
              layer: activeLayerId,
              style: { ...currentStyle, width: 0.5 },
            },
          ];
          if (showCompassArcs) {
            res.arcs.forEach((a, i) => {
              newEntities.push({
                type: 'arc',
                id: tNow + 1 + i,
                cx: a.cx,
                cy: a.cy,
                r: a.r,
                startAngle: a.startAngle,
                sweepAngle: a.sweepAngle,
                layer: 'construccion',
                style: { width: 0.2, color: '#94a3b8', dash: 'none', marker: 'none' },
              });
            });
          }
          pushState([...entities, ...newEntities]);
          setSaveStatus('📐 Mediatriz trazada con arcos');
          setTimeout(() => setSaveStatus(''), 2000);
          cancelAction();
          return;
        }
        setP1(pos);
        setStep(1);
        setIsDrawing(true);
      } else if (step === 1 && p1) {
        const res = calculateMediatriz(p1, pos, showCompassArcs);
        const tNow = Date.now();
        const newEntities: CadEntity[] = [
          {
            type: 'line',
            id: tNow,
            x1: res.line.x1,
            y1: res.line.y1,
            x2: res.line.x2,
            y2: res.line.y2,
            layer: activeLayerId,
            style: { ...currentStyle, width: 0.5 },
          },
        ];
        if (showCompassArcs) {
          res.arcs.forEach((a, i) => {
            newEntities.push({
              type: 'arc',
              id: tNow + 1 + i,
              cx: a.cx,
              cy: a.cy,
              r: a.r,
              startAngle: a.startAngle,
              sweepAngle: a.sweepAngle,
              layer: 'construccion',
              style: { width: 0.2, color: '#94a3b8', dash: 'none', marker: 'none' },
            });
          });
        }
        pushState([...entities, ...newEntities]);
        setSaveStatus('📐 Mediatriz trazada con arcos');
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
      }
      return;
    }

    // Bisectriz Tool
    if (currentTool === 'bisectriz') {
      if (step === 0) {
        setP1(pos);
        setStep(1);
        setIsDrawing(true);
      } else if (step === 1) {
        setP2(pos);
        setStep(2);
      } else if (step === 2 && p1 && p2) {
        const res = calculateBisectriz(p1, p2, pos, showCompassArcs);
        const tNow = Date.now();
        const newEntities: CadEntity[] = [
          {
            type: 'line',
            id: tNow,
            x1: res.ray.x1,
            y1: res.ray.y1,
            x2: res.ray.x2,
            y2: res.ray.y2,
            layer: activeLayerId,
            style: { ...currentStyle, width: 0.5 },
          },
        ];
        if (showCompassArcs) {
          res.arcs.forEach((a, i) => {
            newEntities.push({
              type: 'arc',
              id: tNow + 1 + i,
              cx: a.cx,
              cy: a.cy,
              r: a.r,
              startAngle: a.startAngle,
              sweepAngle: a.sweepAngle,
              layer: 'construccion',
              style: { width: 0.2, color: '#94a3b8', dash: 'none', marker: 'none' },
            });
          });
        }
        pushState([...entities, ...newEntities]);
        setSaveStatus('📐 Bisectriz trazada');
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
      }
      return;
    }

    // Tales Tool
    if (currentTool === 'tales') {
      if (step === 0) {
        setP1(pos);
        setStep(1);
        setIsDrawing(true);
      } else if (step === 1 && p1) {
        const divInput = prompt('¿En cuántas partes iguales deseas dividir el segmento? (2 a 12):', '5');
        const divCount = Math.max(2, Math.min(12, parseInt(divInput || '5') || 5));
        const res = calculateThales(p1, pos, divCount);
        const tNow = Date.now();
        const newEntities: CadEntity[] = [];
        res.pointsOnSegment.forEach((pt, i) => {
          newEntities.push({
            type: 'point',
            id: tNow + i,
            x: pt.x,
            y: pt.y,
            layer: activeLayerId,
            style: { ...currentStyle, width: 0.4 },
          });
        });
        res.parallels.forEach((par, i) => {
          newEntities.push({
            type: 'line',
            id: tNow + 20 + i,
            x1: par.x1,
            y1: par.y1,
            x2: par.x2,
            y2: par.y2,
            layer: 'construccion',
            style: { width: 0.2, color: '#94a3b8', dash: '3,3', marker: 'none' },
          });
        });
        pushState([...entities, ...newEntities]);
        setSaveStatus(`📐 Teorema de Tales: ${divCount} divisiones`);
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
      }
      return;
    }

    // Mirror Tool
    if (currentTool === 'mirror') {
      if (selectedEntities.length === 0) {
        alert('Selecciona primero los elementos que deseas reflejar en simetría.');
        cancelAction();
        return;
      }
      if (step === 0) {
        setP1(pos);
        setStep(1);
        setIsDrawing(true);
      } else if (step === 1 && p1) {
        const ax = pos.x - p1.x;
        const ay = pos.y - p1.y;
        const mag2 = ax * ax + ay * ay;
        if (mag2 > 0) {
          const reflectPt = (pt: Point2D) => {
            const vx = pt.x - p1.x;
            const vy = pt.y - p1.y;
            const dot = (vx * ax + vy * ay) / mag2;
            const projX = p1.x + dot * ax;
            const projY = p1.y + dot * ay;
            return {
              x: 2 * projX - pt.x,
              y: 2 * projY - pt.y,
            };
          };
          const tNow = Date.now();
          const reflected: CadEntity[] = selectedEntities.map((ent, i) => {
            const clone = JSON.parse(JSON.stringify(ent)) as CadEntity;
            clone.id = tNow + i;
            if (clone.type === 'line' || clone.type === 'measure') {
              const r1 = reflectPt({ x: clone.x1, y: clone.y1 });
              const r2 = reflectPt({ x: clone.x2, y: clone.y2 });
              clone.x1 = r1.x;
              clone.y1 = r1.y;
              clone.x2 = r2.x;
              clone.y2 = r2.y;
            } else if (clone.type === 'circle' || clone.type === 'polygon' || clone.type === 'arc') {
              const rc = reflectPt({ x: clone.cx, y: clone.cy });
              clone.cx = rc.x;
              clone.cy = rc.y;
            } else if (clone.type === 'ellipse') {
              const rc = reflectPt({ x: clone.cx, y: clone.cy });
              clone.cx = rc.x;
              clone.cy = rc.y;
              clone.rotation = -clone.rotation;
            } else if (clone.type === 'point' || clone.type === 'tag' || clone.type === 'symbol') {
              const rp = reflectPt({ x: clone.x, y: clone.y });
              clone.x = rp.x;
              clone.y = rp.y;
            }
            return clone;
          });
          pushState([...entities, ...reflected]);
          setSaveStatus('🪞 Simetría generada');
          setTimeout(() => setSaveStatus(''), 2000);
        }
        cancelAction();
      }
      return;
    }

    // Dihedral Projection + 3D Isometric Sheet Template Generator
    if (currentTool === 'diedrico_template') {
      const templateEntities = createDiedricoTemplate(
        currentPage.sheetSize,
        { ...currentStyle, width: 0.5 },
        { ...currentStyle, width: 0.25, color: '#64748b' }
      );
      pushState([...entities, ...templateEntities]);
      setGridMode('isometric');
      setGridSnapEnabled(true);
      setSaveStatus('📐 Lámina de Vistas Diédricas y Perspectiva Isométrica generada');
      setTimeout(() => setSaveStatus(''), 3000);
      cancelAction();
      setCurrentTool('cursor');
      return;
    }

    // Constructive drawing tools: Line, Measure, Circle, Polygon, Arc, Parallel, Perpendicular, Angle, Isocircle, Isobox
    if (['parallel', 'perpendicular', 'line_angle'].includes(currentTool) && !referenceLine) {
      const hit = getHitEntity(pos, entities, 6);
      if (hit && (hit.type === 'line' || hit.type === 'measure')) {
        setReferenceLine(hit as LineEntity);
        if (currentTool === 'line_angle') {
          const ang = prompt('Introduce el ángulo exacto en grados (Ej: 30, 45, 60):', '45');
          if (ang !== null) {
            setCustomAngle((parseFloat(ang) * Math.PI) / 180);
          } else {
            setReferenceLine(null);
          }
        }
      }
      return;
    }

    if (step === 0) {
      setP1(pos);
      setStep(1);
      setIsDrawing(true);
    } else if (step === 1) {
      let finalX = pos.x;
      let finalY = pos.y;

      // Ortho lock (Standard 90º or Isometric 30º/150º/90º based on isoplane)
      if (e.shiftKey || orthoMode) {
        if (gridMode === 'isometric' && p1) {
          const projected = projectToIsoplane(p1, { x: pos.x, y: pos.y }, isoplane);
          finalX = projected.x;
          finalY = projected.y;
        } else {
          const dx = Math.abs(pos.x - (p1?.x || 0));
          const dy = Math.abs(pos.y - (p1?.y || 0));
          if (dx > dy) finalY = p1?.y || 0;
          else finalX = p1?.x || 0;
        }
      }

      // Parallel / Perpendicular projection
      if (['parallel', 'perpendicular', 'line_angle'].includes(currentTool) && referenceLine && p1) {
        let vx = referenceLine.x2 - referenceLine.x1;
        let vy = referenceLine.y2 - referenceLine.y1;
        if (currentTool === 'perpendicular') {
          const t = vx;
          vx = -vy;
          vy = t;
        } else if (currentTool === 'line_angle') {
          const a = customAngle;
          const tx = vx * Math.cos(a) - vy * Math.sin(a);
          const ty = vx * Math.sin(a) + vy * Math.cos(a);
          vx = tx;
          vy = ty;
        }
        const mag = Math.hypot(vx, vy);
        if (mag > 0) {
          const ux = vx / mag;
          const uy = vy / mag;
          const dot = (pos.x - p1.x) * ux + (pos.y - p1.y) * uy;
          finalX = p1.x + dot * ux;
          finalY = p1.y + dot * uy;
        }
      }

      // Avoid accidental zero-length clicks
      if (p1 && Math.hypot(finalX - p1.x, finalY - p1.y) < 0.2) return;

      const t = Date.now();
      const updated = [...entities];

      if (currentTool === 'measure') {
        setP2({ x: finalX, y: finalY });
        setStep(2);
        return;
      }

      if (currentTool === 'arc' && p1) {
        setP2({ x: finalX, y: finalY });
        setStep(2);
        const sA = Math.atan2(finalY - p1.y, finalX - p1.x);
        setArcStartAngle(sA);
        setArcCurrentAngle(sA);
        setArcSweepAngle(0);
        return;
      }

      if (['line', 'parallel', 'perpendicular', 'line_angle'].includes(currentTool) && p1) {
        updated.push({
          type: 'line',
          id: t,
          x1: p1.x,
          y1: p1.y,
          x2: finalX,
          y2: finalY,
          style: { ...currentStyle },
        });
      } else if (currentTool === 'circle' && p1) {
        const r = Math.hypot(finalX - p1.x, finalY - p1.y);
        updated.push({
          type: 'circle',
          id: t,
          cx: p1.x,
          cy: p1.y,
          r,
          style: { ...currentStyle },
        });
      } else if (currentTool === 'isocircle' && p1) {
        const r = Math.hypot(finalX - p1.x, finalY - p1.y);
        const { rx, ry, rotation } = calculateIsocircle(p1, Math.max(0.5, r), isoplane);
        updated.push({
          type: 'ellipse',
          id: t,
          cx: p1.x,
          cy: p1.y,
          rx,
          ry,
          rotation,
          isoplane,
          layer: activeLayerId,
          style: { ...currentStyle },
        });
      } else if (currentTool === 'isobox' && p1) {
        const dim = Math.max(5, Math.hypot(finalX - p1.x, finalY - p1.y));
        const boxLines = createIsometricBox(
          p1,
          dim,
          dim,
          dim,
          { ...currentStyle, width: 0.5 },
          { ...currentStyle, width: 0.25, dash: '3,3', color: '#94a3b8' },
          activeLayerId
        );
        updated.push(...boxLines);
      } else if (currentTool === 'polygon' && p1) {
        const r = Math.hypot(finalX - p1.x, finalY - p1.y);
        const ang = Math.atan2(finalY - p1.y, finalX - p1.x);
        updated.push({
          type: 'polygon',
          id: t,
          cx: p1.x,
          cy: p1.y,
          r,
          sides: polySides,
          angle: ang,
          style: { ...currentStyle },
        });
      }

      pushState(updated);
      cancelAction();
    } else if (step === 2 && currentTool === 'measure' && p1 && p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const mag = Math.hypot(dx, dy);
      let nx = 0;
      let ny = 0;
      if (mag > 0) {
        nx = -dy / mag;
        ny = dx / mag;
      }
      const dot = (pos.x - p1.x) * nx + (pos.y - p1.y) * ny;
      const dir = dot >= 0 ? 1 : -1;

      pushState([
        ...entities,
        {
          type: 'measure',
          id: Date.now(),
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          offsetDir: dir,
          style: { ...currentStyle },
        },
      ]);
      cancelAction();
    } else if (step === 2 && currentTool === 'arc' && p1 && p2) {
      const r = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      pushState([
        ...entities,
        {
          type: 'arc',
          id: Date.now(),
          cx: p1.x,
          cy: p1.y,
          r,
          startAngle: arcStartAngle,
          sweepAngle: arcSweepAngle,
          style: { ...currentStyle },
        },
      ]);
      cancelAction();
    }

    // Spline curve
    if (currentTool === 'curve') {
      if (step === 0) {
        setCurvePoints([pos]);
        setStep(1);
        setIsDrawing(true);
      } else {
        const last = curvePoints[curvePoints.length - 1];
        if (last && Math.hypot(pos.x - last.x, pos.y - last.y) < 3) {
          // Double click near last point completes the curve
          pushState([
            ...entities,
            {
              type: 'curve',
              id: Date.now(),
              points: [...curvePoints],
              style: { ...currentStyle },
            },
          ]);
          cancelAction();
        } else {
          setCurvePoints((prev) => [...prev, pos]);
        }
      }
    }

    // Hatch Fill
    if (currentTool === 'fill') {
      if (step === 0) {
        setCurvePoints([pos]);
        setStep(1);
        setIsDrawing(true);
      } else {
        if (curvePoints.length > 2 && Math.hypot(pos.x - curvePoints[0].x, pos.y - curvePoints[0].y) < 5) {
          // Closed polygon loop
          pushState([
            ...entities,
            {
              type: 'fill',
              id: Date.now(),
              points: [...curvePoints],
              style: { ...currentStyle },
            },
          ]);
          cancelAction();
        } else {
          setCurvePoints((prev) => [...prev, pos]);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    // Handle canvas panning
    if (isPanning && panStart) {
      const container = document.getElementById('canvas-container');
      if (container) {
        container.scrollLeft = panStart.sl - (e.clientX - panStart.x);
        container.scrollTop = panStart.st - (e.clientY - panStart.y);
      }
      return;
    }

    const pos = getCanvasCoords(e);
    setCoords(pos);

    if (!isDrawing) return;

    // Box selection marquee
    if (currentTool === 'cursor' && isBoxSelecting && boxStart) {
      const minX = Math.min(boxStart.x, pos.x);
      const maxX = Math.max(boxStart.x, pos.x);
      const minY = Math.min(boxStart.y, pos.y);
      const maxY = Math.max(boxStart.y, pos.y);
      setGhostHtml(
        `<rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="rgba(2, 132, 199, 0.15)" stroke="#0284c7" stroke-dasharray="3,3" stroke-width="0.3"/>`
      );
      return;
    }

    // Moving selected elements (with Alt duplicate support)
    if (currentTool === 'cursor' && !isBoxSelecting && p1 && selectedEntities.length > 0) {
      if (e.altKey && !hasClonedInDrag) {
        const t = Date.now();
        const clones = selectedEntities.map((ent, idx) => ({
          ...JSON.parse(JSON.stringify(ent)),
          id: t + idx,
        }));
        pushState([...entities, ...clones]);
        setSelectedEntities(clones);
        setHasClonedInDrag(true);
      }

      let curX = pos.x;
      let curY = pos.y;
      if (e.shiftKey || orthoMode) {
        if (Math.abs(curX - (dragStartPos?.x || 0)) > Math.abs(curY - (dragStartPos?.y || 0))) {
          curY = dragStartPos?.y || 0;
        } else {
          curX = dragStartPos?.x || 0;
        }
      }

      const dx = curX - p1.x;
      const dy = curY - p1.y;
      setP1({ x: curX, y: curY });

      // Mutate current in-memory positions
      selectedEntities.forEach((ent) => {
        if (ent.type === 'line' || ent.type === 'measure') {
          ent.x1 += dx;
          ent.y1 += dy;
          ent.x2 += dx;
          ent.y2 += dy;
        } else if (ent.type === 'circle' || ent.type === 'polygon' || ent.type === 'arc') {
          ent.cx += dx;
          ent.cy += dy;
        } else if (
          ent.type === 'point' ||
          ent.type === 'rect' ||
          ent.type === 'text' ||
          ent.type === 'tag' ||
          ent.type === 'symbol' ||
          ent.type === 'image'
        ) {
          ent.x += dx;
          ent.y += dy;
        } else if (ent.type === 'curve' || ent.type === 'fill') {
          ent.points.forEach((p) => {
            p.x += dx;
            p.y += dy;
          });
        }
      });
      return;
    }

    // Eraser box drag preview
    if (currentTool === 'eraser' && boxStart) {
      const minX = Math.min(boxStart.x, pos.x);
      const maxX = Math.max(boxStart.x, pos.x);
      const minY = Math.min(boxStart.y, pos.y);
      const maxY = Math.max(boxStart.y, pos.y);
      setGhostHtml(
        `<rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" stroke-dasharray="3,3" stroke-width="0.3"/>`
      );
      return;
    }

    // Text box drag preview
    if (currentTool === 'text' && p1) {
      const x = Math.min(p1.x, pos.x);
      const y = Math.min(p1.y, pos.y);
      const w = Math.max(20, Math.abs(pos.x - p1.x));
      const h = Math.max(15, Math.abs(pos.y - p1.y));
      setGhostHtml(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(2, 132, 199, 0.1)" stroke="#0284c7" stroke-dasharray="2,2" stroke-width="0.3"/><text x="${x + 2}" y="${y + 5}" fill="#0284c7" font-size="3" font-family="sans-serif">Caja de texto...</text>`
      );
      return;
    }

    // Constructive drawing live ghost previews
    let p2x = pos.x;
    let p2y = pos.y;
    if (e.shiftKey || orthoMode) {
      if (gridMode === 'isometric' && p1) {
        const projected = projectToIsoplane(p1, { x: pos.x, y: pos.y }, isoplane);
        p2x = projected.x;
        p2y = projected.y;
      } else {
        const dx = Math.abs(pos.x - (p1?.x || 0));
        const dy = Math.abs(pos.y - (p1?.y || 0));
        if (dx > dy) p2y = p1?.y || 0;
        else p2x = p1?.x || 0;
      }
    }

    if (['parallel', 'perpendicular', 'line_angle'].includes(currentTool) && referenceLine && p1) {
      let vx = referenceLine.x2 - referenceLine.x1;
      let vy = referenceLine.y2 - referenceLine.y1;
      if (currentTool === 'perpendicular') {
        const t = vx;
        vx = -vy;
        vy = t;
      } else if (currentTool === 'line_angle') {
        const a = customAngle;
        const tx = vx * Math.cos(a) - vy * Math.sin(a);
        const ty = vx * Math.sin(a) + vy * Math.cos(a);
        vx = tx;
        vy = ty;
      }
      const mag = Math.hypot(vx, vy);
      if (mag > 0) {
        const ux = vx / mag;
        const uy = vy / mag;
        const dot = (pos.x - p1.x) * ux + (pos.y - p1.y) * uy;
        p2x = p1.x + dot * ux;
        p2y = p1.y + dot * uy;
      }
    }

    const distStr =
      keyboardInput !== ''
        ? `${keyboardInput}_ mm`
        : p1
        ? `${Math.hypot(p2x - p1.x, p2y - p1.y).toFixed(1)} mm`
        : '';

    let content = '';
    const sw = currentStyle.width;
    const col = currentStyle.color;
    const dash = currentStyle.dash !== 'none' ? `stroke-dasharray="${currentStyle.dash}"` : '';

    if (['line', 'parallel', 'perpendicular', 'line_angle'].includes(currentTool) && p1) {
      content = `
        <line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="${col}" stroke-width="${sw}" opacity="0.65" ${dash}/>
        <text x="${(p1.x + p2x) / 2}" y="${(p1.y + p2y) / 2 - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold" text-anchor="middle">${distStr}</text>
      `;
    } else if (currentTool === 'measure') {
      if (step === 1 && p1) {
        content = `
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="${col}" stroke-width="0.3" stroke-dasharray="2,2" opacity="0.6"/>
          <text x="${(p1.x + p2x) / 2}" y="${(p1.y + p2y) / 2 - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold" text-anchor="middle">${distStr}</text>
        `;
      }
    } else if (currentTool === 'circle' && p1) {
      const r = keyboardInput !== '' ? parseFloat(keyboardInput) || 0 : Math.hypot(p2x - p1.x, p2y - p1.y);
      content = `
        <circle cx="${p1.x}" cy="${p1.y}" r="${r}" stroke="${col}" stroke-width="${sw}" fill="none" opacity="0.65" ${dash}/>
        <line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="#0284c7" stroke-width="0.25" stroke-dasharray="1,2"/>
        <text x="${p1.x + r / 2}" y="${p1.y - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">R: ${distStr}</text>
      `;
    } else if (currentTool === 'polygon' && p1) {
      const r = keyboardInput !== '' ? parseFloat(keyboardInput) || 0 : Math.hypot(p2x - p1.x, p2y - p1.y);
      const ang = Math.atan2(p2y - p1.y, p2x - p1.x);
      const vertices = [];
      const stepAng = (2 * Math.PI) / polySides;
      for (let i = 0; i < polySides; i++) {
        const a = ang + i * stepAng;
        vertices.push(`${p1.x + r * Math.cos(a)},${p1.y + r * Math.sin(a)}`);
      }
      content = `
        <polygon points="${vertices.join(' ')}" stroke="${col}" stroke-width="${sw}" fill="none" opacity="0.65" ${dash}/>
        <text x="${p1.x + r / 2}" y="${p1.y - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">R: ${distStr}</text>
      `;
    } else if (currentTool === 'isocircle' && p1) {
      const r = keyboardInput !== '' ? parseFloat(keyboardInput) || 0 : Math.hypot(p2x - p1.x, p2y - p1.y);
      const { rx, ry, rotation } = calculateIsocircle(p1, Math.max(0.5, r), isoplane);
      content = `
        <ellipse cx="${p1.x}" cy="${p1.y}" rx="${rx}" ry="${ry}" transform="rotate(${rotation} ${p1.x} ${p1.y})" stroke="${col}" stroke-width="${sw}" fill="none" opacity="0.65" ${dash}/>
        <line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="#0284c7" stroke-width="0.25" stroke-dasharray="1,2"/>
        <text x="${p1.x + rx / 2}" y="${p1.y - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">R: ${distStr} [${isoplane.toUpperCase()}]</text>
      `;
    } else if (currentTool === 'isobox' && p1) {
      const dim = keyboardInput !== '' ? parseFloat(keyboardInput) || 0 : Math.max(5, Math.hypot(p2x - p1.x, p2y - p1.y));
      const boxLines = createIsometricBox(p1, dim, dim, dim, currentStyle, { ...currentStyle, width: 0.25, dash: '3,3', color: '#94a3b8' });
      const svgLines = boxLines.map(l => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${l.style.color}" stroke-width="${l.style.width}" ${l.style.dash !== 'none' ? `stroke-dasharray="${l.style.dash}"` : ''} opacity="0.65"/>`).join('');
      content = `
        ${svgLines}
        <text x="${p1.x}" y="${p1.y - 3}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">${dim.toFixed(1)} mm</text>
      `;
    } else if (currentTool === 'arc' && p1) {
      if (step === 1) {
        const r = Math.hypot(p2x - p1.x, p2y - p1.y);
        content = `
          <circle cx="${p1.x}" cy="${p1.y}" r="${r}" stroke="#94a3b8" stroke-width="0.25" stroke-dasharray="2,2" fill="none"/>
          <line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="#0284c7" stroke-width="0.3"/>
          <text x="${p1.x + r / 2}" y="${p1.y - 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">Radio: ${distStr}</text>
        `;
      } else if (step === 2 && p2) {
        const r = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const currAngle = Math.atan2(pos.y - p1.y, pos.x - p1.x);
        let diff = currAngle - arcCurrentAngle;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        const newSweep = Math.max(-1.99 * Math.PI, Math.min(1.99 * Math.PI, arcSweepAngle + diff));
        setArcSweepAngle(newSweep);
        setArcCurrentAngle(currAngle);

        const arcPath = getSvgArcPath(p1.x, p1.y, r, arcStartAngle, newSweep);
        const deg = Math.abs((newSweep * 180) / Math.PI).toFixed(1);
        content = `
          <circle cx="${p1.x}" cy="${p1.y}" r="${r}" stroke="#94a3b8" stroke-width="0.2" stroke-dasharray="2,2" fill="none"/>
          <path d="${arcPath}" stroke="${col}" stroke-width="${sw}" fill="none"/>
          <line x1="${p1.x}" y1="${p1.y}" x2="${pos.x}" y2="${pos.y}" stroke="#0284c7" stroke-width="0.25" stroke-dasharray="1,2"/>
          <text x="${pos.x}" y="${pos.y - 3}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold">${deg}º</text>
        `;
      }
    } else if (currentTool === 'curve' && curvePoints.length > 0) {
      const pts = curvePoints.map((p) => `${p.x},${p.y}`).join(' ');
      content = `<polyline points="${pts} ${pos.x},${pos.y}" fill="none" stroke="${col}" stroke-width="0.35" stroke-dasharray="2,2"/>`;
    } else if (currentTool === 'fill' && curvePoints.length > 0) {
      const pts = curvePoints.map((p) => `${p.x},${p.y}`).join(' ');
      content = `<polygon points="${pts} ${pos.x},${pos.y}" fill="rgba(2, 132, 199, 0.15)" stroke="${col}" stroke-width="0.35" stroke-dasharray="2,2"/>`;
    } else if (currentTool === 'mediatriz' && p1) {
      const res = calculateMediatriz(p1, { x: p2x, y: p2y }, showCompassArcs);
      content = `<line x1="${res.line.x1}" y1="${res.line.y1}" x2="${res.line.x2}" y2="${res.line.y2}" stroke="#0284c7" stroke-width="0.4" stroke-dasharray="3,3"/><line x1="${p1.x}" y1="${p1.y}" x2="${p2x}" y2="${p2y}" stroke="#94a3b8" stroke-width="0.25" stroke-dasharray="2,2"/>`;
    } else if (currentTool === 'bisectriz') {
      if (step === 1 && p1) {
        content = `<line x1="${p1.x}" y1="${p1.y}" x2="${pos.x}" y2="${pos.y}" stroke="#0284c7" stroke-width="0.35" stroke-dasharray="2,2"/>`;
      } else if (step === 2 && p1 && p2) {
        const res = calculateBisectriz(p1, p2, pos, showCompassArcs);
        content = `<line x1="${res.ray.x1}" y1="${res.ray.y1}" x2="${res.ray.x2}" y2="${res.ray.y2}" stroke="#0284c7" stroke-width="0.5" stroke-dasharray="4,2"/>`;
      }
    } else if (currentTool === 'tape_measure' && p1) {
      const d = distance(p1, pos);
      content = `<line x1="${p1.x}" y1="${p1.y}" x2="${pos.x}" y2="${pos.y}" stroke="#06b6d4" stroke-width="0.4" stroke-dasharray="2,2"/><text x="${(p1.x + pos.x) / 2}" y="${(p1.y + pos.y) / 2 - 2}" fill="#06b6d4" font-size="3.5" font-family="monospace" font-weight="bold">${d.toFixed(1)} mm</text>`;
    }

    setGhostHtml(content);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanStart(null);
      return;
    }

    if (!isDrawing) return;

    if (currentTool === 'cursor') {
      if (isBoxSelecting && boxStart) {
        const pos = getCanvasCoords(e);
        const minX = Math.min(boxStart.x, pos.x);
        const maxX = Math.max(boxStart.x, pos.x);
        const minY = Math.min(boxStart.y, pos.y);
        const maxY = Math.max(boxStart.y, pos.y);

        const newlySelected = entities.filter((ent) => {
          let ex = 0;
          let ey = 0;
          if (ent.type === 'line' || ent.type === 'measure') {
            ex = (ent.x1 + ent.x2) / 2;
            ey = (ent.y1 + ent.y2) / 2;
          } else if (ent.type === 'circle' || ent.type === 'polygon' || ent.type === 'arc') {
            ex = ent.cx;
            ey = ent.cy;
          } else if (
            ent.type === 'point' ||
            ent.type === 'rect' ||
            ent.type === 'text' ||
            ent.type === 'tag' ||
            ent.type === 'symbol' ||
            ent.type === 'image'
          ) {
            ex = ent.x;
            ey = ent.y;
          } else if (ent.type === 'curve' || ent.type === 'fill') {
            ex = ent.points[0]?.x || 0;
            ey = ent.points[0]?.y || 0;
          }
          return ex >= minX && ex <= maxX && ey >= minY && ey <= maxY;
        });

        setSelectedEntities(newlySelected);
        setIsBoxSelecting(false);
        setGhostHtml('');
        setIsDrawing(false);
      } else {
        // Drag move completed, save history state
        pushState([...entities]);
        setIsDrawing(false);
        setHasClonedInDrag(false);
      }
      return;
    }

    if (currentTool === 'eraser' && boxStart) {
      const pos = getCanvasCoords(e);
      const minX = Math.min(boxStart.x, pos.x);
      const maxX = Math.max(boxStart.x, pos.x);
      const minY = Math.min(boxStart.y, pos.y);
      const maxY = Math.max(boxStart.y, pos.y);

      const remaining = entities.filter((ent) => {
        let ex = 0;
        let ey = 0;
        if (ent.type === 'line' || ent.type === 'measure') {
          ex = (ent.x1 + ent.x2) / 2;
          ey = (ent.y1 + ent.y2) / 2;
        } else if (ent.type === 'circle' || ent.type === 'polygon' || ent.type === 'arc') {
          ex = ent.cx;
          ey = ent.cy;
        } else if (
          ent.type === 'point' ||
          ent.type === 'rect' ||
          ent.type === 'text' ||
          ent.type === 'tag' ||
          ent.type === 'symbol' ||
          ent.type === 'image'
        ) {
          ex = ent.x;
          ey = ent.y;
        } else if (ent.type === 'curve' || ent.type === 'fill') {
          ex = ent.points[0]?.x || 0;
          ey = ent.points[0]?.y || 0;
        }
        return !(ex >= minX && ex <= maxX && ey >= minY && ey <= maxY);
      });

      pushState(remaining);
      cancelAction();
      return;
    }

    if (currentTool === 'text' && p1) {
      const pos = getCanvasCoords(e);
      const x = Math.min(p1.x, pos.x);
      const y = Math.min(p1.y, pos.y);
      const w = Math.max(40, Math.abs(pos.x - p1.x));
      const newText: TextEntity = {
        type: 'text',
        id: Date.now(),
        x,
        y,
        w,
        h: 25,
        textHtml: 'Escribe tu <b>nota técnica</b> o enunciado aquí...',
        fontSize: 5,
        style: { ...currentStyle },
      };
      pushState([...entities, newText]);
      cancelAction();
      setEditingTextEntity(newText);
      setIsRichTextOpen(true);
      setCurrentTool('cursor');
    }
  };

  const handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (isDrawing) {
      cancelAction();
    } else {
      const pos = getCanvasCoords(e);
      const hit = getHitEntity(pos, entities, 6);
      if (hit) {
        if (hit.type === 'text') {
          setEditingTextEntity(hit as TextEntity);
          setIsRichTextOpen(true);
        } else {
          setEditingEntity(hit);
          setIsEditOpen(true);
        }
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getCanvasCoords(e);
    const hit = getHitEntity(pos, entities, 6);
    if (hit && hit.type === 'text') {
      setEditingTextEntity(hit as TextEntity);
      setIsRichTextOpen(true);
    }
  };

  // PDF background file loader
  const handleImportPDFBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' && (window as any).pdfjsLib) {
      const reader = new FileReader();
      reader.onload = function () {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        (window as any).pdfjsLib.getDocument(typedarray).promise.then((pdf: any) => {
          pdf.getPage(1).then((page: any) => {
            const viewport = page.getViewport({ scale: 2.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            page
              .render({ canvasContext: canvas.getContext('2d'), viewport })
              .promise.then(() => {
                const dataUrl = canvas.toDataURL('image/png');
                setProject((prev) => {
                  const updatedPages = [...prev.pages];
                  updatedPages[currentPageIndex] = {
                    ...updatedPages[currentPageIndex],
                    bgImage: dataUrl,
                  };
                  return { ...prev, pages: updatedPages };
                });
              });
          });
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setProject((prev) => {
          const updatedPages = [...prev.pages];
          updatedPages[currentPageIndex] = {
            ...updatedPages[currentPageIndex],
            bgImage: dataUrl,
          };
          return { ...prev, pages: updatedPages };
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Open cropper with uploaded image/PDF
  const handleOpenCropperFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.type === 'application/pdf' && (window as any).pdfjsLib) {
        const reader = new FileReader();
        reader.onload = function () {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          (window as any).pdfjsLib.getDocument(typedarray).promise.then((pdf: any) => {
            pdf.getPage(1).then((page: any) => {
              const viewport = page.getViewport({ scale: 3 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              page
                .render({ canvasContext: canvas.getContext('2d'), viewport })
                .promise.then(() => {
                  setCropImageSrc(canvas.toDataURL('image/png'));
                  setIsCropOpen(true);
                });
            });
          });
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          setCropImageSrc(evt.target?.result as string);
          setIsCropOpen(true);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Multi-page navigation
  const handleAddPage = () => {
    const newPage = createDefaultPage(project.pages.length + 1, currentPage.sheetSize);
    setProject((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
    }));
    setCurrentPageIndex(project.pages.length);
    cancelAction();
  };

  const handleDeletePage = () => {
    if (project.pages.length <= 1) {
      if (confirm('¿Vaciar la lámina actual?')) {
        pushState([]);
      }
      return;
    }
    if (confirm(`¿Eliminar definitivamente la ${currentPage.title}?`)) {
      setProject((prev) => {
        const newPages = prev.pages.filter((_, idx) => idx !== currentPageIndex);
        return { ...prev, pages: newPages };
      });
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
      cancelAction();
    }
  };

  const handleMovePage = () => {
    if (project.pages.length <= 1) return;
    const input = prompt(
      `Mover lámina actual (Pág ${currentPageIndex + 1}) a la posición (1 a ${project.pages.length}):`,
      (currentPageIndex + 1).toString()
    );
    if (!input) return;
    const pos = parseInt(input) - 1;
    if (pos >= 0 && pos < project.pages.length && pos !== currentPageIndex) {
      setProject((prev) => {
        const pages = [...prev.pages];
        const pageToMove = pages.splice(currentPageIndex, 1)[0];
        pages.splice(pos, 0, pageToMove);
        return { ...prev, pages };
      });
      setCurrentPageIndex(pos);
    }
  };

  // Cursor style calculation
  const getCursor = () => {
    if (isPanning) return 'grab';
    if (currentTool === 'cursor') return 'default';
    if (currentTool === 'eraser') return 'not-allowed';
    return 'crosshair';
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-neutral-200 font-sans">
      {/* 1. Header Navigation Bar */}
      <TopBar
        sheetSize={currentPage.sheetSize}
        onChangeSheetSize={(newSize) => {
          setProject((prev) => {
            const updatedPages = [...prev.pages];
            updatedPages[currentPageIndex] = {
              ...updatedPages[currentPageIndex],
              sheetSize: newSize,
            };
            return { ...prev, pages: updatedPages };
          });
        }}
        currentPage={currentPageIndex}
        totalPages={project.pages.length}
        onPrevPage={() => {
          if (currentPageIndex > 0) {
            cancelAction();
            setCurrentPageIndex(currentPageIndex - 1);
          }
        }}
        onNextPage={() => {
          if (currentPageIndex < project.pages.length - 1) {
            cancelAction();
            setCurrentPageIndex(currentPageIndex + 1);
          }
        }}
        onAddPage={handleAddPage}
        onMovePage={handleMovePage}
        onDeletePage={handleDeletePage}
        zoomLevel={zoomLevel}
        onZoomChange={(delta) => setZoomLevel((z) => Math.max(20, Math.min(600, z + delta)))}
        onResetZoom={() => setZoomLevel(95)}
        coords={coords}
        onUndo={undo}
        onRedo={redo}
        canUndo={currentPage.history.length > 0}
        canRedo={currentPage.redoHistory.length > 0}
        onOpenMarginsModal={() => setIsMarginsOpen(true)}
        onOpenCropModal={handleOpenCropperFile}
        onImportPDFBase={handleImportPDFBase}
        onSaveToFile={() => downloadProjectFile(project, project.projectName)}
        onLoadFromFile={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const loaded = parseProjectFile(evt.target?.result as string);
              setProject(loaded);
              setCurrentPageIndex(0);
              cancelAction();
            } catch (err) {
              alert('Error al leer el archivo de proyecto JSON.');
            }
          };
          reader.readAsText(file);
          e.target.value = '';
        }}
        onExportPDF={() => {
          exportProjectToPDF(project.pages, currentPageIndex, svgRef.current, {
            fileName: project.projectName,
            allPages: project.pages.length > 1 && confirm('¿Deseas exportar todas las láminas en un único PDF? (Aceptar: Todas las páginas, Cancelar: Solo la actual)'),
          });
        }}
        onExportSVG={() => exportToSVG(svgRef.current, project.projectName)}
        onExportDXF={() => {
          const dxf = generateDxfString(currentPage.sheetSize, allEntities);
          const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.projectName}.dxf`;
          a.click();
          URL.revokeObjectURL(url);
          setSaveStatus('📐 Archivo DXF descargado');
          setTimeout(() => setSaveStatus(''), 2500);
        }}
        onNewCanvas={() => {
          if (confirm('¿Crear nuevo proyecto en blanco?')) {
            const fresh = createDefaultProject();
            setProject(fresh);
            setCurrentPageIndex(0);
            cancelAction();
          }
        }}
        showInstruments={showInstruments}
        onToggleInstruments={() => setShowInstruments((prev) => !prev)}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector((prev) => !prev)}
        showPlayer={showPlayer}
        onTogglePlayer={() => {
          setShowPlayer((prev) => {
            if (!prev) setPlayerStep(allEntities.length);
            return !prev;
          });
        }}
        onOpenStudyModal={() => setIsStudyOpen(true)}
        saveStatus={saveStatus}
      />

      {/* 2. Precision & Line Property Bar */}
      <PropertyBar
        currentTool={currentTool}
        style={currentStyle}
        onChangeStyle={(newStyle) => setCurrentStyle((prev) => ({ ...prev, ...newStyle }))}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled((prev) => !prev)}
        gridSnapEnabled={gridSnapEnabled}
        onToggleGridSnap={() => setGridSnapEnabled((prev) => !prev)}
        gridPitch={gridPitch}
        onChangeGridPitch={setGridPitch}
        gridMode={gridMode}
        onChangeGridMode={setGridMode}
        isoplane={isoplane}
        onChangeIsoplane={setIsoplane}
        orthoMode={orthoMode}
        onToggleOrtho={() => setOrthoMode((prev) => !prev)}
        polySides={polySides}
        onChangePolySides={setPolySides}
        symbolType={symbolType}
        onChangeSymbolType={setSymbolType}
        paperTheme={paperTheme}
        onChangePaperTheme={setPaperTheme}
      />

      {/* 3. Main Workspace: ToolBar + Canvas + Overlays + Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        <ToolBar activeTool={currentTool} onSelectTool={(tool) => {
          cancelAction();
          setCurrentTool(tool);
        }} />

        <div className="flex-1 relative flex overflow-hidden">
          <CadCanvas
            svgRef={svgRef}
            sheetSize={currentPage.sheetSize}
            zoomLevel={zoomLevel}
            paperTheme={paperTheme}
            gridSnapEnabled={gridSnapEnabled}
            gridPitch={gridPitch}
            gridMode={gridMode}
            isoplane={isoplane}
            entities={entities}
            selectedEntities={selectedEntities}
            referenceLine={referenceLine}
            activeSnap={activeSnap}
            activeAlignX={activeAlignX}
            activeAlignY={activeAlignY}
            ghostHtml={ghostHtml}
            bgImage={currentPage.bgImage}
            hiddenLayers={new Set(layers.filter((l) => !l.visible).map((l) => l.id))}
            cursorPos={coords}
            showRulers={true}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            isPanning={isPanning}
            cursorStyle={getCursor()}
          />

          <InstrumentOverlay
            sheetWidth={currentPage.sheetSize.w}
            sheetHeight={currentPage.sheetSize.h}
            zoomLevel={zoomLevel}
            visible={showInstruments}
            onToggleVisible={() => setShowInstruments(false)}
          />

          {/* Construction Step-by-Step Player Overlay */}
          <PlayerBar
            isOpen={showPlayer}
            onClose={() => setShowPlayer(false)}
            totalSteps={allEntities.length}
            currentStep={playerStep}
            onStepChange={(s) => setPlayerStep(s)}
          />
        </div>

        {/* Dockable Live Inspector & Layer Panel */}
        <InspectorPanel
          isOpen={showInspector}
          onToggleOpen={() => setShowInspector((p) => !p)}
          selectedEntities={selectedEntities}
          onUpdateEntity={(updated) => {
            pushState(allEntities.map((e) => (e.id === updated.id ? updated : e)));
          }}
          onDeleteSelected={() => {
            const ids = new Set(selectedEntities.map((s) => s.id));
            pushState(allEntities.filter((e) => !ids.has(e.id)));
            setSelectedEntities([]);
          }}
          onDuplicateSelected={() => {
            const t = Date.now();
            const clones = selectedEntities.map((e, i) => {
              const c = JSON.parse(JSON.stringify(e));
              c.id = t + i;
              if (c.type === 'line' || c.type === 'measure') {
                c.x1 += 8; c.y1 += 8; c.x2 += 8; c.y2 += 8;
              } else if (c.type === 'circle' || c.type === 'polygon' || c.type === 'arc') {
                c.cx += 8; c.cy += 8;
              } else if (c.type === 'point' || c.type === 'rect' || c.type === 'text' || c.type === 'tag') {
                c.x += 8; c.y += 8;
              }
              return c;
            });
            pushState([...allEntities, ...clones]);
            setSelectedEntities(clones);
          }}
          onMirrorSelected={() => {
            setCurrentTool('mirror');
            setStep(0);
            setSaveStatus('🪞 Simetría: Clic en dos puntos para definir el eje de reflexión');
          }}
          layers={layers}
          activeLayerId={activeLayerId}
          onSelectActiveLayer={setActiveLayerId}
          onToggleLayerVisibility={(id) => {
            setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
          }}
          onToggleLayerLock={(id) => {
            setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
          }}
          onAddLayer={(name, color) => {
            const id = `layer-${Date.now()}`;
            setLayers((prev) => [...prev, { id, name, color, defaultWidth: 0.5, visible: true, locked: false }]);
            setActiveLayerId(id);
          }}
          sheetSize={currentPage.sheetSize}
          totalEntities={allEntities.length}
          showCompassArcs={showCompassArcs}
          onToggleCompassArcs={() => setShowCompassArcs((p) => !p)}
        />
      </div>

      {/* Quick CAD Command Bar Footer */}
      <CommandBar
        coords={coords}
        promptText={
          currentTool === 'line'
            ? step === 0 ? 'Segmento: Haz clic para fijar el primer punto.' : 'Segmento: Haz clic para el extremo final (o teclea mm + Enter).'
            : currentTool === 'measure'
            ? step === 0 ? 'Cota ISO: Clic en el 1º punto.' : step === 1 ? 'Cota ISO: Clic en el 2º punto.' : 'Cota ISO: Clic en el lado de cota.'
            : currentTool === 'mediatriz'
            ? step === 0 ? 'Mediatriz: Clic en el 1º extremo (o selecciona un segmento).' : 'Mediatriz: Clic en el 2º extremo.'
            : currentTool === 'bisectriz'
            ? step === 0 ? 'Bisectriz: Clic en Punto A.' : step === 1 ? 'Bisectriz: Clic en Vértice V.' : 'Bisectriz: Clic en Punto B.'
            : currentTool === 'tales'
            ? step === 0 ? 'Tales: Clic en el inicio.' : 'Tales: Clic en el final del segmento.'
            : currentTool === 'trim'
            ? 'Recortar (Trim): Haz clic en el segmento que deseas cortar hasta su intersección.'
            : currentTool === 'tape_measure'
            ? step === 0 ? 'Medir: Clic en el 1º punto.' : 'Medir: Mueve o haz clic para ver distancia y ángulo.'
            : currentTool === 'circle'
            ? step === 0 ? 'Circunferencia: Clic para el centro.' : 'Circunferencia: Clic para el radio (o teclea radio + Enter).'
            : currentTool === 'arc'
            ? step === 0 ? 'Arco / Compás: Clic para el centro de pinchazo.' : step === 1 ? 'Arco: Clic para el radio inicial.' : 'Arco: Gira para definir el barrido angular.'
            : currentTool === 'isocircle'
            ? step === 0 ? `Isocírculo [${isoplane.toUpperCase()}]: Clic para el centro de la elipse isométrica.` : `Isocírculo [${isoplane.toUpperCase()}]: Mueve para radio o teclea mm + Enter (Pulsa F5 para cambiar de cara).`
            : currentTool === 'isobox'
            ? step === 0 ? 'Caja Isométrica: Clic en el vértice base origen.' : 'Caja Isométrica: Mueve para dimensionar o teclea arista mm + Enter.'
            : currentTool === 'diedrico_template'
            ? 'Lámina Vistas + 3D: Clic para estampar plantilla normalizada con Línea de Tierra (LT) y trípode axonométrico.'
            : ''
        }
        onExecuteCommand={(cmdStr) => {
          const trimmed = cmdStr.trim().toUpperCase();
          if (trimmed === 'L' || trimmed === 'LINEA' || trimmed === 'LINE') setCurrentTool('line');
          else if (trimmed === 'C' || trimmed === 'CIRCULO' || trimmed === 'CIRCLE') setCurrentTool('circle');
          else if (trimmed === 'M' || trimmed === 'COTA' || trimmed === 'ACOTAR') setCurrentTool('measure');
          else if (trimmed === 'MED' || trimmed === 'MEDIATRIZ') setCurrentTool('mediatriz');
          else if (trimmed === 'BIS' || trimmed === 'BISECTRIZ') setCurrentTool('bisectriz');
          else if (trimmed === 'TALES' || trimmed === 'DIVIDIR') setCurrentTool('tales');
          else if (trimmed === 'TRIM' || trimmed === 'RECORTAR') setCurrentTool('trim');
          else if (trimmed === 'DIST' || trimmed === 'MEDIR') setCurrentTool('tape_measure');
          else if (trimmed === 'MIRROR' || trimmed === 'SIMETRIA') setCurrentTool('mirror');
          else if (trimmed === 'V' || trimmed === 'SELECT' || trimmed === 'CURSOR') setCurrentTool('cursor');
          else if (trimmed === 'I' || trimmed === 'ISOCIRCULO' || trimmed === 'ISOCIRCLE') setCurrentTool('isocircle');
          else if (trimmed === 'J' || trimmed === 'CAJA' || trimmed === 'BOX') setCurrentTool('isobox');
          else if (trimmed === 'D' || trimmed === 'DIEDRICO' || trimmed === 'VISTAS') setCurrentTool('diedrico_template');
          else if (trimmed === 'ISO' || trimmed === 'ISOMETRICA') {
            setGridMode('isometric');
            setGridSnapEnabled(true);
            setSaveStatus('🔺 Modo Rejilla Isométrica 30º-150º activado');
            setTimeout(() => setSaveStatus(''), 2500);
          } else if (trimmed === 'ORTO' || trimmed === 'ORTOGONAL') {
            setGridMode('orthogonal');
            setSaveStatus('📐 Modo Rejilla Ortogonal activado');
            setTimeout(() => setSaveStatus(''), 2500);
          } else if (trimmed === 'F5' || trimmed === 'ISOPLANO') {
            setIsoplane((prev) => (prev === 'top' ? 'left' : prev === 'left' ? 'right' : 'top'));
            setSaveStatus('🔄 Isoplano cambiado');
            setTimeout(() => setSaveStatus(''), 1500);
          } else if (trimmed === 'DXF') {
            const dxf = generateDxfString(currentPage.sheetSize, allEntities);
            const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.projectName}.dxf`;
            a.click();
            URL.revokeObjectURL(url);
          } else if (trimmed === 'CLEAR') {
            if (confirm('¿Vaciar lámina?')) pushState([]);
          }
          cancelAction();
        }}
      />

      {/* 4. Modals */}
      <MarginModal
        isOpen={isMarginsOpen}
        onClose={() => setIsMarginsOpen(false)}
        sheetSize={currentPage.sheetSize}
        currentStyle={currentStyle}
        onApplyMargins={(marginEntities) => pushState([...entities, ...marginEntities])}
      />

      <CropModal
        isOpen={isCropOpen}
        onClose={() => {
          setIsCropOpen(false);
          setCropImageSrc(null);
        }}
        imageSrc={cropImageSrc}
        canvasWidth={currentPage.sheetSize.w}
        onInsertImage={(img) => {
          pushState([...entities, img]);
          setCurrentTool('cursor');
          setSelectedEntities([img]);
        }}
      />

      <EditModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingEntity(null);
        }}
        entity={editingEntity}
        onUpdateEntity={(updated) => {
          pushState(entities.map((e) => (e.id === updated.id ? updated : e)));
        }}
        onDeleteEntity={(id) => {
          pushState(entities.filter((e) => e.id !== id));
          setSelectedEntities((prev) => prev.filter((e) => e.id !== id));
        }}
      />

      <RichTextModal
        isOpen={isRichTextOpen}
        onClose={() => {
          setIsRichTextOpen(false);
          setEditingTextEntity(null);
        }}
        entity={editingTextEntity}
        onSave={(updatedText) => {
          pushState(entities.map((e) => (e.id === updatedText.id ? updatedText : e)));
        }}
      />

      <ArchitectureStudyModal
        isOpen={isStudyOpen}
        onClose={() => setIsStudyOpen(false)}
      />
    </div>
  );
}
