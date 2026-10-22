/**
 * VektorCAD - Mathematical & Geometric Calculation Engine
 * Pure logic decoupled from React DOM for high performance and unit testing
 */

import type {
  CadEntity,
  Point2D,
  SnapPoint,
  EntityStyle,
  LineEntity,
  ArcEntity,
  PolygonEntity,
  TagEntity,
  SheetSize,
  Isoplane,
  EllipseEntity,
} from './types.ts';

/**
 * Calculates euclidean distance between two 2D points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Shortest distance from a point M to line segment AB, including projected point
 */
export function distPointToSegment(M: Point2D, A: Point2D, B: Point2D): { dist: number; proj: Point2D; t: number } {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) {
    const d = distance(M, A);
    return { dist: d, proj: { x: A.x, y: A.y }, t: 0 };
  }
  let t = ((M.x - A.x) * dx + (M.y - A.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: A.x + t * dx, y: A.y + t * dy };
  return { dist: distance(M, proj), proj, t };
}

/**
 * Generates an SVG path string for an arc given center, radius, start angle and sweep angle
 */
export function getSvgArcPath(cx: number, cy: number, r: number, startAngle: number, sweepAngle: number): string {
  if (Math.abs(sweepAngle) < 0.0001 || r <= 0) return '';
  const endAngle = startAngle + sweepAngle;
  const p1x = cx + r * Math.cos(startAngle);
  const p1y = cy + r * Math.sin(startAngle);
  const p2x = cx + r * Math.cos(endAngle);
  const p2y = cy + r * Math.sin(endAngle);
  const largeArc = Math.abs(sweepAngle) > Math.PI ? 1 : 0;
  const sweepFlag = sweepAngle > 0 ? 1 : 0;
  return `M ${p1x.toFixed(3)} ${p1y.toFixed(3)} A ${r.toFixed(3)} ${r.toFixed(3)} 0 ${largeArc} ${sweepFlag} ${p2x.toFixed(3)} ${p2y.toFixed(3)}`;
}

/**
 * Smooth spline path through an array of points
 */
