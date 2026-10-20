/**
 * VektorCAD - Type Definitions & Interfaces
 * Precision technical drawing & CAD engine
 */

export type ToolType =
  | 'cursor'
  | 'line'
  | 'measure'
  | 'parallel'
  | 'perpendicular'
  | 'line_angle'
  | 'circle'
  | 'arc'
  | 'curve'
  | 'polygon'
  | 'fill'
  | 'symbol'
  | 'point'
  | 'rect'
  | 'text'
  | 'tag'
  | 'eraser'
  | 'instruments'
  | 'mediatriz'
  | 'bisectriz'
  | 'tales'
  | 'trim'
  | 'extend'
  | 'tape_measure'
  | 'mirror'
  | 'isocircle'
  | 'isobox'
  | 'diedrico_template';

export type GridMode = 'orthogonal' | 'isometric' | 'cavalier';
export type Isoplane = 'top' | 'left' | 'right';

export interface LayerConfig {
  id: string;
  name: string;
  color: string;
  defaultWidth: number;
  visible: boolean;
  locked: boolean;
}

export type DashStyle = 'none' | '3,3' | '10,2,2,2' | '6,2';
export type MarkerStyle = 'none' | 'arrow' | 'tick';
export type SymbolType = 'perp' | 'para' | 'coin' | 'angle' | 'center';

export interface EntityStyle {
  width: number; // in mm, e.g. 0.2, 0.5, 0.8
  color: string;
  fillColor?: string;
  dash: DashStyle;
  marker: MarkerStyle;
  opacity?: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BaseEntity {
  id: number;
  type: string;
  style: EntityStyle;
  layer?: string;
  locked?: boolean;
}

export interface LineEntity extends BaseEntity {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MeasureEntity extends BaseEntity {
  type: 'measure';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetDir: number; // 1 or -1
  customText?: string;
  offsetDistance?: number;
}

export interface CircleEntity extends BaseEntity {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  hasCenterMarks?: boolean;
}

export interface ArcEntity extends BaseEntity {
  type: 'arc';
  cx: number;
  cy: number;
  r: number;
  startAngle: number; // in radians
  sweepAngle: number; // in radians
}

export interface PolygonEntity extends BaseEntity {
  type: 'polygon';
  cx: number;
  cy: number;
  r: number;
  sides: number;
  angle: number; // in radians
  points?: Point2D[];
  isIrregular?: boolean;
}

export interface CurveEntity extends BaseEntity {
  type: 'curve';
  points: Point2D[];
}

export interface RectEntity extends BaseEntity {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PointEntity extends BaseEntity {
  type: 'point';
  x: number;
  y: number;
}

export interface SymbolEntity extends BaseEntity {
  type: 'symbol';
  x: number;
  y: number;
  symbolType: SymbolType;
}

export interface TagEntity extends BaseEntity {
  type: 'tag';
  x: number;
  y: number;
  text: string;
  angle: number; // degrees
  fontSize?: number;
  fontFamily?: string;
}

export interface TextEntity extends BaseEntity {
  type: 'text';
  x: number;
  y: number;
  w: number;
  h?: number;
  textHtml: string;
  text?: string;
  fontSize: number;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface FillEntity extends BaseEntity {
  type: 'fill';
  points: Point2D[];
  hatchAngle?: number; // 45º standard
  hatchSpacing?: number;
}

export interface ImageEntity extends BaseEntity {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  href: string;
}

export interface EllipseEntity extends BaseEntity {
  type: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number; // degrees
  isoplane?: Isoplane;
}

export type CadEntity =
  | LineEntity
  | MeasureEntity
  | CircleEntity
  | ArcEntity
  | PolygonEntity
  | CurveEntity
  | RectEntity
  | PointEntity
  | SymbolEntity
  | TagEntity
  | TextEntity
  | FillEntity
  | ImageEntity
  | EllipseEntity;

export interface SheetSize {
  name: string;
  w: number;
  h: number;
  orientation: 'landscape' | 'portrait';
}

export interface PageDocument {
  id: string;
  title: string;
  data: CadEntity[];
  history: string[];
  redoHistory: string[];
  bgImage: string | null;
  sheetSize: SheetSize;
  layers?: LayerConfig[];
}

export interface CadProject {
  version: string;
  projectName: string;
  pages: PageDocument[];
  currentPageIndex: number;
  globalSheetSize: SheetSize;
  layers?: LayerConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface SnapPoint {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'grid' | 'perpendicular' | 'quadrant';
  label?: string;
}

export interface InstrumentState {
  visible: boolean;
  type: 'set' | 'compass' | 'ruler'; // 'set' includes escuadra + cartabon
  escuadraPos: Point2D;
  escuadraAngle: number;
  cartabonPos: Point2D;
  cartabonAngle: number;
}
