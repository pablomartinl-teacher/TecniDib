/**
 * Unit tests for CAD geometry engine
 * Ultra-mode requirement: run with `node --test`
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distance,
  distPointToSegment,
  getPolygonVertices,
  isAngleInArc,
  calculateIntersections,
  findSnapPoint,
  calculateIsoDimension,
  calculateMediatriz,
  calculateBisectriz,
  calculateThales,
  generateDxfString,
  snapToIsometricGrid,
  projectToIsoplane,
  calculateIsocircle,
  createIsometricBox,
  createDiedricoTemplate,
} from './geometry.ts';
import type { LineEntity, CircleEntity, EntityStyle } from './types.ts';

test('distance calculation between 2D points', () => {
  const d = distance({ x: 0, y: 0 }, { x: 30, y: 40 });
  assert.equal(Math.round(d), 50);
});

test('distPointToSegment projects correctly onto segment', () => {
  const res = distPointToSegment({ x: 10, y: 15 }, { x: 0, y: 0 }, { x: 20, y: 0 });
  assert.equal(res.dist, 15);
  assert.equal(res.proj.x, 10);
  assert.equal(res.proj.y, 0);
  assert.equal(res.t, 0.5);
});

test('regular polygon generates expected number of vertices', () => {
  const pentagon = getPolygonVertices(100, 100, 50, 5, 0);
  assert.equal(pentagon.length, 5);
  // first vertex at (150, 100) since angle is 0
  assert.equal(Math.round(pentagon[0].x), 150);
  assert.equal(Math.round(pentagon[0].y), 100);
});

test('angle in arc boundary conditions', () => {
  // Semi-circle from 0 to PI
  assert.equal(isAngleInArc(Math.PI / 2, 0, Math.PI), true);
  assert.equal(isAngleInArc(-Math.PI / 2, 0, Math.PI), false);
});

test('calculateIntersections finds orthogonal line crossing', () => {
  const line1: LineEntity = {
    id: 1,
    type: 'line',
    x1: 0,
    y1: 50,
    x2: 100,
    y2: 50,
    style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
  };
  const line2: LineEntity = {
    id: 2,
    type: 'line',
    x1: 50,
    y1: 0,
    x2: 50,
    y2: 100,
    style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
  };
  const pts = calculateIntersections([line1, line2]);
  assert.equal(pts.length, 1);
  assert.equal(Math.round(pts[0].x), 50);
  assert.equal(Math.round(pts[0].y), 50);
});

test('calculateIntersections finds line and circle tangent/secant points', () => {
  const circle: CircleEntity = {
    id: 1,
    type: 'circle',
    cx: 50,
    cy: 50,
    r: 25,
    style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
  };
  const secantLine: LineEntity = {
    id: 2,
    type: 'line',
    x1: 0,
    y1: 50,
    x2: 100,
    y2: 50,
    style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
  };
  const pts = calculateIntersections([circle, secantLine]);
  assert.equal(pts.length, 2);
  assert.equal(Math.round(pts[0].x), 75);
  assert.equal(Math.round(pts[1].x), 25);
});

test('findSnapPoint identifies midpoints and endpoints', () => {
  const line: LineEntity = {
    id: 1,
    type: 'line',
    x1: 10,
    y1: 10,
    x2: 90,
    y2: 10,
    style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
  };
  // Snap near midpoint (50, 10)
  const snapMid = findSnapPoint({ x: 51, y: 11 }, [line], [], 5);
  assert.ok(snapMid);
  assert.equal(snapMid?.type, 'midpoint');
  assert.equal(snapMid?.x, 50);
  assert.equal(snapMid?.y, 10);

  // Snap near endpoint (10, 10)
  const snapEnd = findSnapPoint({ x: 12, y: 11 }, [line], [], 5);
  assert.ok(snapEnd);
  assert.equal(snapEnd?.type, 'endpoint');
  assert.equal(snapEnd?.x, 10);
  assert.equal(snapEnd?.y, 10);
});

test('calculateIsoDimension outputs correct offset extension lines and text', () => {
  const dim = calculateIsoDimension(
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    1,
    6,
    { width: 0.5, color: '#000', dash: 'none', marker: 'none' }
  );
  assert.equal(dim.mag, 100);
  assert.equal(dim.text.str, '100.0 mm');
  assert.equal(dim.dimLine.y1, 6);
  assert.equal(dim.dimLine.y2, 6);
});

test('calculateMediatriz produces perpendicular bisector through midpoint with arcs', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 100, y: 0 };
  const res = calculateMediatriz(p1, p2, true);
  // Midpoint x must be 50
  const midX = (res.line.x1 + res.line.x2) / 2;
  const midY = (res.line.y1 + res.line.y2) / 2;
  assert.equal(Math.round(midX), 50);
  assert.equal(Math.round(midY), 0);
  // Line should be vertical (x1 == x2 == 50)
  assert.equal(Math.round(res.line.x1), 50);
  assert.equal(Math.round(res.line.x2), 50);
  assert.equal(res.arcs.length, 4);
});

test('calculateBisectriz divides 90 degree angle into 45 degree ray', () => {
  const pA = { x: 50, y: 0 };
  const pV = { x: 0, y: 0 };
  const pB = { x: 0, y: 50 };
  const res = calculateBisectriz(pA, pV, pB, true, 50);
  assert.equal(res.ray.x1, 0);
  assert.equal(res.ray.y1, 0);
  // dx and dy must be equal for 45 deg
  const dx = Math.round(res.ray.x2);
  const dy = Math.round(res.ray.y2);
  assert.equal(dx, dy);
  assert.ok(res.arcs.length >= 2);
});

test('calculateThales creates exact N divisions on segment', () => {
  const p1 = { x: 10, y: 10 };
  const p2 = { x: 110, y: 10 };
  const res = calculateThales(p1, p2, 5);
  assert.equal(res.pointsOnSegment.length, 6); // 0, 1, 2, 3, 4, 5
  assert.equal(Math.round(res.pointsOnSegment[1].x), 30);
  assert.equal(Math.round(res.pointsOnSegment[2].x), 50);
  assert.equal(res.parallels.length, 5);
});

test('generateDxfString produces valid ACAD1009 header and entity blocks', () => {
  const dxf = generateDxfString({ w: 297, h: 210 }, [
    {
      type: 'line',
      id: 1,
      x1: 10,
      y1: 10,
      x2: 100,
      y2: 100,
      style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
    },
  ]);
  assert.ok(dxf.includes('$ACADVER'));
  assert.ok(dxf.includes('LINE'));
  assert.ok(dxf.includes('EOF'));
});

test('snapToIsometricGrid snaps onto 30 degree lattice nodes', () => {
  const pitch = 10;
  const pSnapped = snapToIsometricGrid({ x: 8.7, y: 5.1 }, pitch);
  // cos(30)*10 ≈ 8.66, sin(30)*10 = 5.0
  assert.equal(pSnapped.x, 8.66);
  assert.equal(pSnapped.y, 5);
});

test('projectToIsoplane constrains movement to isoplane axes', () => {
  const p1 = { x: 50, y: 50 };
  // Moving roughly at 25 degrees on Top isoplane should lock to 30 deg
  const p2 = { x: 100, y: 50 + 50 * Math.tan((25 * Math.PI) / 180) };
  const locked = projectToIsoplane(p1, p2, 'top');
  const angleDeg = (Math.atan2(locked.y - p1.y, locked.x - p1.x) * 180) / Math.PI;
  assert.equal(Math.round(angleDeg), 30);
});

test('calculateIsocircle yields standard ISO ellipse aspect ratio', () => {
  const iso = calculateIsocircle({ x: 100, y: 100 }, 20, 'top');
  assert.equal(iso.rx, 20);
  // ry = 20 / sqrt(3) ≈ 11.55
  assert.equal(iso.ry, 11.55);
  assert.equal(iso.rotation, 0);

  const isoLeft = calculateIsocircle({ x: 100, y: 100 }, 20, 'left');
  assert.equal(isoLeft.rotation, 120);

  const isoRight = calculateIsocircle({ x: 100, y: 100 }, 20, 'right');
  assert.equal(isoRight.rotation, 60);
});

test('createIsometricBox generates 12 edges with 3 hidden rear edges', () => {
  const style: EntityStyle = { width: 0.5, color: '#000', dash: 'none', marker: 'none' };
  const hiddenStyle: EntityStyle = { width: 0.25, color: '#000', dash: '3,3', marker: 'none' };
  const boxLines = createIsometricBox({ x: 100, y: 150 }, 40, 30, 50, style, hiddenStyle);
  assert.equal(boxLines.length, 12);
  const hiddenCount = boxLines.filter((l) => l.style.dash === '3,3').length;
  assert.equal(hiddenCount, 3);
  const visibleCount = boxLines.filter((l) => l.style.dash === 'none').length;
  assert.equal(visibleCount, 9);
});

test('createDiedricoTemplate creates projection ground line and isometric tripod', () => {
  const style: EntityStyle = { width: 0.5, color: '#000', dash: 'none', marker: 'none' };
  const auxStyle: EntityStyle = { width: 0.25, color: '#666', dash: 'none', marker: 'none' };
  const template = createDiedricoTemplate({ name: 'A4', w: 297, h: 210, orientation: 'landscape' }, style, auxStyle);
  assert.ok(template.length >= 10);
  const textEntities = template.filter((e) => e.type === 'tag');
  assert.ok(textEntities.some((t: any) => t.text.includes('LÍNEA DE TIERRA')));
  assert.ok(textEntities.some((t: any) => t.text.includes('ALZADO')));
  assert.ok(textEntities.some((t: any) => t.text.includes('PERSPECTIVA ISOMÉTRICA')));
});