export function smoothPath(points: Point2D[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i !== points.length - 2 ? points[i + 2] : p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

/**
 * Generates polygon vertices for a regular polygon
 */
export function getPolygonVertices(cx: number, cy: number, r: number, sides: number, startAngle: number): Point2D[] {
  const vertices: Point2D[] = [];
  const step = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const a = startAngle + i * step;
    vertices.push({
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
    });
  }
  return vertices;
}

/**
 * Returns the effective vertices of a PolygonEntity (explicit points if irregular, or computed for regular)
 */
export function getEntityPolygonVertices(ent: PolygonEntity): Point2D[] {
  if (ent.points && ent.points.length >= 3) {
    return ent.points;
  }
  return getPolygonVertices(ent.cx, ent.cy, ent.r, ent.sides, ent.angle);
}

/**
 * Determines whether a 2D point is inside an arbitrary polygon using ray casting
 */
export function isPointInPolygon(pt: Point2D, vertices: Point2D[]): boolean {
  if (vertices.length < 3) return false;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Calculates the exact area of an arbitrary simple polygon using the Shoelace formula (in mm²)
 */
export function calculatePolygonArea(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calculates the perimeter of a polygon in mm
 */
export function calculatePolygonPerimeter(vertices: Point2D[]): number {
  if (vertices.length < 2) return 0;
  let perim = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    perim += Math.hypot(vertices[j].x - vertices[i].x, vertices[j].y - vertices[i].y);
  }
  return perim;
}

/**
 * Detects whether adding a new segment completes a closed planar cycle with existing connected segments.
 * Uses BFS graph cycle detection with geometric snapping tolerance.
 */
export function detectClosedCycleFromSegments(
  newSeg: { x1: number; y1: number; x2: number; y2: number },
  existingLines: LineEntity[],
  snapTol = 2.0
): { vertices: Point2D[]; segmentIds: number[]; centroid: Point2D; radius: number } | null {
  const pStart: Point2D = { x: newSeg.x1, y: newSeg.y1 };
  const pEnd: Point2D = { x: newSeg.x2, y: newSeg.y2 };

  // Skip zero length
  if (distance(pStart, pEnd) < 0.2) return null;

  // Filter valid lines
  const validLines = existingLines.filter(
    (l) => Math.hypot(l.x2 - l.x1, l.y2 - l.y1) >= 0.2
  );
  if (validLines.length < 2) return null;

  // BFS search from pEnd to find a path through validLines to pStart
  interface BFSNode {
    currentPt: Point2D;
    pathPts: Point2D[];
    usedIds: number[];
  }

  const queue: BFSNode[] = [
    {
      currentPt: pEnd,
      pathPts: [pStart, pEnd],
      usedIds: [],
    },
  ];

  const maxSteps = 300;
  let steps = 0;

  while (queue.length > 0 && steps++ < maxSteps) {
    const { currentPt, pathPts, usedIds } = queue.shift()!;

    // Find candidate segments that connect to currentPt
    for (const seg of validLines) {
      if (usedIds.includes(seg.id)) continue;

      const pA: Point2D = { x: seg.x1, y: seg.y1 };
      const pB: Point2D = { x: seg.x2, y: seg.y2 };

      const dA = distance(currentPt, pA);
      const dB = distance(currentPt, pB);

      let nextPt: Point2D | null = null;
      if (dA <= snapTol) {
        nextPt = pB;
      } else if (dB <= snapTol) {
        nextPt = pA;
      }

      if (nextPt) {
        // Check if nextPt connects back to pStart (closing the loop!)
        const dStart = distance(nextPt, pStart);
        if (dStart <= snapTol && usedIds.length >= 1) {
          // Closed loop completed!
          // Build final unique vertices of the polygon
          const loopPts = [...pathPts];

          // Compute area
          const area = calculatePolygonArea(loopPts);
          if (area > 0.5 && loopPts.length >= 3) {
            // Calculate centroid
            let sumX = 0;
            let sumY = 0;
            for (const v of loopPts) {
              sumX += v.x;
              sumY += v.y;
            }
            const centroid = { x: sumX / loopPts.length, y: sumY / loopPts.length };
            let maxR = 0;
            for (const v of loopPts) {
              const r = distance(centroid, v);
              if (r > maxR) maxR = r;
            }

            return {
              vertices: loopPts,
              segmentIds: [...usedIds, seg.id],
              centroid,
              radius: maxR || 10,
            };
          }
        }

        // Avoid self-intersecting loops by checking if nextPt is already in pathPts
        const isRepeated = pathPts.some((pt, idx) => idx > 0 && distance(pt, nextPt!) <= snapTol * 0.7);
        if (!isRepeated && pathPts.length < 24) {
          queue.push({
            currentPt: nextPt,
            pathPts: [...pathPts, nextPt],
            usedIds: [...usedIds, seg.id],
          });
        }
      }
    }
  }

  return null;
}


/**
 * Tests if an angle is within an arc range
 */
export function isAngleInArc(angle: number, startAngle: number, sweepAngle: number): boolean {
  if (Math.abs(sweepAngle) >= Math.PI * 1.99) return true;
  let s = startAngle;
  let e = startAngle + sweepAngle;
  if (sweepAngle < 0) {
    s = e;
    e = startAngle;
  }
  let a = angle;
  while (a < s - 0.001) a += 2 * Math.PI;
  while (a >= s + 2 * Math.PI - 0.001) a -= 2 * Math.PI;
  return a <= e + 0.001;
}

/**
 * Calculates all mathematical geometric intersections between entities
 */
export function calculateIntersections(entities: CadEntity[]): Point2D[] {
  const intersections: Point2D[] = [];
  interface Segment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  interface ArcItem {
    cx: number;
    cy: number;
    r: number;
    sA: number;
    sw: number;
  }

  const segs: Segment[] = [];
  const arcs: ArcItem[] = [];

  for (const ent of entities) {
    if (ent.type === 'line' || ent.type === 'measure') {
      segs.push({ x1: ent.x1, y1: ent.y1, x2: ent.x2, y2: ent.y2 });
    } else if (ent.type === 'rect') {
      segs.push({ x1: ent.x, y1: ent.y, x2: ent.x + ent.w, y2: ent.y });
      segs.push({ x1: ent.x + ent.w, y1: ent.y, x2: ent.x + ent.w, y2: ent.y + ent.h });
      segs.push({ x1: ent.x + ent.w, y1: ent.y + ent.h, x2: ent.x, y2: ent.y + ent.h });
      segs.push({ x1: ent.x, y1: ent.y + ent.h, x2: ent.x, y2: ent.y });
    } else if (ent.type === 'polygon') {
      const pts = getEntityPolygonVertices(ent);
      for (let i = 0; i < pts.length; i++) {
        const pA = pts[i];
        const pB = pts[(i + 1) % pts.length];
        segs.push({ x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y });
      }
    } else if (ent.type === 'circle') {
      arcs.push({ cx: ent.cx, cy: ent.cy, r: ent.r, sA: 0, sw: 2 * Math.PI });
    } else if (ent.type === 'arc') {
      arcs.push({ cx: ent.cx, cy: ent.cy, r: ent.r, sA: ent.startAngle, sw: ent.sweepAngle });
    }
  }

  const pushPt = (x: number, y: number) => {
    if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
      // deduplicate close points
      const exists = intersections.some((p) => Math.hypot(p.x - x, p.y - y) < 0.1);
      if (!exists) intersections.push({ x, y });
    }
  };

  const inRange = (t: number) => t >= -0.001 && t <= 1.001;

  // Segment - Segment intersections
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const l1 = segs[i];
      const l2 = segs[j];
      const d = (l1.x1 - l1.x2) * (l2.y1 - l2.y2) - (l1.y1 - l1.y2) * (l2.x1 - l2.x2);
      if (Math.abs(d) < 0.00001) continue;
      const t = ((l1.x1 - l2.x1) * (l2.y1 - l2.y2) - (l1.y1 - l2.y1) * (l2.x1 - l2.x2)) / d;
      const u = -((l1.x1 - l1.x2) * (l1.y1 - l2.y1) - (l1.y1 - l1.y2) * (l1.x1 - l2.x1)) / d;
      if (inRange(t) && inRange(u)) {
        pushPt(l1.x1 + t * (l1.x2 - l1.x1), l1.y1 + t * (l1.y2 - l1.y1));
      }
    }
  }

  // Segment - Arc / Circle intersections
  for (let i = 0; i < segs.length; i++) {
    const l = segs[i];
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    for (let j = 0; j < arcs.length; j++) {
      const a = arcs[j];
      const A = dx * dx + dy * dy;
      const B = 2 * (dx * (l.x1 - a.cx) + dy * (l.y1 - a.cy));
      const C = (l.x1 - a.cx) * (l.x1 - a.cx) + (l.y1 - a.cy) * (l.y1 - a.cy) - a.r * a.r;
      const det = B * B - 4 * A * C;
      if (A <= 0.00001 || det < -0.0001) continue;
      const realDet = Math.max(0, det);
      const t1 = (-B + Math.sqrt(realDet)) / (2 * A);
      const t2 = (-B - Math.sqrt(realDet)) / (2 * A);
      if (inRange(t1)) {
        const px = l.x1 + t1 * dx;
        const py = l.y1 + t1 * dy;
        const ang = Math.atan2(py - a.cy, px - a.cx);
        if (isAngleInArc(ang, a.sA, a.sw)) pushPt(px, py);
      }
      if (det > 0.0001 && inRange(t2)) {
        const px = l.x1 + t2 * dx;
        const py = l.y1 + t2 * dy;
        const ang = Math.atan2(py - a.cy, px - a.cx);
        if (isAngleInArc(ang, a.sA, a.sw)) pushPt(px, py);
      }
    }
  }

  // Arc - Arc intersections
  for (let i = 0; i < arcs.length; i++) {
    for (let j = i + 1; j < arcs.length; j++) {
      const a1 = arcs[i];
      const a2 = arcs[j];
      const dx = a2.cx - a1.cx;
      const dy = a2.cy - a1.cy;
      const d = Math.hypot(dx, dy);
      if (d > a1.r + a2.r + 0.001 || d < Math.abs(a1.r - a2.r) - 0.001 || d === 0) continue;
      const a = (a1.r * a1.r - a2.r * a2.r + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(0, a1.r * a1.r - a * a));
      const px = a1.cx + (a * dx) / d;
      const py = a1.cy + (a * dy) / d;
      const rx = -dy * (h / d);
      const ry = dx * (h / d);

      const p1x = px + rx;
      const p1y = py + ry;
      const p2x = px - rx;
      const p2y = py - ry;

      const a1Angle1 = Math.atan2(p1y - a1.cy, p1x - a1.cx);
      const a2Angle1 = Math.atan2(p1y - a2.cy, p1x - a2.cx);
      if (isAngleInArc(a1Angle1, a1.sA, a1.sw) && isAngleInArc(a2Angle1, a2.sA, a2.sw)) {
        pushPt(p1x, p1y);
      }

      if (h > 0.001) {
        const a1Angle2 = Math.atan2(p2y - a1.cy, p2x - a1.cx);
        const a2Angle2 = Math.atan2(p2y - a2.cy, p2x - a2.cx);
        if (isAngleInArc(a1Angle2, a1.sA, a1.sw) && isAngleInArc(a2Angle2, a2.sA, a2.sw)) {
          pushPt(p2x, p2y);
        }
      }
    }
  }

  return intersections;
}

/**
 * Finds all candidate snap points (endpoints, midpoints, centers, intersections)
 */
