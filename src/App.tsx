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
  RectEntity,
  SnapPoint,
  TextEntity,
  ImageEntity,
  LayerConfig,
  GridMode,
  Isoplane,
  EllipseEntity,
  PolygonEntity,
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
  smoothPath,
  detectClosedCycleFromSegments,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  getEntityPolygonVertices,
  isEntityInsideBox,
  isEntityCrossingBox,
  purgeEntities,
  DiedricoConfig,
  AxonometricSystem,
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
import { PageManagerModal } from './components/PageManagerModal.tsx';
import { ContextMenu } from './components/ContextMenu.tsx';
import { ShortcutsModal } from './components/ShortcutsModal.tsx';
import { DiedricoModal } from './components/DiedricoModal.tsx';
import { detectMobileDevice } from './cad/mobileUtils.ts';
import { MobileTopBar } from './components/MobileTopBar.tsx';
import { MobileBottomBar } from './components/MobileBottomBar.tsx';
import { MobileControlBar } from './components/MobileControlBar.tsx';
import { MobileMenuDrawer } from './components/MobileMenuDrawer.tsx';

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
  const [isPageManagerOpen, setIsPageManagerOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Entity Transformation State (8-way resize + free rotation for text & image)
  interface TransformState {
    entityType: 'text' | 'image';
    entityId: number;
    handle: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origAngle: number;
    aspectRatio: number;
  }
  const [transformState, setTransformState] = useState<TransformState | null>(null);

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
  const [isHandDrawn, setIsHandDrawn] = useState<boolean>(true);
  const [isCtrlHeld, setIsCtrlHeld] = useState<boolean>(false);
  const [showBgImage, setShowBgImage] = useState<boolean>(true);
  const [isDiedricoModalOpen, setIsDiedricoModalOpen] = useState<boolean>(false);
  const [showCompassArcs, setShowCompassArcs] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Mobile Mode & Touch Screen optimization
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('vektorcad_mobile_mode_active');
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined') {
      return detectMobileDevice(
        window.innerWidth,
        'ontouchstart' in window,
        window.matchMedia?.('(pointer: coarse)').matches || false
      );
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const userOverride = localStorage.getItem('vektorcad_mobile_mode_override');
      if (userOverride === null && typeof window !== 'undefined') {
        const auto = detectMobileDevice(
          window.innerWidth,
          'ontouchstart' in window,
          window.matchMedia?.('(pointer: coarse)').matches || false
        );
        setIsMobileMode(auto);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleMobileMode = () => {
    setIsMobileMode((prev) => {
      const next = !prev;
      localStorage.setItem('vektorcad_mobile_mode_active', String(next));
      localStorage.setItem('vektorcad_mobile_mode_override', 'true');
      setSaveStatus(next ? '📱 Modo móvil activado' : '🖥️ Modo escritorio activado');
      setTimeout(() => setSaveStatus(''), 2000);
      return next;
    });
  };

  const handleToggleBgImageLock = () => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const cur = updatedPages[currentPageIndex];
      if (!cur) return prev;
      const nextLocked = !cur.bgImageLocked;
      updatedPages[currentPageIndex] = {
        ...cur,
        bgImageLocked: nextLocked,
      };
      setSaveStatus(nextLocked ? '🔒 PDF Base bloqueado' : '🔓 PDF Base desbloqueado');
      setTimeout(() => setSaveStatus(''), 2000);
      return { ...prev, pages: updatedPages };
    });
  };

  const handleToggleEntityLock = (id: number) => {
    setProject((prev) => {
      const updatedPages = [...prev.pages];
      const cur = updatedPages[currentPageIndex];
      if (!cur) return prev;
      let targetLocked = false;
      const nextData = cur.data.map((e) => {
        if (e.id === id) {
          targetLocked = !e.locked;
          return { ...e, locked: targetLocked };
        }
        return e;
      });
      updatedPages[currentPageIndex] = {
        ...cur,
        data: nextData,
      };
      setSaveStatus(targetLocked ? '🔒 Elemento bloqueado' : '🔓 Elemento desbloqueado');
      setTimeout(() => setSaveStatus(''), 2000);
      return { ...prev, pages: updatedPages };
    });
    setSelectedEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e))
    );
  };

  const handleZoomChange = useCallback((delta: number) => {
    setZoomLevel((z) => Math.max(20, Math.min(600, Math.round(z + delta))));
  }, []);

  const handleSetZoom = useCallback((newZoom: number) => {
    setZoomLevel(Math.max(20, Math.min(600, Math.round(newZoom))));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(95);
  }, []);

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
    setTransformState(null);
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
      if (e.ctrlKey || isCtrlHeld || !snapEnabled) {
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
    [entities, snapEnabled, isCtrlHeld, gridSnapEnabled, gridPitch, gridMode]
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

      // Temporarily bypass magnet / snap while holding Control key
      if (e.key === 'Control') {
        setIsCtrlHeld(true);
        setActiveSnap(null);
      }

      // Save file with Ctrl+S (choose filename)
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault();
        handleSaveToFile();
        return;
      }

      // Complete Spline curve on Enter
      if (e.key === 'Enter' && currentTool === 'curve' && curvePoints.length >= 2) {
        e.preventDefault();
        pushState([
          ...entities,
          {
            type: 'curve',
            id: Date.now(),
            points: [...curvePoints],
            style: { ...currentStyle },
          },
        ]);
        setSaveStatus('〰️ Spline creada');
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
        return;
      }

      // Complete Hatch / Rayado on Enter
      if (e.key === 'Enter' && currentTool === 'fill' && curvePoints.length >= 3) {
        e.preventDefault();
        pushState([
          ...entities,
          {
            type: 'fill',
            id: Date.now(),
            points: [...curvePoints],
            layer: activeLayerId,
            style: {
              ...currentStyle,
              fillColor:
                currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== '#ffffff'
                  ? currentStyle.fillColor
                  : 'none',
              opacity: currentStyle.opacity ?? 0.35,
            },
          },
        ]);
        setSaveStatus('🎨 Rayado a 45º generado');
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
        return;
      }

      // Escape key cancels action, clears keyboard input, or closes modals
      if (e.key === 'Escape') {
        if (contextMenuPos) {
          setContextMenuPos(null);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (keyboardInput !== '') {
          setKeyboardInput('');
          setSaveStatus('Medida cancelada');
          setTimeout(() => setSaveStatus(''), 1000);
          return;
        }
        if (isCropOpen) setIsCropOpen(false);
        else if (isMarginsOpen) setIsMarginsOpen(false);
        else if (isEditOpen) setIsEditOpen(false);
        else if (isRichTextOpen) setIsRichTextOpen(false);
        else if (isStudyOpen) setIsStudyOpen(false);
        else if (isPageManagerOpen) setIsPageManagerOpen(false);
        else cancelAction();
        return;
      }

      // Tab or F11 to toggle Focus Mode / Fullscreen Canvas
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
        return;
      }

      // ? or F1 for Shortcuts Cheat Sheet
      if (e.key === '?' || e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // F8 for Ortho mode
      if (e.key === 'F8') {
        e.preventDefault();
        setOrthoMode((prev) => !prev);
        setSaveStatus(`📐 Modo Ortogonal: ${!orthoMode ? 'ACTIVADO' : 'DESACTIVADO'}`);
        setTimeout(() => setSaveStatus(''), 1500);
        return;
      }

      // F9 for Snap magnet
      if (e.key === 'F9') {
        e.preventDefault();
        setSnapEnabled((prev) => !prev);
        setSaveStatus(`🧲 Imán Snap: ${!snapEnabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
        setTimeout(() => setSaveStatus(''), 1500);
        return;
      }

      // F7 for Grid snap
      if (e.key === 'F7') {
        e.preventDefault();
        setGridSnapEnabled((prev) => !prev);
        setSaveStatus(`▦ Rejilla Métrica: ${!gridSnapEnabled ? 'ACTIVADA' : 'DESACTIVADA'}`);
        setTimeout(() => setSaveStatus(''), 1500);
        return;
      }

      // Ctrl + D to Duplicate Selection
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selectedEntities.length > 0) {
          const t = Date.now();
          const clones = selectedEntities.map((ent, idx) => {
            const c = JSON.parse(JSON.stringify(ent));
            c.id = t + idx;
            if (c.type === 'line' || c.type === 'measure') {
              c.x1 += 8; c.y1 += 8; c.x2 += 8; c.y2 += 8;
            } else if (c.type === 'circle' || c.type === 'polygon' || c.type === 'arc') {
              c.cx += 8; c.cy += 8;
              if (c.type === 'polygon' && Array.isArray(c.points)) {
                c.points = c.points.map((pt: any) => ({ x: pt.x + 8, y: pt.y + 8 }));
              }
            } else if (c.type === 'point' || c.type === 'rect' || c.type === 'text' || c.type === 'tag') {
              c.x += 8; c.y += 8;
            }
            return c;
          });
          pushState([...entities, ...clones]);
          setSelectedEntities(clones);
          setSaveStatus(`📋 ${clones.length} elemento(s) duplicado(s)`);
          setTimeout(() => setSaveStatus(''), 1500);
        }
        return;
      }

      // Direct numeric keyboard measure input (e.g. 50, 12.5, 80,50, 50<45 + Enter)
      const isMeasurableTool = [
        'line',
        'rect',
        'circle',
        'polygon',
        'arc',
        'measure',
        'parallel',
        'perpendicular',
        'line_angle',
        'isocircle',
        'isobox',
        'tales',
        'tape_measure',
        'mediatriz',
        'bisectriz',
      ].includes(currentTool);

      if (isMeasurableTool) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (keyboardInput !== '') {
            applyKeyboardMeasure();
          }
          return;
        }
        if (e.key === 'Backspace' && keyboardInput.length > 0) {
          e.preventDefault();
          setKeyboardInput((prev) => prev.slice(0, -1));
          return;
        }
        if (/^[0-9.,<xX\-]$/.test(e.key)) {
          e.preventDefault();
          setKeyboardInput((prev) => prev + e.key);
          return;
        }
      }

      // Delete selected entities (only if not typing a dimension)
      if (keyboardInput === '' && (e.key === 'Delete' || e.key === 'Backspace') && selectedEntities.length > 0) {
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

      // Tool shortcut keys (only if not currently typing a numeric measurement)
      if (keyboardInput === '' && !e.ctrlKey && !e.altKey && !e.metaKey && e.code.startsWith('Key')) {
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
          i: 'bisectriz',
          j: 'isobox',
          y: 'isocircle',
          d: 'mediatriz',
          k: 'tales',
          n: 'trim',
          u: 'rect',
          q: 'tape_measure',
          z: 'diedrico_template',
        };
        if (toolMap[char]) {
          cancelAction();
          if (toolMap[char] === 'diedrico_template') {
            setIsDiedricoModalOpen(true);
            return;
          }
          setCurrentTool(toolMap[char]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlHeld(false);
      }
      if (e.code === 'Space') {
        setIsPanning(false);
        setPanStart(null);
      }
    };

    const handleBlur = () => {
      setIsCtrlHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
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

  // Keep drawStateRef synchronized on every render to eliminate stale closure bugs
  const drawStateRef = useRef({
    coords,
    p1,
    p2,
    step,
    currentTool,
    currentStyle,
    orthoMode,
    gridMode,
    isoplane,
    referenceLine,
    customAngle,
    polySides,
    entities,
    activeLayerId,
    keyboardInput,
    isDrawing,
    arcStartAngle,
    arcCurrentAngle,
    arcSweepAngle,
  });

  useEffect(() => {
    drawStateRef.current = {
      coords,
      p1,
      p2,
      step,
      currentTool,
      currentStyle,
      orthoMode,
      gridMode,
      isoplane,
      referenceLine,
      customAngle,
      polySides,
      entities,
      activeLayerId,
      keyboardInput,
      isDrawing,
      arcStartAngle,
      arcCurrentAngle,
      arcSweepAngle,
    };
  });

  // Apply keyboard dimension when user presses Enter or executes numeric command
  const applyKeyboardMeasure = (explicitVal?: number | string, explicitCoords?: Point2D) => {
    const state = drawStateRef.current;
    const rawInput = (
      explicitVal !== undefined ? explicitVal.toString() : keyboardInput || state.keyboardInput
    ).trim();

    if (!rawInput) {
      setKeyboardInput('');
      return;
    }

    // 1. Check for polar angle syntax: e.g. "50<45" or "100<-30" (distance < angle in degrees)
    let isPolar = false;
    let polarDist = 0;
    let polarAngle = 0;
    if (rawInput.includes('<')) {
      const parts = rawInput.split('<');
      const d = parseFloat(parts[0].replace(',', '.'));
      const a = parseFloat(parts[1].replace(',', '.'));
      if (!isNaN(d) && !isNaN(a)) {
        isPolar = true;
        polarDist = Math.abs(d);
        // Angle in standard CAD: CCW from positive X axis (degrees to radians)
        polarAngle = (a * Math.PI) / 180;
      }
    }

    // 2. Check for coordinate pair / width-height: e.g. "80,50" or "80x50" or "80 50"
    let isPair = false;
    let valW = 0;
    let valH = 0;
    if (!isPolar && (rawInput.includes('x') || rawInput.includes('X') || (rawInput.includes(',') && rawInput.indexOf(',') !== rawInput.lastIndexOf(',')) || (/[, ]/.test(rawInput) && state.currentTool === 'rect'))) {
      const parts = rawInput.split(/[,xX\s]+/).filter(Boolean);
      if (parts.length >= 2) {
        const w = parseFloat(parts[0].replace(',', '.'));
        const h = parseFloat(parts[1].replace(',', '.'));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          isPair = true;
          valW = w;
          valH = h;
        }
      }
    }

    // 3. Single numeric value (with dot or comma decimal separator)
    const singleVal = parseFloat(rawInput.replace(',', '.'));
    const val = isPolar ? polarDist : isPair ? valW : singleVal;

    if (isNaN(val) || val <= 0) {
      setKeyboardInput('');
      return;
    }

    const t = Date.now();
    const updatedEntities = [...state.entities];
    const {
      p1,
      p2,
      step,
      currentTool,
      currentStyle,
      orthoMode,
      gridMode,
      isoplane,
      referenceLine,
      customAngle,
      polySides,
      arcStartAngle,
      activeLayerId,
    } = state;

    const coords = explicitCoords || state.coords;

    if (!p1) {
      setSaveStatus(`📏 Medida prefijada: ${val} mm. Haz clic en el lienzo para fijar origen.`);
      return;
    }

    if (['line', 'parallel', 'perpendicular', 'line_angle'].includes(currentTool)) {
      let finalX = coords.x;
      let finalY = coords.y;

      if (isPolar) {
        // Polar vector: final = p1 + dist * (cos(a), -sin(a)) in SVG coordinates
        finalX = p1.x + polarDist * Math.cos(polarAngle);
        finalY = p1.y - polarDist * Math.sin(polarAngle);
      } else if (isPair) {
        finalX = p1.x + valW;
        finalY = p1.y + valH;
      } else if (['parallel', 'perpendicular', 'line_angle'].includes(currentTool) && referenceLine) {
        let vx = referenceLine.x2 - referenceLine.x1;
        let vy = referenceLine.y2 - referenceLine.y1;
        if (currentTool === 'perpendicular') {
          const tmp = vx;
          vx = -vy;
          vy = tmp;
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
          const dot = (coords.x - p1.x) * ux + (coords.y - p1.y) * uy;
          const dir = dot >= 0 ? 1 : -1;
          finalX = p1.x + dir * ux * val;
          finalY = p1.y + dir * uy * val;
        } else {
          finalX = p1.x + val;
          finalY = p1.y;
        }
      } else {
        let dx = coords.x - p1.x;
        let dy = coords.y - p1.y;

        if (orthoMode) {
          if (gridMode === 'isometric') {
            const projected = projectToIsoplane(p1, coords, isoplane);
            dx = projected.x - p1.x;
            dy = projected.y - p1.y;
          } else {
            if (Math.abs(dx) > Math.abs(dy)) {
              dy = 0;
            } else {
              dx = 0;
            }
          }
        }

        const mag = Math.hypot(dx, dy);
        let ux = 1;
        let uy = 0;
        if (mag > 0) {
          ux = dx / mag;
          uy = dy / mag;
        }
        finalX = p1.x + ux * val;
        finalY = p1.y + uy * val;
      }

      const newLine: LineEntity = {
        type: 'line',
        id: t,
        x1: p1.x,
        y1: p1.y,
        x2: finalX,
        y2: finalY,
        layer: activeLayerId,
        style: { ...currentStyle },
      };

      // Detect if completing this segment closes a shape
      const existingLines = entities.filter(
        (e): e is LineEntity => e.type === 'line' && (e.layer === undefined || e.layer === activeLayerId)
      );
      const cycle = detectClosedCycleFromSegments(newLine, existingLines, 2.5);

      if (cycle && cycle.vertices.length >= 3) {
        const closedPoly: PolygonEntity = {
          type: 'polygon',
          id: t,
          cx: cycle.centroid.x,
          cy: cycle.centroid.y,
          r: cycle.radius,
          sides: cycle.vertices.length,
          angle: 0,
          points: cycle.vertices,
          isIrregular: true,
          layer: activeLayerId,
          style: {
            ...currentStyle,
            fillColor:
              currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== 'transparent'
                ? currentStyle.fillColor
                : '#38bdf8',
            opacity: currentStyle.opacity ?? 0.35,
          },
        };
        const remaining = entities.filter((e) => !cycle.segmentIds.includes(e.id));
        pushState([...remaining, closedPoly]);
        setSelectedEntities([closedPoly]);
        setShowInspector(true);
        setSaveStatus(
          `✨ ¡Forma cerrada detectada! Polígono irregular de ${cycle.vertices.length} lados creado. Modifica su trazo y relleno aquí.`
        );
        setTimeout(() => setSaveStatus(''), 4500);
        cancelAction();
        return;
      }

      updatedEntities.push(newLine);
      pushState(updatedEntities);
      setSaveStatus(`📏 Segmento fijado: ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
      cancelAction();
    } else if (currentTool === 'rect') {
      const rw = isPair ? valW : val;
      const rh = isPair ? valH : val;
      const dirX = coords.x >= p1.x ? 1 : -1;
      const dirY = coords.y >= p1.y ? 1 : -1;
      const rx = dirX >= 0 ? p1.x : p1.x - rw;
      const ry = dirY >= 0 ? p1.y : p1.y - rh;

      const newRect: RectEntity = {
        type: 'rect',
        id: t,
        x: rx,
        y: ry,
        w: rw,
        h: rh,
        layer: activeLayerId,
        style: { ...currentStyle },
      };
      updatedEntities.push(newRect);
      pushState(updatedEntities);
      setSaveStatus(`📐 Rectángulo fijado: ${rw.toFixed(1)} × ${rh.toFixed(1)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
      cancelAction();
    } else if (currentTool === 'measure') {
      if (step === 1) {
        let dx = coords.x - p1.x;
        let dy = coords.y - p1.y;
        const mag = Math.hypot(dx, dy);
        let ux = 1;
        let uy = 0;
        if (mag > 0) {
          ux = dx / mag;
          uy = dy / mag;
        }
        setP2({ x: p1.x + ux * val, y: p1.y + uy * val });
        setStep(2);
        setSaveStatus(`📏 Distancia de cota: ${val.toFixed(2)} mm fijada. Ahora haz clic o teclea separación mm.`);
        setKeyboardInput('');
        return;
      } else if (step === 2 && p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const mag = Math.hypot(dx, dy);
        let nx = 0;
        let ny = 0;
        if (mag > 0) {
          nx = -dy / mag;
          ny = dx / mag;
        }
        const dot = (coords.x - p1.x) * nx + (coords.y - p1.y) * ny;
        const dir = dot >= 0 ? 1 : -1;
        updatedEntities.push({
          type: 'measure',
          id: t,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          offsetDir: dir,
          offsetDistance: val,
          layer: activeLayerId,
          style: { ...currentStyle },
        });
        pushState(updatedEntities);
        setSaveStatus(`📏 Cota ISO fijada: separación ${val.toFixed(1)} mm`);
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
      }
    } else if (currentTool === 'circle') {
      updatedEntities.push({
        type: 'circle',
        id: t,
        cx: p1.x,
        cy: p1.y,
        r: val,
        layer: activeLayerId,
        style: { ...currentStyle },
      });
      pushState(updatedEntities);
      setSaveStatus(`⭕ Circunferencia: Radio ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
      cancelAction();
    } else if (currentTool === 'arc') {
      if (step === 1) {
        const ang = Math.atan2(coords.y - p1.y, coords.x - p1.x);
        setP2({ x: p1.x + val * Math.cos(ang), y: p1.y + val * Math.sin(ang) });
        setStep(2);
        setArcStartAngle(ang);
        setArcCurrentAngle(ang);
        setArcSweepAngle(0);
        setSaveStatus(`🏹 Radio de arco fijado: ${val.toFixed(2)} mm. Gira para barrido o teclea grados + Enter.`);
        setKeyboardInput('');
        return;
      } else if (step === 2 && p2) {
        const r = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const sweep = (val * Math.PI) / 180;
        updatedEntities.push({
          type: 'arc',
          id: t,
          cx: p1.x,
          cy: p1.y,
          r,
          startAngle: arcStartAngle,
          sweepAngle: sweep,
          layer: activeLayerId,
          style: { ...currentStyle },
        });
        pushState(updatedEntities);
        setSaveStatus(`🏹 Arco creado: ${val.toFixed(1)}º`);
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
      }
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
        layer: activeLayerId,
        style: { ...currentStyle },
      });
      pushState(updatedEntities);
      setSaveStatus(`🔷 Polígono de ${polySides} lados: Radio ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
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
      setSaveStatus(`🔄 Isocírculo [${isoplane.toUpperCase()}]: Radio ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
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
      setSaveStatus(`📦 Caja Isométrica: Arista ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 2000);
      cancelAction();
    } else if (currentTool === 'tales') {
      const divCount = Math.max(2, Math.min(20, Math.round(val)));
      const res = calculateThales(p1, coords, divCount);
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
    } else if (currentTool === 'mediatriz') {
      const res = calculateMediatriz(p1, { x: p1.x + val, y: p1.y }, showCompassArcs);
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
      setSaveStatus(`📐 Mediatriz trazada (segmento de ${val.toFixed(1)} mm)`);
      setTimeout(() => setSaveStatus(''), 2000);
      cancelAction();
    } else if (currentTool === 'tape_measure') {
      setSaveStatus(`📏 Medida: ${val.toFixed(2)} mm`);
      setTimeout(() => setSaveStatus(''), 4000);
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

    // 1. Check if clicking on transformation handle (resize or rotate for text and image)
    const targetEl = e.target as SVGElement;
    const transformHandle = targetEl?.getAttribute
      ? targetEl.getAttribute('data-transform-handle') || targetEl.getAttribute('data-text-handle')
      : null;
    const entityIdAttr = targetEl?.getAttribute
      ? targetEl.getAttribute('data-entity-id') || targetEl.getAttribute('data-text-id')
      : null;

    if (transformHandle && entityIdAttr) {
      const eid = Number(entityIdAttr);
      const targetEnt = entities.find((ent) => ent.id === eid);
      if (targetEnt && (targetEnt.type === 'text' || targetEnt.type === 'image')) {
        if (targetEnt.locked) {
          setSaveStatus('🔒 Elemento bloqueado. Desbloquéalo con clic derecho para transformarlo.');
          setTimeout(() => setSaveStatus(''), 2500);
          return;
        }
        const isImg = targetEnt.type === 'image';
        const origW = isImg ? targetEnt.width : (targetEnt.w || 60);
        const origH = isImg ? targetEnt.height : (targetEnt.h || 25);
        const origAngle = isImg ? (targetEnt.rotation || 0) : (targetEnt.angle || 0);

        setTransformState({
          entityType: targetEnt.type,
          entityId: eid,
          handle: transformHandle,
          startX: pos.x,
          startY: pos.y,
          origX: targetEnt.x,
          origY: targetEnt.y,
          origW,
          origH,
          origAngle,
          aspectRatio: origW / Math.max(1, origH),
        });
        setIsDrawing(true);
        return;
      }
    }

    // 2. Commit pending keyboard measure input
    if (keyboardInput !== '') {
      if (p1) {
        drawStateRef.current.coords = pos;
        applyKeyboardMeasure(undefined, pos);
        return;
      } else if (['circle', 'polygon', 'isocircle', 'isobox'].includes(currentTool)) {
        drawStateRef.current.coords = pos;
        drawStateRef.current.p1 = pos;
        applyKeyboardMeasure(undefined, pos);
        return;
      }
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
    // Dihedral Projection + 3D Axonometric Sheet Template Generator
    if (currentTool === 'diedrico_template') {
      setIsDiedricoModalOpen(true);
      return;
    }

    // Spline Curve Tool (Click to add points, click near last point or double click to complete)
    if (currentTool === 'curve') {
      const last = curvePoints[curvePoints.length - 1];
      if (last && Math.hypot(pos.x - last.x, pos.y - last.y) < 2) {
        if (curvePoints.length >= 2) {
          pushState([
            ...entities,
            {
              type: 'curve',
              id: Date.now(),
              points: [...curvePoints],
              style: { ...currentStyle },
            },
          ]);
          setSaveStatus('〰️ Spline finalizada');
          setTimeout(() => setSaveStatus(''), 2000);
        }
        cancelAction();
        return;
      }
      setCurvePoints((prev) => [...prev, pos]);
      setIsDrawing(true);
      setStep(1);
      return;
    }

    // Hatch / Filled Region Tool (45º Technical Hatching)
    if (currentTool === 'fill') {
      // 1. If clicking on existing shape (rect, polygon), apply 45º hatch directly
      if (curvePoints.length === 0) {
        const hit = getHitEntity(pos, entities, 6);
        if (hit) {
          if (hit.type === 'rect') {
            const pts: Point2D[] = [
              { x: hit.x, y: hit.y },
              { x: hit.x + hit.w, y: hit.y },
              { x: hit.x + hit.w, y: hit.y + hit.h },
              { x: hit.x, y: hit.y + hit.h },
            ];
            pushState([
              ...entities,
              {
                type: 'fill',
                id: Date.now(),
                points: pts,
                layer: activeLayerId,
                hatchAngle: 45,
                hatchSpacing: 4,
                style: {
                  ...currentStyle,
                  fillColor:
                    currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== '#ffffff'
                      ? currentStyle.fillColor
                      : 'none',
                  opacity: currentStyle.opacity ?? 0.35,
                },
              },
            ]);
            setSaveStatus('🎨 Rayado a 45º aplicado al rectángulo');
            setTimeout(() => setSaveStatus(''), 2000);
            cancelAction();
            return;
          } else if (hit.type === 'polygon') {
            const verts = getEntityPolygonVertices(hit);
            if (verts.length >= 3) {
              pushState([
                ...entities,
                {
                  type: 'fill',
                  id: Date.now(),
                  points: verts,
                  layer: activeLayerId,
                  hatchAngle: 45,
                  hatchSpacing: 4,
                  style: {
                    ...currentStyle,
                    fillColor:
                      currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== '#ffffff'
                        ? currentStyle.fillColor
                        : 'none',
                    opacity: currentStyle.opacity ?? 0.35,
                  },
                },
              ]);
              setSaveStatus('🎨 Rayado a 45º aplicado al polígono');
              setTimeout(() => setSaveStatus(''), 2000);
              cancelAction();
              return;
            }
          }
        }
      }

      // 2. Click points to define closed boundary. If clicking near start or previous point, complete!
      if (
        curvePoints.length >= 2 &&
        (Math.hypot(pos.x - curvePoints[0].x, pos.y - curvePoints[0].y) < 5 ||
          (curvePoints.length >= 3 && Math.hypot(pos.x - curvePoints[curvePoints.length - 1].x, pos.y - curvePoints[curvePoints.length - 1].y) < 3))
      ) {
        pushState([
          ...entities,
          {
            type: 'fill',
            id: Date.now(),
            points: [...curvePoints],
            layer: activeLayerId,
            hatchAngle: 45,
            hatchSpacing: 4,
            style: {
              ...currentStyle,
              fillColor:
                currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== '#ffffff'
                  ? currentStyle.fillColor
                  : 'none',
              opacity: currentStyle.opacity ?? 0.35,
            },
          },
        ]);
        setSaveStatus('🎨 Rayado a 45º completado');
        setTimeout(() => setSaveStatus(''), 2000);
        cancelAction();
        return;
      }
      setCurvePoints((prev) => [...prev, pos]);
      setIsDrawing(true);
      setStep(1);
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
        const newLine: LineEntity = {
          type: 'line',
          id: t,
          x1: p1.x,
          y1: p1.y,
          x2: finalX,
          y2: finalY,
          layer: activeLayerId,
          style: { ...currentStyle },
        };

        // Detect if completing this segment closes a shape with existing segments
        const existingLines = entities.filter(
          (e): e is LineEntity => e.type === 'line' && (e.layer === undefined || e.layer === activeLayerId)
        );
        const cycle = detectClosedCycleFromSegments(newLine, existingLines, 2.5);

        if (cycle && cycle.vertices.length >= 3) {
          const closedPoly: PolygonEntity = {
            type: 'polygon',
            id: t,
            cx: cycle.centroid.x,
            cy: cycle.centroid.y,
            r: cycle.radius,
            sides: cycle.vertices.length,
            angle: 0,
            points: cycle.vertices,
            isIrregular: true,
            layer: activeLayerId,
            style: {
              ...currentStyle,
              fillColor:
                currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== 'transparent'
                  ? currentStyle.fillColor
                  : '#38bdf8',
              opacity: currentStyle.opacity ?? 0.35,
            },
          };
          const remaining = entities.filter((e) => !cycle.segmentIds.includes(e.id));
          pushState([...remaining, closedPoly]);
          setSelectedEntities([closedPoly]);
          setShowInspector(true);
          setSaveStatus(
            `✨ ¡Forma cerrada detectada! Polígono irregular de ${cycle.vertices.length} lados creado. Modifica su trazo y relleno aquí.`
          );
          setTimeout(() => setSaveStatus(''), 4500);
          cancelAction();
          return;
        } else {
          updated.push(newLine);
        }
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
      } else if (currentTool === 'rect' && p1) {
        const rx = Math.min(p1.x, finalX);
        const ry = Math.min(p1.y, finalY);
        const rw = Math.abs(finalX - p1.x);
        const rh = Math.abs(finalY - p1.y);
        if (rw > 0.1 && rh > 0.1) {
          updated.push({
            type: 'rect',
            id: t,
            x: rx,
            y: ry,
            w: rw,
            h: rh,
            layer: activeLayerId,
            style: { ...currentStyle },
          });
        }
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

    // Handle entity transformation (resize & free rotation for text and image)
    if (transformState) {
      const targetEntity = entities.find(
        (ent) => ent.id === transformState.entityId && ent.type === transformState.entityType
      );
      if (targetEntity) {
        if (transformState.handle === 'rotate') {
          const cx = transformState.origX + transformState.origW / 2;
          const cy = transformState.origY + transformState.origH / 2;
          const angleRad = Math.atan2(pos.y - cy, pos.x - cx);
          let deg = (angleRad * 180) / Math.PI + 90;
          while (deg < 0) deg += 360;
          while (deg >= 360) deg -= 360;

          if (e.shiftKey || orthoMode) {
            deg = Math.round(deg / 15) * 15;
            if (deg >= 360) deg = 0;
          } else {
            deg = Math.round(deg * 10) / 10;
          }

          if (targetEntity.type === 'text') {
            (targetEntity as TextEntity).angle = deg;
          } else if (targetEntity.type === 'image') {
            (targetEntity as ImageEntity).rotation = deg;
          }
          setSaveStatus(`🔄 Rotación: ${deg.toFixed(1)}º (Shift para saltos de 15º)`);
          setProject((prev) => ({ ...prev }));
        } else {
          const dx = pos.x - transformState.startX;
          const dy = pos.y - transformState.startY;
          let newX = transformState.origX;
          let newY = transformState.origY;
          let newW = transformState.origW;
          let newH = transformState.origH;
          const isCorner = ['nw', 'ne', 'se', 'sw'].includes(transformState.handle);

          if (transformState.handle === 'e' || transformState.handle === 'ne' || transformState.handle === 'se') {
            newW = Math.max(10, transformState.origW + dx);
          } else if (transformState.handle === 'w' || transformState.handle === 'nw' || transformState.handle === 'sw') {
            newW = Math.max(10, transformState.origW - dx);
            newX = transformState.origX + (transformState.origW - newW);
          }

          if (transformState.handle === 's' || transformState.handle === 'se' || transformState.handle === 'sw') {
            newH = Math.max(8, transformState.origH + dy);
          } else if (transformState.handle === 'n' || transformState.handle === 'ne' || transformState.handle === 'nw') {
            newH = Math.max(8, transformState.origH - dy);
            newY = transformState.origY + (transformState.origH - newH);
          }

          // If corner scaling image and Shift NOT pressed: preserve aspect ratio
          if (targetEntity.type === 'image' && isCorner && !e.shiftKey) {
            const scaleRatio = Math.max(newW / transformState.origW, newH / transformState.origH);
            newW = Math.max(10, transformState.origW * scaleRatio);
            newH = Math.max(8, newW / transformState.aspectRatio);
            if (transformState.handle === 'nw') {
              newX = transformState.origX + (transformState.origW - newW);
              newY = transformState.origY + (transformState.origH - newH);
            } else if (transformState.handle === 'ne') {
              newY = transformState.origY + (transformState.origH - newH);
            } else if (transformState.handle === 'sw') {
              newX = transformState.origX + (transformState.origW - newW);
            }
          }

          if (targetEntity.type === 'text') {
            (targetEntity as TextEntity).x = newX;
            (targetEntity as TextEntity).y = newY;
            (targetEntity as TextEntity).w = newW;
            (targetEntity as TextEntity).h = newH;
          } else if (targetEntity.type === 'image') {
            (targetEntity as ImageEntity).x = newX;
            (targetEntity as ImageEntity).y = newY;
            (targetEntity as ImageEntity).width = newW;
            (targetEntity as ImageEntity).height = newH;
          }
          setProject((prev) => ({ ...prev }));
        }
      }
      return;
    }

    // CAD Box selection marquee: Window (Left -> Right: Blue solid) vs Crossing (Right -> Left: Green dashed)
    if (currentTool === 'cursor' && isBoxSelecting && boxStart) {
      const minX = Math.min(boxStart.x, pos.x);
      const maxX = Math.max(boxStart.x, pos.x);
      const minY = Math.min(boxStart.y, pos.y);
      const maxY = Math.max(boxStart.y, pos.y);
      const isCrossing = pos.x < boxStart.x;
      const w = maxX - minX;
      const h = maxY - minY;

      const fill = isCrossing ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';
      const stroke = isCrossing ? '#10b981' : '#3b82f6';
      const dash = isCrossing ? 'stroke-dasharray="2,2"' : '';
      const modeLabel = isCrossing ? 'Captura (Cruce)' : 'Ventana (Dentro 100%)';

      setGhostHtml(
        `<g pointer-events="none">
          <rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="0.35" ${dash}/>
          <g transform="translate(${minX + 2}, ${minY + 3.8})">
            <rect x="0" y="-3.2" width="${modeLabel.length * 1.8 + 4}" height="4.4" rx="0.8" fill="#0f172a" opacity="0.9"/>
            <text x="2" y="-0.3" fill="${stroke}" font-size="2.4" font-family="sans-serif" font-weight="bold">${modeLabel}</text>
          </g>
        </g>`
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
        if (ent.locked) return;
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
      const allPts = [...curvePoints, pos];
      const splineD = smoothPath(allPts);
      const ptsMarks = curvePoints
        .map(
          (p, idx) =>
            `<circle cx="${p.x}" cy="${p.y}" r="1.4" fill="#38bdf8" stroke="#ffffff" stroke-width="0.4"/><text x="${p.x + 2}" y="${p.y - 2}" fill="#38bdf8" font-size="2.6" font-family="monospace">P${idx + 1}</text>`
        )
        .join('');
      content = `
        <path d="${splineD}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-dasharray="2,2"/>
        ${ptsMarks}
        <circle cx="${pos.x}" cy="${pos.y}" r="1.8" fill="none" stroke="#38bdf8" stroke-width="0.6"/>
      `;
    } else if (currentTool === 'rect' && p1) {
      const rx = Math.min(p1.x, p2x);
      const ry = Math.min(p1.y, p2y);
      const rw = Math.abs(p2x - p1.x);
      const rh = Math.abs(p2y - p1.y);
      content = `
        <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" stroke="${col}" stroke-width="${sw}" fill="rgba(56, 189, 248, 0.08)" opacity="0.75" ${dash}/>
        <text x="${rx + rw / 2}" y="${ry + rh / 2}" fill="#0284c7" font-size="3.5" font-family="monospace" font-weight="bold" text-anchor="middle">${rw.toFixed(1)} × ${rh.toFixed(1)} mm</text>
      `;
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

    if (transformState) {
      const typeLabel = transformState.entityType === 'text' ? 'Caja de texto' : 'Recorte/Imagen';
      const actionLabel = transformState.handle === 'rotate' ? 'rotada' : 'transformada';
      setTransformState(null);
      setIsDrawing(false);
      pushState([...allEntities]);
      setSaveStatus(`📐 ${typeLabel} ${actionLabel} correctamente`);
      setTimeout(() => setSaveStatus(''), 1500);
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
        const isCrossing = pos.x < boxStart.x;
        const box = { minX, maxX, minY, maxY };

        const newlySelected = entities.filter((ent) => {
          return isCrossing ? isEntityCrossingBox(ent, box) : isEntityInsideBox(ent, box);
        });

        setSelectedEntities(newlySelected);
        setIsBoxSelecting(false);
        setGhostHtml('');
        setIsDrawing(false);
        setSaveStatus(
          `🎯 ${newlySelected.length} elemento(s) (${isCrossing ? 'Captura / Cruce' : 'Ventana / 100% dentro'})`
        );
        setTimeout(() => setSaveStatus(''), 2000);
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
      const h = Math.max(15, Math.abs(pos.y - p1.y));
      const newText: TextEntity = {
        type: 'text',
        id: Date.now(),
        x,
        y,
        w,
        h,
        textHtml: 'Escribe tu <b>nota técnica</b> o enunciado aquí...',
        fontSize: 5,
        layer: activeLayerId,
        style: { ...currentStyle },
      };
      pushState([...entities, newText]);
      cancelAction();
      setEditingTextEntity(newText);
      setIsRichTextOpen(true);
      setCurrentTool('cursor');
      setSelectedEntities([newText]);
    }
  };

  const duplicateSelectedEntities = () => {
    if (selectedEntities.length === 0) return;
    const t = Date.now();
    const clones = selectedEntities.map((e, i) => {
      const c = JSON.parse(JSON.stringify(e));
      c.id = t + i;
      if (c.type === 'line' || c.type === 'measure') {
        c.x1 += 8; c.y1 += 8; c.x2 += 8; c.y2 += 8;
      } else if (c.type === 'circle' || c.type === 'polygon' || c.type === 'arc') {
        c.cx += 8; c.cy += 8;
        if (c.type === 'polygon' && Array.isArray(c.points)) {
          c.points = c.points.map((pt: any) => ({ x: pt.x + 8, y: pt.y + 8 }));
        }
      } else if (c.type === 'point' || c.type === 'rect' || c.type === 'text' || c.type === 'tag') {
        c.x += 8; c.y += 8;
      }
      return c;
    });
    pushState([...entities, ...clones]);
    setSelectedEntities(clones);
    setSaveStatus(`📋 ${clones.length} elemento(s) duplicado(s)`);
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const deleteSelectedEntities = () => {
    if (selectedEntities.length === 0) return;
    const ids = new Set(selectedEntities.map((s) => s.id));
    pushState(entities.filter((e) => !ids.has(e.id)));
    setSelectedEntities([]);
    setSaveStatus('🗑️ Elementos eliminados');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const handlePurge = () => {
    const res = purgeEntities(entities);
    if (res.removedCount > 0) {
      pushState(res.cleaned);
      setSelectedEntities([]);
    }
    setSaveStatus(res.details);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleBringToFront = () => {
    if (selectedEntities.length === 0) return;
    const selectedIds = new Set(selectedEntities.map((s) => s.id));
    const nonSelected = entities.filter((e) => !selectedIds.has(e.id));
    const selected = entities.filter((e) => selectedIds.has(e.id));
    pushState([...nonSelected, ...selected]);
    setSaveStatus('⏫ Traído al frente');
    setTimeout(() => setSaveStatus(''), 1200);
  };

  const handleSendToBack = () => {
    if (selectedEntities.length === 0) return;
    const selectedIds = new Set(selectedEntities.map((s) => s.id));
    const nonSelected = entities.filter((e) => !selectedIds.has(e.id));
    const selected = entities.filter((e) => selectedIds.has(e.id));
    pushState([...selected, ...nonSelected]);
    setSaveStatus('⏬ Enviado al fondo');
    setTimeout(() => setSaveStatus(''), 1200);
  };

  const handleMirrorSelected = () => {
    if (selectedEntities.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    selectedEntities.forEach((ent) => {
      if (ent.type === 'line' || ent.type === 'measure') {
        minX = Math.min(minX, ent.x1, ent.x2);
        maxX = Math.max(maxX, ent.x1, ent.x2);
      } else if (ent.type === 'circle' || ent.type === 'arc' || ent.type === 'polygon') {
        minX = Math.min(minX, ent.cx - ent.r);
        maxX = Math.max(maxX, ent.cx + ent.r);
      } else if (ent.type === 'rect' || ent.type === 'text' || ent.type === 'point') {
        minX = Math.min(minX, ent.x);
        maxX = Math.max(maxX, ent.x + ((ent as any).w || 0));
      }
    });
    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return;
    const midX = (minX + maxX) / 2;
    const selectedIds = new Set(selectedEntities.map((s) => s.id));
    const mirrored = entities.map((ent) => {
      if (!selectedIds.has(ent.id)) return ent;
      const c = JSON.parse(JSON.stringify(ent));
      if (c.type === 'line' || c.type === 'measure') {
        c.x1 = 2 * midX - c.x1;
        c.x2 = 2 * midX - c.x2;
      } else if (c.type === 'circle' || c.type === 'arc' || c.type === 'polygon') {
        c.cx = 2 * midX - c.cx;
        if (c.type === 'polygon' && Array.isArray(c.points)) {
          c.points = c.points.map((pt: any) => ({ x: 2 * midX - pt.x, y: pt.y }));
        }
      } else if (c.type === 'rect' || c.type === 'text' || c.type === 'point' || c.type === 'tag') {
        c.x = 2 * midX - c.x - ((c as any).w || 0);
      }
      return c;
    });
    pushState(mirrored);
    setSelectedEntities(mirrored.filter((e) => selectedIds.has(e.id)));
    setSaveStatus('🪞 Simetría horizontal aplicada');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const handleUngroupSelected = () => {
    const poly = selectedEntities.find((e) => e.type === 'polygon') as PolygonEntity | undefined;
    if (!poly) return;
    const pts = getEntityPolygonVertices(poly);
    if (pts.length < 2) return;
    const t = Date.now();
    const newSegments: LineEntity[] = [];
    for (let i = 0; i < pts.length; i++) {
      const pA = pts[i];
      const pB = pts[(i + 1) % pts.length];
      newSegments.push({
        id: t + i,
        type: 'line',
        x1: pA.x,
        y1: pA.y,
        x2: pB.x,
        y2: pB.y,
        layer: poly.layer || activeLayerId,
        style: {
          width: poly.style.width || 0.5,
          color: poly.style.color || '#000000',
          dash: poly.style.dash || 'none',
          marker: 'none',
        },
      });
    }
    const nextEntities = entities.filter((e) => e.id !== poly.id).concat(newSegments);
    pushState(nextEntities);
    setSelectedEntities(newSegments);
    setSaveStatus(`✂️ Polígono desagrupado en ${newSegments.length} segmentos`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleClosePolygonFromSelected = () => {
    const selectedLines = selectedEntities.filter(
      (e): e is LineEntity => e.type === 'line' || e.type === 'measure'
    );
    if (selectedLines.length < 2) return;

    // Connect segments into vertex chain
    const endpoints: Point2D[] = [];
    selectedLines.forEach((l) => {
      endpoints.push({ x: l.x1, y: l.y1 });
      endpoints.push({ x: l.x2, y: l.y2 });
    });
    // Remove nearly duplicate endpoints to form polygon vertices
    const uniqueVerts: Point2D[] = [];
    endpoints.forEach((pt) => {
      if (!uniqueVerts.some((u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 2.0)) {
        uniqueVerts.push(pt);
      }
    });

    if (uniqueVerts.length >= 3) {
      const t = Date.now();
      const avgX = uniqueVerts.reduce((sum, v) => sum + v.x, 0) / uniqueVerts.length;
      const avgY = uniqueVerts.reduce((sum, v) => sum + v.y, 0) / uniqueVerts.length;
      const r = Math.max(...uniqueVerts.map((v) => Math.hypot(v.x - avgX, v.y - avgY)));

      const newPoly: PolygonEntity = {
        type: 'polygon',
        id: t,
        cx: avgX,
        cy: avgY,
        r: Math.max(5, r),
        sides: uniqueVerts.length,
        angle: 0,
        points: uniqueVerts,
        isIrregular: true,
        layer: activeLayerId,
        style: {
          ...currentStyle,
          fillColor:
            currentStyle.fillColor && currentStyle.fillColor !== 'none' && currentStyle.fillColor !== 'transparent'
              ? currentStyle.fillColor
              : '#38bdf8',
          opacity: currentStyle.opacity ?? 0.35,
        },
      };

      const selectedIds = new Set(selectedLines.map((l) => l.id));
      const remaining = entities.filter((e) => !selectedIds.has(e.id));
      pushState([...remaining, newPoly]);
      setSelectedEntities([newPoly]);
      setSaveStatus(`🔄 Polígono cerrado creado con ${uniqueVerts.length} vértices`);
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (isDrawing) {
      cancelAction();
      return;
    }
    const pos = getCanvasCoords(e);
    const hit = getHitEntity(pos, entities, 6);
    if (hit) {
      if (!selectedEntities.some((s) => s.id === hit.id)) {
        setSelectedEntities([hit]);
      }
    }
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (currentTool === 'curve') {
      if (curvePoints.length >= 2) {
        pushState([
          ...entities,
          {
            type: 'curve',
            id: Date.now(),
            points: [...curvePoints],
            style: { ...currentStyle },
          },
        ]);
        setSaveStatus('〰️ Spline finalizada');
        setTimeout(() => setSaveStatus(''), 2000);
      }
      cancelAction();
      return;
    }
    if (currentTool === 'fill') {
      if (curvePoints.length >= 3) {
        pushState([
          ...entities,
          {
            type: 'fill',
            id: Date.now(),
            points: [...curvePoints],
            style: { ...currentStyle },
          },
        ]);
        setSaveStatus('🎨 Región rellenada');
        setTimeout(() => setSaveStatus(''), 2000);
      }
      cancelAction();
      return;
    }
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

  // File saving and exporting with custom filename choice
  const handleSaveToFile = () => {
    const defaultName = project.projectName || 'Proyecto_VektorCAD';
    const chosenName = prompt('Introduce el nombre del archivo para guardar el proyecto:', defaultName);
    if (chosenName === null) return;
    const cleanName = chosenName.trim() || defaultName;
    const updatedPages = [...project.pages];
    updatedPages[currentPageIndex] = {
      ...(updatedPages[currentPageIndex] || currentPage),
      data: entities,
    };
    const updated: CadProject = {
      ...project,
      projectName: cleanName,
      pages: updatedPages,
      layers,
      currentPageIndex,
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    downloadProjectFile(updated, cleanName);
    setSaveStatus(`💾 Guardado como ${cleanName}.json`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleExportPDF = async () => {
    try {
      const defaultName = project.projectName || 'Lamina_CAD';
      let fileName = defaultName;
      if (typeof window !== 'undefined' && window.prompt) {
        const chosen = window.prompt('Nombre del archivo PDF a exportar:', defaultName);
        if (chosen !== null && chosen.trim() !== '') {
          fileName = chosen.trim();
        }
      }
      setSaveStatus('⏳ Generando PDF de alta definición (300 DPI)...');
      await exportProjectToPDF(project.pages, currentPageIndex, svgRef.current, {
        fileName,
        allPages: project.pages.length > 1,
      });
      setSaveStatus(`📑 PDF "${fileName}.pdf" descargado`);
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      setSaveStatus('❌ Error al exportar PDF');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleExportSVG = () => {
    const defaultName = project.projectName || 'Lamina_CAD';
    const chosenName = prompt('Nombre del archivo SVG a exportar:', defaultName);
    if (chosenName === null) return;
    const fileName = chosenName.trim() || defaultName;
    exportToSVG(svgRef.current, fileName, currentPage);
    setSaveStatus(`🎨 SVG "${fileName}.svg" descargado`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleExportDXF = () => {
    const defaultName = project.projectName || 'Lamina_CAD';
    const chosenName = prompt('Nombre del archivo DXF (AutoCAD) a exportar:', defaultName);
    if (chosenName === null) return;
    const fileName = chosenName.trim() || defaultName;
    const dxf = generateDxfString(currentPage.sheetSize, allEntities);
    const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.dxf$/i, '')}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus(`📐 DXF "${fileName}.dxf" descargado`);
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const handleOpenProjectFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.vektor';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const loaded = parseProjectFile(evt.target?.result as string);
          setShowPlayer(false);
          setPlayerStep(0);
          setSelectedEntities([]);
          setReferenceLine(null);
          setCurvePoints([]);
          setTransformState(null);
          setKeyboardInput('');
          setProject(loaded);
          if (loaded.layers && Array.isArray(loaded.layers) && loaded.layers.length > 0) {
            setLayers(loaded.layers.map((l) => ({ ...l, visible: true })));
          }
          setSaveStatus(`📂 Proyecto "${loaded.projectName}" cargado`);
          setTimeout(() => setSaveStatus(''), 2500);
        } catch (err) {
          console.error(err);
          setSaveStatus('❌ Error al cargar archivo');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleOpenPdfBaseDialog = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.onchange = (e) => {
      handleImportPDFBase(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-neutral-200 font-sans">
      {/* 1. Header Navigation Bar (Adaptive Mobile vs Desktop) */}
      {!isFocusMode && (
        isMobileMode ? (
          <MobileTopBar
            sheetSize={currentPage.sheetSize}
            currentPage={currentPageIndex + 1}
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
            canUndo={currentPage.history.length > 0}
            canRedo={currentPage.redoHistory.length > 0}
            onUndo={undo}
            onRedo={redo}
            isMobileMode={isMobileMode}
            onToggleMobileMode={handleToggleMobileMode}
            onOpenMenu={() => setIsMobileMenuOpen(true)}
            saveStatus={saveStatus}
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
            onResetZoom={handleResetZoom}
          />
        ) : (
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
            onOpenPageManager={() => setIsPageManagerOpen(true)}
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
            onResetZoom={handleResetZoom}
            coords={coords}
            onUndo={undo}
            onRedo={redo}
            canUndo={currentPage.history.length > 0}
            canRedo={currentPage.redoHistory.length > 0}
            onOpenMarginsModal={() => setIsMarginsOpen(true)}
            onOpenCropModal={handleOpenCropperFile}
            onImportPDFBase={handleImportPDFBase}
            onSaveToFile={handleSaveToFile}
            onLoadFromFile={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                try {
                  const loaded = parseProjectFile(evt.target?.result as string);
                  setShowPlayer(false);
                  setPlayerStep(0);
                  setSelectedEntities([]);
                  setReferenceLine(null);
                  setCurvePoints([]);
                  setTransformState(null);
                  setKeyboardInput('');
                  setProject(loaded);
                  if (loaded.layers && Array.isArray(loaded.layers) && loaded.layers.length > 0) {
                    setLayers(loaded.layers.map((l) => ({ ...l, visible: true })));
                  }
                  const pageIdx =
                    typeof loaded.currentPageIndex === 'number' && loaded.currentPageIndex < loaded.pages.length
                      ? loaded.currentPageIndex
                      : 0;
                  setCurrentPageIndex(pageIdx);
                  cancelAction();
                  const entCount = loaded.pages[pageIdx]?.data?.length || 0;
                  setSaveStatus(`📂 Archivo "${file.name}" cargado (${entCount} elementos)`);
                  setTimeout(() => setSaveStatus(''), 2500);
                } catch (err) {
                  alert('Error al leer el archivo de proyecto JSON.');
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
            onExportPDF={handleExportPDF}
            onExportSVG={handleExportSVG}
            onExportDXF={handleExportDXF}
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
            onPurge={handlePurge}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((p) => !p)}
            hasBgImage={Boolean(currentPage.bgImage)}
            bgImageLocked={Boolean(currentPage.bgImageLocked)}
            onToggleBgImageLock={handleToggleBgImageLock}
            showBgImage={showBgImage}
            onToggleBgImage={() => setShowBgImage((prev) => !prev)}
            onRemoveBgImage={() => {
              if (confirm('¿Eliminar definitivamente el PDF/imagen base de esta lámina?')) {
                setProject((prev) => {
                  const updatedPages = [...prev.pages];
                  updatedPages[currentPageIndex] = {
                    ...updatedPages[currentPageIndex],
                    bgImage: null,
                  };
                  return { ...prev, pages: updatedPages };
                });
                setSaveStatus('🗑️ PDF base eliminado');
                setTimeout(() => setSaveStatus(''), 2000);
              }
            }}
            isMobileMode={isMobileMode}
            onToggleMobileMode={handleToggleMobileMode}
          />
        )
      )}

      {/* Floating Exit Button for Focus Mode */}
      {isFocusMode && (
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-2xl text-xs text-slate-200 animate-in fade-in">
          <span className="text-sky-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Modo Enfoque
          </span>
          <button
            onClick={() => setIsFocusMode(false)}
            className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium transition text-[11px]"
          >
            Salir [Tab]
          </button>
        </div>
      )}

      {/* 2. Precision & Line Property Bar (Desktop Only, Mobile uses floating controls) */}
      {!isFocusMode && !isMobileMode && (
        <PropertyBar
          currentTool={currentTool}
          style={selectedEntities.length === 1 ? { ...currentStyle, ...selectedEntities[0].style } : currentStyle}
          onChangeStyle={(newStyle) => {
            setCurrentStyle((prev) => ({ ...prev, ...newStyle }));
            if (selectedEntities.length > 0) {
              const selIds = new Set(selectedEntities.map((s) => s.id));
              const updated = allEntities.map((ent) => {
                if (selIds.has(ent.id)) {
                  return {
                    ...ent,
                    style: {
                      ...ent.style,
                      ...newStyle,
                    },
                  };
                }
                return ent;
              });
              pushState(updated);
              setSelectedEntities((prev) =>
                prev.map((s) => ({
                  ...s,
                  style: {
                    ...s.style,
                    ...newStyle,
                  },
                }))
              );
            }
          }}
          selectedCount={selectedEntities.length}
          snapEnabled={snapEnabled}
          onToggleSnap={() => setSnapEnabled((prev) => !prev)}
          isCtrlHeld={isCtrlHeld}
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
      )}

      {/* 3. Main Workspace: ToolBar + Canvas + Overlays + Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        {!isFocusMode && !isMobileMode && (
          <ToolBar
            activeTool={currentTool}
            onSelectTool={(tool) => {
              cancelAction();
              if (tool === 'diedrico_template') {
                setIsDiedricoModalOpen(true);
                return;
              }
              setCurrentTool(tool);
            }}
          />
        )}

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
            bgImage={showBgImage ? currentPage.bgImage : null}
            bgImageLocked={Boolean(currentPage.bgImageLocked)}
            onToggleBgImageLock={handleToggleBgImageLock}
            onToggleEntityLock={handleToggleEntityLock}
            onZoomChange={handleZoomChange}
            onSetZoom={handleSetZoom}
            isMobileMode={isMobileMode}
            hiddenLayers={new Set(layers.filter((l) => !l.visible).map((l) => l.id))}
            cursorPos={coords}
            showRulers={!isMobileMode}
            keyboardInput={keyboardInput}
            p1={p1}
            currentTool={currentTool}
            orthoMode={orthoMode}
            isPlayerActive={showPlayer}
            isHandDrawn={isHandDrawn}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            isPanning={isPanning}
            cursorStyle={getCursor()}
          />

          {/* Floating Mobile Precision & Quick Action Bar */}
          {isMobileMode && !isFocusMode && (
            <MobileControlBar
              snapEnabled={snapEnabled}
              onToggleSnap={() => setSnapEnabled((prev) => !prev)}
              orthoMode={orthoMode}
              onToggleOrtho={() => setOrthoMode((prev) => !prev)}
              gridSnapEnabled={gridSnapEnabled}
              onToggleGridSnap={() => setGridSnapEnabled((prev) => !prev)}
              onResetZoom={handleResetZoom}
              onZoomChange={handleZoomChange}
              zoomLevel={zoomLevel}
              hasBgImage={Boolean(currentPage.bgImage)}
              bgImageLocked={Boolean(currentPage.bgImageLocked)}
              onToggleBgImageLock={handleToggleBgImageLock}
              currentStyle={currentStyle}
              onChangeStyle={(newStyle) => {
                setCurrentStyle((prev) => ({ ...prev, ...newStyle }));
                if (selectedEntities.length > 0) {
                  const selIds = new Set(selectedEntities.map((s) => s.id));
                  const updated = allEntities.map((ent) => {
                    if (selIds.has(ent.id)) {
                      return {
                        ...ent,
                        style: {
                          ...ent.style,
                          ...newStyle,
                        },
                      };
                    }
                    return ent;
                  });
                  pushState(updated);
                  setSelectedEntities((prev) =>
                    prev.map((s) => ({
                      ...s,
                      style: {
                        ...s.style,
                        ...newStyle,
                      },
                    }))
                  );
                }
              }}
            />
          )}

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
            isHandDrawn={isHandDrawn}
            onToggleHandDrawn={() => setIsHandDrawn((prev) => !prev)}
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
                if (c.type === 'polygon' && Array.isArray(c.points)) {
                  c.points = c.points.map((pt: any) => ({ x: pt.x + 8, y: pt.y + 8 }));
                }
              } else if (c.type === 'point' || c.type === 'rect' || c.type === 'text' || c.type === 'tag') {
                c.x += 8; c.y += 8;
              }
              return c;
            });
            pushState([...allEntities, ...clones]);
            setSelectedEntities(clones);
          }}
          onUngroupPolygon={(poly) => {
            const pts = getEntityPolygonVertices(poly);
            const t = Date.now();
            const segs: LineEntity[] = [];
            for (let i = 0; i < pts.length; i++) {
              const pA = pts[i];
              const pB = pts[(i + 1) % pts.length];
              segs.push({
                type: 'line',
                id: t + i,
                x1: pA.x,
                y1: pA.y,
                x2: pB.x,
                y2: pB.y,
                layer: poly.layer,
                style: {
                  ...poly.style,
                  fillColor: 'none',
                },
              });
            }
            const nextEntities = allEntities.filter((e) => e.id !== poly.id).concat(segs);
            pushState(nextEntities);
            setSelectedEntities(segs);
            setSaveStatus(`✂️ Polígono desagrupado en ${segs.length} segmentos independientes.`);
            setTimeout(() => setSaveStatus(''), 3000);
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

      {/* Mobile Bottom Dock or Desktop CAD Command Bar */}
      {isMobileMode && !isFocusMode ? (
        <MobileBottomBar
          activeTool={currentTool}
          onSelectTool={(tool) => {
            cancelAction();
            if (tool === 'diedrico_template') {
              setIsDiedricoModalOpen(true);
              return;
            }
            setCurrentTool(tool);
          }}
          onOpenCropModal={handleOpenCropperFile}
        />
      ) : !isFocusMode ? (
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
              : currentTool === 'curve'
              ? 'Spline / Curva: Haz clic para añadir puntos de control. Doble clic o Enter para finalizar.'
              : currentTool === 'fill'
              ? 'Trama / Relleno: Haz clic para añadir vértices del contorno. Doble clic o clic en el inicio para cerrar y rellenar.'
              : ''
          }
          onExecuteCommand={(cmdStr) => {
            const raw = cmdStr.trim();
            if (/^[0-9.,<xX\-\s]+$/.test(raw) && /[0-9]/.test(raw)) {
              applyKeyboardMeasure(raw);
              return;
            }
            const trimmed = raw.toUpperCase();
            if (trimmed === 'L' || trimmed === 'LINEA' || trimmed === 'LINE') setCurrentTool('line');
            else if (trimmed === 'C' || trimmed === 'CIRCULO' || trimmed === 'CIRCLE') setCurrentTool('circle');
            else if (trimmed === 'S' || trimmed === 'SPLINE' || trimmed === 'CURVA') setCurrentTool('curve');
            else if (trimmed === 'F' || trimmed === 'FILL' || trimmed === 'RELLENO') setCurrentTool('fill');
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
            else if (trimmed === 'PAGES' || trimmed === 'LAMINAS' || trimmed === 'PAGINAS') setIsPageManagerOpen(true);
            else if (trimmed === 'SNAP' || trimmed === 'IMAN') {
              setSnapEnabled((p) => !p);
              setSaveStatus(snapEnabled ? '⚡ Imán Desactivado' : '🧲 Imán Activado');
              setTimeout(() => setSaveStatus(''), 1500);
            } else if (trimmed === 'ISO' || trimmed === 'ISOMETRICA') {
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
              handleExportDXF();
            } else if (trimmed === 'SAVE' || trimmed === 'GUARDAR') {
              handleSaveToFile();
            } else if (trimmed === 'CLEAR') {
              if (confirm('¿Vaciar lámina?')) pushState([]);
            } else if (trimmed === 'PURGE' || trimmed === 'PURGAR' || trimmed === 'LIMPIAR') {
              handlePurge();
            } else if (trimmed === 'HELP' || trimmed === 'AYUDA' || trimmed === '?') {
              setIsShortcutsOpen(true);
            } else if (trimmed === 'FULL' || trimmed === 'ENFOQUE' || trimmed === 'TAB') {
              setIsFocusMode((p) => !p);
            } else if (trimmed === 'DUP' || trimmed === 'DUPLICAR') {
              duplicateSelectedEntities();
            }
            cancelAction();
          }}
        />
      ) : null}

      {/* 4. Modals */}
      <MarginModal
        isOpen={isMarginsOpen}
        onClose={() => setIsMarginsOpen(false)}
        sheetSize={currentPage.sheetSize}
        currentStyle={currentStyle}
        onApplyMargins={(marginEntities) => pushState([...allEntities, ...marginEntities])}
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

      <PageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        pages={project.pages}
        currentPageIndex={currentPageIndex}
        onSelectPage={(idx) => {
          cancelAction();
          setCurrentPageIndex(idx);
        }}
        onReorderPages={(newPages, newActiveIndex) => {
          setProject((prev) => ({ ...prev, pages: newPages }));
          setCurrentPageIndex(newActiveIndex);
          cancelAction();
          setSaveStatus('📑 Orden de láminas actualizado');
          setTimeout(() => setSaveStatus(''), 2000);
        }}
        onAddPage={handleAddPage}
        onDeletePage={(idx) => {
          if (project.pages.length <= 1) return;
          if (confirm(`¿Eliminar la ${project.pages[idx].title || `Lámina ${idx + 1}`}?`)) {
            setProject((prev) => {
              const newPages = prev.pages.filter((_, i) => i !== idx);
              return { ...prev, pages: newPages };
            });
            setCurrentPageIndex((prev) => {
              if (prev === idx) return Math.max(0, idx - 1);
              if (prev > idx) return prev - 1;
              return prev;
            });
            cancelAction();
          }
        }}
      />

      {/* Canvas Right-Click Quick CAD Operations Menu */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          selectedEntities={selectedEntities}
          onClose={() => setContextMenuPos(null)}
          onDuplicate={duplicateSelectedEntities}
          onDelete={deleteSelectedEntities}
          onUngroup={handleUngroupSelected}
          onClosePolygon={handleClosePolygonFromSelected}
          onMirror={handleMirrorSelected}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onPurge={handlePurge}
          onResetZoom={() => setZoomLevel(95)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onCancelAction={cancelAction}
          hasBgImage={Boolean(currentPage.bgImage)}
          bgImageLocked={Boolean(currentPage.bgImageLocked)}
          onToggleBgImageLock={handleToggleBgImageLock}
          selectedImage={(selectedEntities.find((e) => e.type === 'image') as ImageEntity) || null}
          onToggleImageLock={() => {
            const img = selectedEntities.find((e) => e.type === 'image');
            if (img) handleToggleEntityLock(img.id);
          }}
          isMobileMode={isMobileMode}
        />
      )}

      {/* Mobile Slide-Over Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onExportPDF={handleExportPDF}
        onExportSVG={handleExportSVG}
        onExportDXF={handleExportDXF}
        onSaveToFile={handleSaveToFile}
        onOpenFileInput={handleOpenProjectFile}
        onOpenPdfBaseInput={handleOpenPdfBaseDialog}
        onOpenCropModal={handleOpenCropperFile}
        onOpenMarginsModal={() => setIsMarginsOpen(true)}
        onOpenPageManager={() => setIsPageManagerOpen(true)}
        onToggleInstruments={() => setShowInstruments((prev) => !prev)}
        showInstruments={showInstruments}
        onOpenStudyModal={() => setIsStudyOpen(true)}
        onPurge={handlePurge}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onNewCanvas={() => {
          if (confirm('¿Crear nuevo proyecto en blanco?')) {
            const fresh = createDefaultProject();
            setProject(fresh);
            setCurrentPageIndex(0);
            cancelAction();
          }
        }}
        hasBgImage={Boolean(currentPage.bgImage)}
        bgImageLocked={Boolean(currentPage.bgImageLocked)}
        onToggleBgImageLock={handleToggleBgImageLock}
        showBgImage={showBgImage}
        onToggleBgImage={() => setShowBgImage((prev) => !prev)}
        onRemoveBgImage={() => {
          if (confirm('¿Eliminar definitivamente el PDF/imagen base de esta lámina?')) {
            setProject((prev) => {
              const updatedPages = [...prev.pages];
              updatedPages[currentPageIndex] = {
                ...updatedPages[currentPageIndex],
                bgImage: null,
              };
              return { ...prev, pages: updatedPages };
            });
            setSaveStatus('🗑️ PDF base eliminado');
            setTimeout(() => setSaveStatus(''), 2000);
          }
        }}
        paperTheme={paperTheme}
        onChangePaperTheme={setPaperTheme}
        saveStatus={saveStatus}
        zoomLevel={zoomLevel}
        onZoomChange={handleZoomChange}
        onResetZoom={handleResetZoom}
      />

      {/* Technical Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Dihedral & 3D Axonometric Projection Config Modal */}
      <DiedricoModal
        isOpen={isDiedricoModalOpen}
        onClose={() => {
          setIsDiedricoModalOpen(false);
          cancelAction();
        }}
        onConfirm={(config: DiedricoConfig) => {
          const templateEntities = createDiedricoTemplate(
            currentPage.sheetSize,
            { ...currentStyle, width: 0.5 },
            { ...currentStyle, width: 0.25, color: '#64748b' },
            config
          );
          pushState([...entities, ...templateEntities]);
          if (config.axonometricSystem === 'cavalier') {
            setGridMode('cavalier');
          } else {
            setGridMode('isometric');
          }
          setGridSnapEnabled(true);
          const systemLabel =
            config.axonometricSystem === 'cavalier'
              ? 'Perspectiva Caballera 45º'
              : config.axonometricSystem === 'military'
              ? 'Perspectiva Militar'
              : 'Perspectiva Isométrica';
          setSaveStatus(`📐 Lámina de Vistas Diédricas y ${systemLabel} generada`);
          setTimeout(() => setSaveStatus(''), 3000);
          cancelAction();
          setCurrentTool('cursor');
          setIsDiedricoModalOpen(false);
        }}
      />
    </div>
  );
}