export function findSnapPoint(
  mousePos: Point2D,
  entities: CadEntity[],
  intersections: Point2D[],
  tolerance = 4,
  gridSnap = false,
  gridPitch = 10
): SnapPoint | null {
  let bestPoint: SnapPoint | null = null;
  let minDistance = tolerance;

  // 1. Intersections (highest priority)
  for (const p of intersections) {
    const d = distance(mousePos, p);
    if (d < minDistance) {
      minDistance = d;
      bestPoint = { x: p.x, y: p.y, type: 'intersection', label: 'Intersección' };
    }
  }

  // 2. Element specific snaps
  for (const ent of entities) {
    if (ent.type === 'line' || ent.type === 'measure') {
      const d1 = distance(mousePos, { x: ent.x1, y: ent.y1 });
      if (d1 < minDistance) {
        minDistance = d1;
        bestPoint = { x: ent.x1, y: ent.y1, type: 'endpoint', label: 'Extremo' };
      }
      const d2 = distance(mousePos, { x: ent.x2, y: ent.y2 });
      if (d2 < minDistance) {
        minDistance = d2;
        bestPoint = { x: ent.x2, y: ent.y2, type: 'endpoint', label: 'Extremo' };
      }
      const mid = { x: (ent.x1 + ent.x2) / 2, y: (ent.y1 + ent.y2) / 2 };
      const dm = distance(mousePos, mid);
      if (dm < minDistance) {
        minDistance = dm;
        bestPoint = { x: mid.x, y: mid.y, type: 'midpoint', label: 'Punto Medio' };
      }
    } else if (ent.type === 'circle') {
      const dc = distance(mousePos, { x: ent.cx, y: ent.cy });
      if (dc < minDistance) {
        minDistance = dc;
        bestPoint = { x: ent.cx, y: ent.cy, type: 'center', label: 'Centro' };
      }
      // Quadrant points
      const quadrants = [
        { x: ent.cx + ent.r, y: ent.cy },
        { x: ent.cx - ent.r, y: ent.cy },
        { x: ent.cx, y: ent.cy + ent.r },
        { x: ent.cx, y: ent.cy - ent.r },
      ];
      for (const q of quadrants) {
        const dq = distance(mousePos, q);
        if (dq < minDistance) {
          minDistance = dq;
          bestPoint = { x: q.x, y: q.y, type: 'quadrant', label: 'Cuadrante' };
        }
      }
    } else if (ent.type === 'arc') {
      const dc = distance(mousePos, { x: ent.cx, y: ent.cy });
      if (dc < minDistance) {
        minDistance = dc;
        bestPoint = { x: ent.cx, y: ent.cy, type: 'center', label: 'Centro' };
      }
      const pStart = {
        x: ent.cx + ent.r * Math.cos(ent.startAngle),
        y: ent.cy + ent.r * Math.sin(ent.startAngle),
      };
      const pEnd = {
        x: ent.cx + ent.r * Math.cos(ent.startAngle + ent.sweepAngle),
        y: ent.cy + ent.r * Math.sin(ent.startAngle + ent.sweepAngle),
      };
      const dS = distance(mousePos, pStart);
      if (dS < minDistance) {
        minDistance = dS;
        bestPoint = { x: pStart.x, y: pStart.y, type: 'endpoint', label: 'Extremo de Arco' };
      }
      const dE = distance(mousePos, pEnd);
      if (dE < minDistance) {
        minDistance = dE;
        bestPoint = { x: pEnd.x, y: pEnd.y, type: 'endpoint', label: 'Extremo de Arco' };
      }
    } else if (ent.type === 'polygon') {
      const dc = distance(mousePos, { x: ent.cx, y: ent.cy });
      if (dc < minDistance) {
        minDistance = dc;
        bestPoint = { x: ent.cx, y: ent.cy, type: 'center', label: 'Centro' };
      }
      const vertices = getEntityPolygonVertices(ent);
      for (const v of vertices) {
        const dv = distance(mousePos, v);
        if (dv < minDistance) {
          minDistance = dv;
          bestPoint = { x: v.x, y: v.y, type: 'endpoint', label: 'Vértice' };
        }
      }
    } else if (ent.type === 'rect') {
      const corners = [
        { x: ent.x, y: ent.y },
        { x: ent.x + ent.w, y: ent.y },
        { x: ent.x + ent.w, y: ent.y + ent.h },
        { x: ent.x, y: ent.y + ent.h },
        { x: ent.x + ent.w / 2, y: ent.y + ent.h / 2 },
      ];
      for (const c of corners) {
        const dc = distance(mousePos, c);
        if (dc < minDistance) {
          minDistance = dc;
          bestPoint = { x: c.x, y: c.y, type: 'endpoint', label: 'Vértice' };
        }
      }
    } else if (ent.type === 'point' || ent.type === 'symbol') {
      const d = distance(mousePos, { x: ent.x, y: ent.y });
      if (d < minDistance) {
        minDistance = d;
        bestPoint = { x: ent.x, y: ent.y, type: 'endpoint', label: 'Punto' };
      }
    } else if (ent.type === 'curve') {
      for (const p of ent.points) {
        const d = distance(mousePos, p);
        if (d < minDistance) {
          minDistance = d;
          bestPoint = { x: p.x, y: p.y, type: 'endpoint', label: 'Nodo de Curva' };
        }
      }
    }
  }

  // 3. Grid snap fallback if enabled
  if (!bestPoint && gridSnap && gridPitch > 0) {
    const gx = Math.round(mousePos.x / gridPitch) * gridPitch;
    const gy = Math.round(mousePos.y / gridPitch) * gridPitch;
    const gd = Math.hypot(gx - mousePos.x, gy - mousePos.y);
    if (gd < tolerance * 1.2) {
      bestPoint = { x: gx, y: gy, type: 'grid', label: 'Rejilla' };
    }
  }

  return bestPoint;
}

/**
 * Normalizes dimension representation adhering to ISO 129 / UNE 1-039 standard
 */
export function calculateIsoDimension(
  p1: Point2D,
  p2: Point2D,
  offsetDir = 1,
  offsetDistance = 6,
  style: EntityStyle
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const mag = Math.hypot(dx, dy);
  let nx = 0;
  let ny = 0;
  if (mag > 0) {
    nx = -dy / mag;
    ny = dx / mag;
  }

  const off = offsetDistance * offsetDir;
  const ox1 = p1.x + nx * off;
  const oy1 = p1.y + ny * off;
  const ox2 = p2.x + nx * off;
  const oy2 = p2.y + ny * off;

  // Extension lines exceed the dimension line slightly by 2mm
  const extExceed = off > 0 ? off + 2 : off - 2;
  const ext1 = { x1: p1.x, y1: p1.y, x2: p1.x + nx * extExceed, y2: p1.y + ny * extExceed };
  const ext2 = { x1: p2.x, y1: p2.y, x2: p2.x + nx * extExceed, y2: p2.y + ny * extExceed };

  let textAng = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (textAng > 90 || textAng <= -90) {
    textAng += 180;
  }

  const midX = (ox1 + ox2) / 2;
  const midY = (oy1 + oy2) / 2;
  const fontSize = Math.max(3.5, style.width * 3.5);
  const textStr = `${mag.toFixed(1)} mm`;

  return {
    mag,
    dimLine: { x1: ox1, y1: oy1, x2: ox2, y2: oy2 },
    ext1,
    ext2,
    text: { x: midX, y: midY, angle: textAng, str: textStr, fontSize },
  };
}

/**
 * Hit test an entity with a specific tolerance in mm
 */
export function getHitEntity(pos: Point2D, entities: CadEntity[], tolerance = 5): CadEntity | null {
  let hit: CadEntity | null = null;
  let minDist = tolerance;

  for (const ent of entities) {
    let d = Infinity;
    if (ent.type === 'line' || ent.type === 'measure') {
      d = distPointToSegment(pos, { x: ent.x1, y: ent.y1 }, { x: ent.x2, y: ent.y2 }).dist;
    } else if (ent.type === 'rect') {
      const pts = [
        { x: ent.x, y: ent.y },
        { x: ent.x + ent.w, y: ent.y },
        { x: ent.x + ent.w, y: ent.y + ent.h },
        { x: ent.x, y: ent.y + ent.h },
      ];
      for (let i = 0; i < 4; i++) {
        const ds = distPointToSegment(pos, pts[i], pts[(i + 1) % 4]).dist;
        if (ds < d) d = ds;
      }
    } else if (ent.type === 'circle') {
      d = Math.abs(Math.hypot(ent.cx - pos.x, ent.cy - pos.y) - ent.r);
    } else if (ent.type === 'polygon') {
      const pts = getEntityPolygonVertices(ent);
      for (let i = 0; i < pts.length; i++) {
        const ds = distPointToSegment(pos, pts[i], pts[(i + 1) % pts.length]).dist;
        if (ds < d) d = ds;
      }
      // If the polygon has a fill, test if the pointer is inside the polygon
      if (
        ent.style?.fillColor &&
        ent.style.fillColor !== 'none' &&
        ent.style.fillColor !== 'transparent' &&
        isPointInPolygon(pos, pts)
      ) {
        d = 0;
      }
    } else if (ent.type === 'arc') {
      const distCenter = Math.hypot(ent.cx - pos.x, ent.cy - pos.y);
      const dRad = Math.abs(distCenter - ent.r);
      if (dRad <= minDist) {
        const aMouse = Math.atan2(pos.y - ent.cy, pos.x - ent.cx);
        if (isAngleInArc(aMouse, ent.startAngle, ent.sweepAngle)) {
          d = dRad;
        }
      }
    } else if (ent.type === 'point' || ent.type === 'tag' || ent.type === 'symbol') {
      d = Math.hypot(ent.x - pos.x, ent.y - pos.y);
    } else if (ent.type === 'curve') {
      for (let i = 0; i < ent.points.length - 1; i++) {
        const ds = distPointToSegment(pos, ent.points[i], ent.points[i + 1]).dist;
        if (ds < d) d = ds;
      }
      for (const p of ent.points) {
        const dp = Math.hypot(p.x - pos.x, p.y - pos.y);
        if (dp < d) d = dp;
      }
    } else if (ent.type === 'fill') {
      for (let i = 0; i < ent.points.length; i++) {
        const ds = distPointToSegment(pos, ent.points[i], ent.points[(i + 1) % ent.points.length]).dist;
        if (ds < d) d = ds;
      }
    } else if (ent.type === 'image') {
      if (pos.x >= ent.x && pos.x <= ent.x + ent.width && pos.y >= ent.y && pos.y <= ent.y + ent.height) {
        d = 0;
      }
    } else if (ent.type === 'text') {
      const h = ent.h || 20;
      if (pos.x >= ent.x && pos.x <= ent.x + ent.w && pos.y >= ent.y && pos.y <= ent.y + h) {
        d = 0;
      }
    }

    if (d <= minDist) {
      minDist = d;
      hit = ent;
    }
  }

  return hit;
}

/**
 * Calculates Mediatriz (perpendicular bisector) with educational compass arcs
 */
export function calculateMediatriz(
  p1: Point2D,
  p2: Point2D,
  withArcs = true,
  lengthMultiplier = 1.4
): { line: { x1: number; y1: number; x2: number; y2: number }; arcs: { cx: number; cy: number; r: number; startAngle: number; sweepAngle: number }[] } {
  const d = distance(p1, p2);
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let nx = 0;
  let ny = 0;
  if (d > 0) {
    nx = -dy / d;
    ny = dx / d;
  }
  const span = Math.max(25, (d * lengthMultiplier) / 2);
  const line = {
    x1: midX - nx * span,
    y1: midY - ny * span,
    x2: midX + nx * span,
    y2: midY + ny * span,
  };

  const arcs: { cx: number; cy: number; r: number; startAngle: number; sweepAngle: number }[] = [];
  if (withArcs && d > 1) {
    // Radius slightly larger than half distance (e.g. 0.65 * d)
    const r = d * 0.65;
    const baseAngle1 = Math.atan2(dy, dx);
    const baseAngle2 = Math.atan2(-dy, -dx);
    // Upper and lower intersecting arc segments from p1 and p2
    arcs.push({ cx: p1.x, cy: p1.y, r, startAngle: baseAngle1 + 0.6, sweepAngle: 0.6 });
    arcs.push({ cx: p1.x, cy: p1.y, r, startAngle: baseAngle1 - 1.2, sweepAngle: 0.6 });
    arcs.push({ cx: p2.x, cy: p2.y, r, startAngle: baseAngle2 + 0.6, sweepAngle: 0.6 });
    arcs.push({ cx: p2.x, cy: p2.y, r, startAngle: baseAngle2 - 1.2, sweepAngle: 0.6 });
  }

  return { line, arcs };
}

/**
 * Calculates Bisectriz of an angle formed by 3 points: pA - pVertex - pB
 */
export function calculateBisectriz(
  pA: Point2D,
  pV: Point2D,
  pB: Point2D,
  withArcs = true,
  rayLength = 80
): { ray: { x1: number; y1: number; x2: number; y2: number }; arcs: { cx: number; cy: number; r: number; startAngle: number; sweepAngle: number }[] } {
  const dVA = distance(pV, pA);
  const dVB = distance(pV, pB);
  const uAx = dVA > 0 ? (pA.x - pV.x) / dVA : 1;
  const uAy = dVA > 0 ? (pA.y - pV.y) / dVA : 0;
  const uBx = dVB > 0 ? (pB.x - pV.x) / dVB : 0;
  const uBy = dVB > 0 ? (pB.y - pV.y) / dVB : 1;

  // Normalized bisector vector = normalized(uA + uB)
  let bx = uAx + uBx;
  let by = uAy + uBy;
  const bMag = Math.hypot(bx, by);
  if (bMag > 0) {
    bx /= bMag;
    by /= bMag;
  } else {
    // 180 degrees case: perpendicular to uA
    bx = -uAy;
    by = uAx;
  }

  const ray = {
    x1: pV.x,
    y1: pV.y,
    x2: pV.x + bx * rayLength,
    y2: pV.y + by * rayLength,
  };

  const arcs: { cx: number; cy: number; r: number; startAngle: number; sweepAngle: number }[] = [];
  if (withArcs) {
    const r1 = Math.min(25, Math.max(10, Math.min(dVA, dVB) * 0.5));
    const angA = Math.atan2(uAy, uAx);
    const angB = Math.atan2(uBy, uBx);
    let diff = angB - angA;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    // Main arc across both arms from pV
    arcs.push({ cx: pV.x, cy: pV.y, r: r1, startAngle: angA, sweepAngle: diff });

    // Cutting points on both arms
    const pCutA = { x: pV.x + uAx * r1, y: pV.y + uAy * r1 };
    const pCutB = { x: pV.x + uBx * r1, y: pV.y + uBy * r1 };
    const r2 = r1 * 1.1;
    const bAngle = Math.atan2(by, bx);
    arcs.push({ cx: pCutA.x, cy: pCutA.y, r: r2, startAngle: bAngle - 0.35, sweepAngle: 0.7 });
    arcs.push({ cx: pCutB.x, cy: pCutB.y, r: r2, startAngle: bAngle - 0.35, sweepAngle: 0.7 });
  }

  return { ray, arcs };
}

/**
 * Divides a segment into N equal parts using Thales Theorem
 */
export function calculateThales(
  p1: Point2D,
  p2: Point2D,
  divisions = 5
): {
  pointsOnSegment: Point2D[];
  obliquePoints: Point2D[];
  parallels: { x1: number; y1: number; x2: number; y2: number }[];
} {
  const pointsOnSegment: Point2D[] = [];
  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    pointsOnSegment.push({
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    });
  }

  // Construct oblique ray at 30 degrees to the segment
  const baseAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const obliqueAngle = baseAngle - Math.PI / 6;
  const stepLen = 12; // 12mm per step on oblique ray
  const obliquePoints: Point2D[] = [];
  for (let i = 0; i <= divisions; i++) {
    obliquePoints.push({
      x: p1.x + i * stepLen * Math.cos(obliqueAngle),
      y: p1.y + i * stepLen * Math.sin(obliqueAngle),
    });
  }

  // Projection parallels connecting oblique ray points to segment points
  const parallels: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i <= divisions; i++) {
    parallels.push({
      x1: obliquePoints[i].x,
      y1: obliquePoints[i].y,
      x2: pointsOnSegment[i].x,
      y2: pointsOnSegment[i].y,
    });
  }

  return { pointsOnSegment, obliquePoints, parallels };
}

/**
 * Exports drawing to AutoCAD standard DXF format (ASCII R12)
 */
export function generateDxfString(sheet: { w: number; h: number }, entities: CadEntity[]): string {
  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$EXTMIN\n10\n0.0\n20\n0.0\n9\n$EXTMAX\n10\n${sheet.w.toFixed(2)}\n20\n${sheet.h.toFixed(2)}\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  for (const ent of entities) {
    const layer = ent.layer || 'SOLUCION';
    // DXF Y coordinates run upwards, SVG runs downwards
    const flipY = (y: number) => (sheet.h - y).toFixed(3);

    if (ent.type === 'line' || ent.type === 'measure') {
      dxf += `0\nLINE\n8\n${layer}\n10\n${ent.x1.toFixed(3)}\n20\n${flipY(ent.y1)}\n11\n${ent.x2.toFixed(3)}\n21\n${flipY(ent.y2)}\n`;
    } else if (ent.type === 'circle') {
      dxf += `0\nCIRCLE\n8\n${layer}\n10\n${ent.cx.toFixed(3)}\n20\n${flipY(ent.cy)}\n40\n${ent.r.toFixed(3)}\n`;
    } else if (ent.type === 'arc') {
      // In DXF angles are in degrees counter-clockwise from positive X
      const sDeg = ((-ent.startAngle * 180) / Math.PI + 360) % 360;
      const eDeg = ((-(ent.startAngle + ent.sweepAngle) * 180) / Math.PI + 360) % 360;
      dxf += `0\nARC\n8\n${layer}\n10\n${ent.cx.toFixed(3)}\n20\n${flipY(ent.cy)}\n40\n${ent.r.toFixed(3)}\n50\n${Math.min(sDeg, eDeg).toFixed(2)}\n51\n${Math.max(sDeg, eDeg).toFixed(2)}\n`;
    } else if (ent.type === 'point') {
      dxf += `0\nPOINT\n8\n${layer}\n10\n${ent.x.toFixed(3)}\n20\n${flipY(ent.y)}\n`;
    } else if (ent.type === 'tag') {
      dxf += `0\nTEXT\n8\n${layer}\n10\n${ent.x.toFixed(3)}\n20\n${flipY(ent.y)}\n40\n${(ent.fontSize || 3.5).toFixed(2)}\n1\n${ent.text}\n`;
    } else if (ent.type === 'polygon') {
      const pts = getEntityPolygonVertices(ent);
      for (let i = 0; i < pts.length; i++) {
        const pA = pts[i];
        const pB = pts[(i + 1) % pts.length];
        dxf += `0\nLINE\n8\n${layer}\n10\n${pA.x.toFixed(3)}\n20\n${flipY(pA.y)}\n11\n${pB.x.toFixed(3)}\n21\n${flipY(pB.y)}\n`;
      }
    } else if (ent.type === 'ellipse') {
      const rotRad = (ent.rotation * Math.PI) / 180;
      dxf += `0\nELLIPSE\n8\n${layer}\n10\n${ent.cx.toFixed(3)}\n20\n${flipY(ent.cy)}\n11\n${(ent.rx * Math.cos(rotRad)).toFixed(3)}\n21\n${(-ent.rx * Math.sin(rotRad)).toFixed(3)}\n40\n${(ent.ry / ent.rx).toFixed(4)}\n41\n0.0\n42\n${(Math.PI * 2).toFixed(4)}\n`;
    }
  }

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

/**
 * Snaps a 2D point to the nearest node on an isometric triangular/rhombic lattice (30º / 150º)
 */
export function snapToIsometricGrid(pt: Point2D, pitch: number): Point2D {
  if (pitch <= 0) return pt;
  const cos30 = Math.cos(Math.PI / 6); // sqrt(3)/2 ≈ 0.866025
  const sin30 = 0.5;

  const u = pt.x / (pitch * cos30);
  const v = pt.y / (pitch * sin30);

  const i = Math.round((v + u) / 2);
  const j = Math.round((v - u) / 2);

  return {
    x: Math.round(((i - j) * pitch * cos30) * 100) / 100,
    y: Math.round(((i + j) * pitch * sin30) * 100) / 100,
  };
}

/**
 * Snaps a 2D point to a Cavalier axonometric grid (X horizontal, Z vertical, Y at 135º with factor k)
 */
export function snapToCavalierGrid(pt: Point2D, pitch: number, k: number = 0.5): Point2D {
  if (pitch <= 0) return pt;
  const angle = Math.PI / 4;
  const dyK = pitch * k * Math.sin(angle);
  const dxK = pitch * k * Math.cos(angle);
  const snappedX = Math.round(pt.x / pitch) * pitch;
  const snappedY = Math.round(pt.y / pitch) * pitch;
  return { x: snappedX, y: snappedY };
}

/**
 * Snaps point P2 to the nearest isometric axis passing through P1 based on the active Isoplane
 */
export function projectToIsoplane(p1: Point2D, p2: Point2D, isoplane: Isoplane): Point2D {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return p2;

  let candidateAngles: number[] = [];
  if (isoplane === 'top') {
    candidateAngles = [
      Math.PI / 6,
      (5 * Math.PI) / 6,
      -(Math.PI / 6),
      -((5 * Math.PI) / 6),
    ];
  } else if (isoplane === 'left') {
    candidateAngles = [
      Math.PI / 2,
      -Math.PI / 2,
      (5 * Math.PI) / 6,
      -(Math.PI / 6),
    ];
  } else {
    candidateAngles = [
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI / 6,
      -((5 * Math.PI) / 6),
    ];
  }

  const currentAngle = Math.atan2(dy, dx);
  let bestAngle = candidateAngles[0];
  let minDiff = Infinity;
  for (const ang of candidateAngles) {
    let diff = Math.abs(currentAngle - ang);
    while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
    if (diff < minDiff) {
      minDiff = diff;
      bestAngle = ang;
    }
  }

  return {
    x: Math.round((p1.x + dist * Math.cos(bestAngle)) * 100) / 100,
    y: Math.round((p1.y + dist * Math.sin(bestAngle)) * 100) / 100,
  };
}

/**
 * Computes isometric circle parameters (ellipse rx, ry, rotation) for standard ISO axonometry
 */
export function calculateIsocircle(
  center: Point2D,
  radius: number,
  isoplane: Isoplane
): { rx: number; ry: number; rotation: number } {
  const isRatio = 1 / Math.sqrt(3); // ≈ 0.57735
  const rx = radius;
  const ry = Math.round(radius * isRatio * 100) / 100;

  let rotation = 0;
  if (isoplane === 'top') {
    rotation = 0;
  } else if (isoplane === 'left') {
    rotation = 120;
  } else if (isoplane === 'right') {
    rotation = 60;
  }

  return { rx, ry, rotation };
}

let _geomGlobalId = 0;
export function generateUniqueEntityId(): number {
  return Date.now() * 1000 + (_geomGlobalId++ % 1000);
}

/**
 * Creates the 12 edges of an Isometric Box / Bounding Prism
 */
export function createIsometricBox(
  origin: Point2D,
  dimX: number,
  dimY: number,
  dimZ: number,
  visibleStyle: EntityStyle,
  hiddenStyle: EntityStyle,
  layerName: string = 'SOLUCION'
): LineEntity[] {
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);

  // SVG coordinate directions:
  // Vector X (+30º up-right in isometric screen): dx = cos30, dy = -sin30
  // Vector Y (+150º up-left in isometric screen): dx = -cos30, dy = -sin30
  // Vector Z (vertical upwards): dx = 0, dy = -1.0
  const vX = { x: dimX * cos30, y: -dimX * sin30 };
  const vY = { x: -dimY * cos30, y: -dimY * sin30 };
  const vZ = { x: 0, y: -dimZ };

  const p0 = { x: origin.x, y: origin.y };
  const p1 = { x: p0.x + vX.x, y: p0.y + vX.y };
  const p2 = { x: p1.x + vY.x, y: p1.y + vY.y };
  const p3 = { x: p0.x + vY.x, y: p0.y + vY.y };

  const p4 = { x: p0.x + vZ.x, y: p0.y + vZ.y };
  const p5 = { x: p1.x + vZ.x, y: p1.y + vZ.y };
  const p6 = { x: p2.x + vZ.x, y: p2.y + vZ.y };
  const p7 = { x: p3.x + vZ.x, y: p3.y + vZ.y };

  const mkLine = (a: Point2D, b: Point2D, isHidden: boolean): LineEntity => ({
    id: generateUniqueEntityId(),
    type: 'line',
    x1: Math.round(a.x * 100) / 100,
    y1: Math.round(a.y * 100) / 100,
    x2: Math.round(b.x * 100) / 100,
    y2: Math.round(b.y * 100) / 100,
    style: isHidden ? hiddenStyle : visibleStyle,
    layer: layerName,
  });

  return [
    mkLine(p0, p1, false),
    mkLine(p0, p3, false),
    mkLine(p0, p4, false),
    mkLine(p1, p5, false),
    mkLine(p3, p7, false),
    mkLine(p4, p5, false),
    mkLine(p5, p6, false),
    mkLine(p6, p7, false),
    mkLine(p7, p4, false),
    mkLine(p1, p2, true),
    mkLine(p3, p2, true),
    mkLine(p2, p6, true),
  ];
}

export type AxonometricSystem = 'isometric' | 'cavalier' | 'military';

export interface DiedricoConfig {
  views?: {
    alzado?: boolean;
    planta?: boolean;
    perfilIzq?: boolean;
    perfilDer?: boolean;
    groundLine?: boolean;
  };
  axonometricSystem?: AxonometricSystem;
  includePrism?: boolean;
}

/**
 * Creates 12 edges of a Cavalier Projection Box (Front X-Z true shape, Y at 135º with 0.5 reduction)
 */
export function createCavalierBox(
  origin: Point2D,
  dimX: number,
  dimY: number,
  dimZ: number,
  visibleStyle: EntityStyle,
  hiddenStyle: EntityStyle,
  layerName: string = 'SOLUCION'
): LineEntity[] {
  const red = 0.5;
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const vX = { x: dimX, y: 0 };
  const vY = { x: -dimY * red * cos45, y: -dimY * red * sin45 };
  const vZ = { x: 0, y: -dimZ };

  const p0 = { x: origin.x, y: origin.y };
  const p1 = { x: p0.x + vX.x, y: p0.y + vX.y };
  const p2 = { x: p1.x + vY.x, y: p1.y + vY.y };
  const p3 = { x: p0.x + vY.x, y: p0.y + vY.y };

  const p4 = { x: p0.x + vZ.x, y: p0.y + vZ.y };
  const p5 = { x: p1.x + vZ.x, y: p1.y + vZ.y };
  const p6 = { x: p2.x + vZ.x, y: p2.y + vZ.y };
  const p7 = { x: p3.x + vZ.x, y: p3.y + vZ.y };

  const mkLine = (a: Point2D, b: Point2D, isHidden: boolean): LineEntity => ({
    id: generateUniqueEntityId(),
    type: 'line',
    x1: Math.round(a.x * 100) / 100,
    y1: Math.round(a.y * 100) / 100,
    x2: Math.round(b.x * 100) / 100,
    y2: Math.round(b.y * 100) / 100,
    style: isHidden ? hiddenStyle : visibleStyle,
    layer: layerName,
  });

  return [
    mkLine(p0, p1, false),
    mkLine(p0, p4, false),
    mkLine(p1, p5, false),
    mkLine(p4, p5, false),
    mkLine(p4, p7, false),
    mkLine(p5, p6, false),
    mkLine(p6, p7, false),
    mkLine(p1, p2, false),
    mkLine(p2, p6, false),
    mkLine(p0, p3, true),
    mkLine(p3, p2, true),
    mkLine(p3, p7, true),
  ];
}

/**
 * Creates 12 edges of a Military (Planometric) Box (Horizontal ground plane undistorted at 30º/60º, Z vertical 1:1)
 */
export function createMilitaryBox(
  origin: Point2D,
  dimX: number,
  dimY: number,
  dimZ: number,
  visibleStyle: EntityStyle,
  hiddenStyle: EntityStyle,
  layerName: string = 'SOLUCION'
): LineEntity[] {
  const cos30 = Math.cos(Math.PI / 6);
  const sin30 = Math.sin(Math.PI / 6);
  const cos60 = Math.cos(Math.PI / 3);
  const sin60 = Math.sin(Math.PI / 3);

  const vX = { x: dimX * cos30, y: -dimX * sin30 };
  const vY = { x: -dimY * cos60, y: -dimY * sin60 };
  const vZ = { x: 0, y: -dimZ };

  const p0 = { x: origin.x, y: origin.y };
  const p1 = { x: p0.x + vX.x, y: p0.y + vX.y };
  const p2 = { x: p1.x + vY.x, y: p1.y + vY.y };
  const p3 = { x: p0.x + vY.x, y: p0.y + vY.y };

  const p4 = { x: p0.x + vZ.x, y: p0.y + vZ.y };
  const p5 = { x: p1.x + vZ.x, y: p1.y + vZ.y };
  const p6 = { x: p2.x + vZ.x, y: p2.y + vZ.y };
  const p7 = { x: p3.x + vZ.x, y: p3.y + vZ.y };

  const mkLine = (a: Point2D, b: Point2D, isHidden: boolean): LineEntity => ({
    id: generateUniqueEntityId(),
    type: 'line',
    x1: Math.round(a.x * 100) / 100,
    y1: Math.round(a.y * 100) / 100,
    x2: Math.round(b.x * 100) / 100,
    y2: Math.round(b.y * 100) / 100,
    style: isHidden ? hiddenStyle : visibleStyle,
    layer: layerName,
  });

  return [
    mkLine(p0, p1, false),
    mkLine(p0, p3, false),
    mkLine(p0, p4, false),
    mkLine(p1, p5, false),
    mkLine(p3, p7, false),
    mkLine(p4, p5, false),
    mkLine(p5, p6, false),
    mkLine(p6, p7, false),
    mkLine(p7, p4, false),
    mkLine(p1, p2, true),
    mkLine(p3, p2, true),
    mkLine(p2, p6, true),
  ];
}

/**
 * Creates standardized European Dihedral Projection Sheet Template (UNE-EN ISO 5456-2)
 * with customizable views (Alzado, Planta, Perfiles) and 3D axonometric system (Isométrica, Caballera, Militar)
 */
export function createDiedricoTemplate(
  sheet: SheetSize,
  mainStyle: EntityStyle,
  auxStyle: EntityStyle,
  config?: DiedricoConfig
): CadEntity[] {
  const entities: CadEntity[] = [];

  const midX = sheet.w / 2;
  const midY = sheet.h / 2;

  const views = config?.views || {
    alzado: true,
    planta: true,
    perfilIzq: true,
    perfilDer: false,
    groundLine: true,
  };
  const axonSystem: AxonometricSystem = config?.axonometricSystem || 'isometric';
  const includePrism = config?.includePrism ?? false;

  // 1. Central separator line between 2D views and 3D projection
  entities.push({
    id: generateUniqueEntityId(),
    type: 'line',
    x1: midX,
    y1: 15,
    x2: midX,
    y2: sheet.h - 15,
    style: { ...auxStyle, dash: '10,2,2,2', color: '#64748b', width: 0.25 },
    layer: 'EJES',
  });

  const ltY = midY;
  const vertAxisX = (25 + midX - 15) / 2;

  // Labels for Dihedral Views:
  const mkTag = (text: string, x: number, y: number, fontSize: number = 3.2): TagEntity => ({
    id: generateUniqueEntityId(),
    type: 'tag',
    text,
    x,
    y,
    angle: 0,
    fontSize,
    style: { width: 0.35, color: '#2563eb', dash: 'none', marker: 'none' },
    layer: 'TEXTO',
  });

  // 2. Dihedral Projection Frame (Left side):
  if (views.groundLine !== false) {
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: 25,
      y1: ltY,
      x2: midX - 15,
      y2: ltY,
      style: { ...mainStyle, width: 0.5, color: '#0f172a' },
      layer: 'EJES',
    });

    // Ground line marks (rayitas indicadoras de LT)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: 26,
      y1: ltY,
      x2: 26,
      y2: ltY + 3,
      style: { ...mainStyle, width: 0.35, color: '#0f172a' },
      layer: 'EJES',
    });
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: midX - 16,
      y1: ltY,
      x2: midX - 16,
      y2: ltY + 3,
      style: { ...mainStyle, width: 0.35, color: '#0f172a' },
      layer: 'EJES',
    });

    // Vertical axis of projection
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: vertAxisX,
      y1: 25,
      x2: vertAxisX,
      y2: sheet.h - 25,
      style: { ...auxStyle, dash: '10,2,2,2', color: '#94a3b8', width: 0.25 },
      layer: 'EJES',
    });

    entities.push(mkTag('LÍNEA DE TIERRA (LT)', 28, ltY - 2, 2.5));
  }

  if (views.alzado !== false) {
    entities.push(mkTag('ALZADO (VISTA FRONTAL)', 30, 28, 3.2));
  }
  if (views.planta !== false) {
    entities.push(mkTag('PLANTA (VISTA SUPERIOR)', 30, ltY + 10, 3.2));
  }
  if (views.perfilIzq !== false) {
    entities.push(mkTag('PERFIL IZQUIERDO', vertAxisX + 10, 28, 3.2));
  }
  if (views.perfilDer) {
    entities.push(mkTag('PERFIL DERECHO', 30, 28, 3.2));
  }

  // 3. Right side: Axonometric System Tripod & 3D Figure
  const axonCenterX = midX + (sheet.w - midX) / 2;
  const axonCenterY = midY + 15;
  const axisLen = Math.min(sheet.w, sheet.h) * 0.28;

  if (axonSystem === 'cavalier') {
    // Caballera: X horizontal (0º), Z vertical (90º), Y receding at 135º
    const cos45 = Math.cos(Math.PI / 4);
    const sin45 = Math.sin(Math.PI / 4);

    // Z Axis
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX,
      y2: axonCenterY - axisLen,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });
    // X Axis
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX + axisLen,
      y2: axonCenterY,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });
    // Y Axis (135º receding with 0.5 reduction mark)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX - axisLen * 0.5 * cos45,
      y2: axonCenterY - axisLen * 0.5 * sin45,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });

    entities.push(mkTag('Z (+90º)', axonCenterX + 3, axonCenterY - axisLen + 4, 3.0));
    entities.push(mkTag('X (0º - Escala 1:1)', axonCenterX + axisLen + 3, axonCenterY - 1, 3.0));
    entities.push(mkTag('Y (135º - Reducción 1/2)', axonCenterX - axisLen * 0.5 * cos45 - 24, axonCenterY - axisLen * 0.5 * sin45 - 2, 2.8));
    entities.push(mkTag('PERSPECTIVA CABALLERA (45º / Red. 1/2)', midX + 15, 28, 3.2));

    if (includePrism) {
      const prism = createCavalierBox(
        { x: axonCenterX, y: axonCenterY },
        axisLen * 0.55,
        axisLen * 0.55,
        axisLen * 0.55,
        { ...mainStyle, width: 0.5 },
        { ...auxStyle, width: 0.25, dash: '3,3', color: '#94a3b8' }
      );
      entities.push(...prism);
    }
  } else if (axonSystem === 'military') {
    // Axonométrica Militar: Plan plane (X at 30º, Y at 120º - forming 90º true angle), Z vertical (1:1)
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);
    const cos60 = Math.cos(Math.PI / 3);
    const sin60 = Math.sin(Math.PI / 3);

    // Z Axis
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX,
      y2: axonCenterY - axisLen,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });
    // X Axis
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX + axisLen * cos30,
      y2: axonCenterY - axisLen * sin30,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });
    // Y Axis (at 120º, perpendicular to X)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX - axisLen * cos60,
      y2: axonCenterY - axisLen * sin60,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });

    entities.push(mkTag('Z (Vertical 1:1)', axonCenterX + 3, axonCenterY - axisLen + 4, 3.0));
    entities.push(mkTag('X (+30º)', axonCenterX + axisLen * cos30 + 3, axonCenterY - axisLen * sin30, 3.0));
    entities.push(mkTag('Y (120º)', axonCenterX - axisLen * cos60 - 15, axonCenterY - axisLen * sin60, 3.0));
    entities.push(mkTag('PERSPECTIVA MILITAR (Planta 90º)', midX + 15, 28, 3.2));

    if (includePrism) {
      const prism = createMilitaryBox(
        { x: axonCenterX, y: axonCenterY },
        axisLen * 0.55,
        axisLen * 0.55,
        axisLen * 0.55,
        { ...mainStyle, width: 0.5 },
        { ...auxStyle, width: 0.25, dash: '3,3', color: '#94a3b8' }
      );
      entities.push(...prism);
    }
  } else {
    // Isométrica (120º)
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    // Z Axis (vertical upwards)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX,
      y2: axonCenterY - axisLen,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });

    // X Axis (at 30º)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX + axisLen * cos30,
      y2: axonCenterY + axisLen * sin30,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });

    // Y Axis (at 150º)
    entities.push({
      id: generateUniqueEntityId(),
      type: 'line',
      x1: axonCenterX,
      y1: axonCenterY,
      x2: axonCenterX - axisLen * cos30,
      y2: axonCenterY + axisLen * sin30,
      style: { ...auxStyle, width: 0.35, color: '#0284c7', marker: 'arrow' },
      layer: 'EJES',
    });

    entities.push(mkTag('Z (+90º)', axonCenterX + 3, axonCenterY - axisLen + 4, 3.0));
    entities.push(mkTag('X (+30º)', axonCenterX + axisLen * cos30 + 3, axonCenterY + axisLen * sin30 + 3, 3.0));
    entities.push(mkTag('Y (150º)', axonCenterX - axisLen * cos30 - 18, axonCenterY + axisLen * sin30 + 3, 3.0));
    entities.push(mkTag('PERSPECTIVA ISOMÉTRICA (120º)', midX + 15, 28, 3.2));

    if (includePrism) {
      const prism = createIsometricBox(
        { x: axonCenterX, y: axonCenterY },
        axisLen * 0.55,
        axisLen * 0.55,
        axisLen * 0.55,
        { ...mainStyle, width: 0.5 },
        { ...auxStyle, width: 0.25, dash: '3,3', color: '#94a3b8' }
      );
      entities.push(...prism);
    }
  }

  return entities;
}

/**
 * Returns the bounding box of any CAD entity
 */
export function getEntityBoundingBox(ent: CadEntity): { minX: number; maxX: number; minY: number; maxY: number } {
  switch (ent.type) {
    case 'line':
    case 'measure': {
      return {
        minX: Math.min(ent.x1, ent.x2),
        maxX: Math.max(ent.x1, ent.x2),
        minY: Math.min(ent.y1, ent.y2),
        maxY: Math.max(ent.y1, ent.y2),
      };
    }
    case 'circle': {
      return {
        minX: ent.cx - ent.r,
        maxX: ent.cx + ent.r,
        minY: ent.cy - ent.r,
        maxY: ent.cy + ent.r,
      };
    }
    case 'arc': {
      // Conservative bounding box
      return {
        minX: ent.cx - ent.r,
        maxX: ent.cx + ent.r,
        minY: ent.cy - ent.r,
        maxY: ent.cy + ent.r,
      };
    }
    case 'polygon': {
      const vertices = getEntityPolygonVertices(ent);
      if (vertices.length === 0) {
        return { minX: ent.cx, maxX: ent.cx, minY: ent.cy, maxY: ent.cy };
      }
      const xs = vertices.map((v) => v.x);
      const ys = vertices.map((v) => v.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    }
    case 'rect': {
      return {
        minX: Math.min(ent.x, ent.x + ent.w),
        maxX: Math.max(ent.x, ent.x + ent.w),
        minY: Math.min(ent.y, ent.y + ent.h),
        maxY: Math.max(ent.y, ent.y + ent.h),
      };
    }
    case 'point':
    case 'symbol': {
      const pad = 2;
      return { minX: ent.x - pad, maxX: ent.x + pad, minY: ent.y - pad, maxY: ent.y + pad };
    }
    case 'tag': {
      const w = (ent.text?.length || 2) * (ent.fontSize || 3) * 0.7;
      const h = ent.fontSize || 3;
      return { minX: ent.x, maxX: ent.x + w, minY: ent.y - h, maxY: ent.y };
    }
    case 'text': {
      const w = ent.w || 30;
      const h = ent.h || 15;
      return { minX: ent.x, maxX: ent.x + w, minY: ent.y, maxY: ent.y + h };
    }
    case 'curve': {
      if (!ent.points || ent.points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
      const xs = ent.points.map((p) => p.x);
      const ys = ent.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    }
    default: {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
  }
}

/**
 * Standard CAD Window Selection (Arrastre Izquierda -> Derecha):
 * Entity must be 100% COMPLETELY enclosed inside the box
 */
export function isEntityInsideBox(
  ent: CadEntity,
  box: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  const b = getEntityBoundingBox(ent);
  return b.minX >= box.minX && b.maxX <= box.maxX && b.minY >= box.minY && b.maxY <= box.maxY;
}

function lineIntersectsLine(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) return false;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Standard CAD Crossing Selection (Arrastre Derecha -> Izquierda):
 * Entity is selected if it is inside OR crosses any border of the box
 */
export function isEntityCrossingBox(
  ent: CadEntity,
  box: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  const b = getEntityBoundingBox(ent);
  // If bounding boxes do not overlap at all, cannot cross
  if (b.maxX < box.minX || b.minX > box.maxX || b.maxY < box.minY || b.minY > box.maxY) {
    return false;
  }
  // If completely inside, it's selected
  if (b.minX >= box.minX && b.maxX <= box.maxX && b.minY >= box.minY && b.maxY <= box.maxY) {
    return true;
  }

  // Box 4 perimeter segments
  const tl = { x: box.minX, y: box.minY };
  const tr = { x: box.maxX, y: box.minY };
  const br = { x: box.maxX, y: box.maxY };
  const bl = { x: box.minX, y: box.maxY };
  const boxEdges: [Point2D, Point2D][] = [
    [tl, tr],
    [tr, br],
    [br, bl],
    [bl, tl],
  ];

  if (ent.type === 'line' || ent.type === 'measure') {
    const s1 = { x: ent.x1, y: ent.y1 };
    const s2 = { x: ent.x2, y: ent.y2 };
    // Check if either endpoint is inside
    if (
      (s1.x >= box.minX && s1.x <= box.maxX && s1.y >= box.minY && s1.y <= box.maxY) ||
      (s2.x >= box.minX && s2.x <= box.maxX && s2.y >= box.minY && s2.y <= box.maxY)
    ) {
      return true;
    }
    // Check if segment crosses any box edge
    return boxEdges.some(([e1, e2]) => lineIntersectsLine(s1, s2, e1, e2));
  }

  if (ent.type === 'polygon') {
    const verts = getEntityPolygonVertices(ent);
    if (verts.length === 0) return false;
    // Any vertex inside
    if (verts.some((v) => v.x >= box.minX && v.x <= box.maxX && v.y >= box.minY && v.y <= box.maxY)) {
      return true;
    }
    // Any polygon edge crosses box edge
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i];
      const v2 = verts[(i + 1) % verts.length];
      if (boxEdges.some(([e1, e2]) => lineIntersectsLine(v1, v2, e1, e2))) {
        return true;
      }
    }
    // Box corner inside polygon
    if (isPointInPolygon(tl, verts) || isPointInPolygon(tr, verts)) {
      return true;
    }
    return false;
  }

  if (ent.type === 'circle') {
    // Center inside
    if (ent.cx >= box.minX && ent.cx <= box.maxX && ent.cy >= box.minY && ent.cy <= box.maxY) {
      return true;
    }
    // Any box edge intersects circle
    return boxEdges.some(([e1, e2]) => distPointToSegment({ x: ent.cx, y: ent.cy }, e1, e2).dist <= ent.r);
  }

  // For rect, text, point, symbol: standard bounding box overlap is true
  return true;
}

/**
 * CAD Purge: Cleans degenerate entities (length 0 lines, 0 radius circles, empty text)
 */
export function purgeEntities(entities: CadEntity[]): {
  cleaned: CadEntity[];
  removedCount: number;
  details: string;
} {
  const initialCount = entities.length;
  const seenPoints = new Set<string>();

  const cleaned = entities.filter((ent) => {
    if (ent.type === 'line' || ent.type === 'measure') {
      const len = Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
      return len >= 0.1; // remove zero-length lines
    }
    if (ent.type === 'circle' || ent.type === 'arc') {
      return ent.r >= 0.1;
    }
    if (ent.type === 'polygon') {
      if (ent.points && ent.points.length < 3) return false;
      if (!ent.points && (ent.sides < 3 || ent.r < 0.1)) return false;
      return true;
    }
    if (ent.type === 'rect') {
      return Math.abs(ent.w) >= 0.1 && Math.abs(ent.h) >= 0.1;
    }
    if (ent.type === 'point') {
      const key = `${Math.round(ent.x * 100) / 100},${Math.round(ent.y * 100) / 100},${ent.layer || ''}`;
      if (seenPoints.has(key)) return false; // remove duplicate points
      seenPoints.add(key);
      return true;
    }
    if (ent.type === 'text') {
      const plain = (ent.text || ent.textHtml || '').replace(/<[^>]+>/g, '').trim();
      return plain.length > 0;
    }
    return true;
  });

  const removedCount = initialCount - cleaned.length;
  const details =
    removedCount > 0
      ? `Lámina purgada: se eliminaron ${removedCount} elemento(s) nulo(s) o duplicado(s).`
      : 'La lámina ya está limpia: no se encontraron elementos nulos ni duplicados.';

  return { cleaned, removedCount, details };
}
