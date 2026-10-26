import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectMobileDevice,
  calculatePinchZoom,
  toggleEntityLock,
  toggleBgImageLock,
} from './mobileUtils.ts';
import { CadEntity, PageDocument } from './types.ts';

test('detectMobileDevice correctly identifies mobile viewports and touch pointers', () => {
  // Mobile screen width
  assert.equal(detectMobileDevice(375, true, true), true);
  assert.equal(detectMobileDevice(414, true, false), true);
  assert.equal(detectMobileDevice(768, false, false), true);

  // Tablet with coarse pointer
  assert.equal(detectMobileDevice(820, true, true), true);
  assert.equal(detectMobileDevice(1024, true, false), true);

  // Desktop screen
  assert.equal(detectMobileDevice(1280, false, false), false);
  assert.equal(detectMobileDevice(1920, false, false), false);
});

test('calculatePinchZoom computes smooth scaling bounded by min and max', () => {
  // Pinch out (zoom in)
  const zoomedIn = calculatePinchZoom(100, 150, 100, 25, 500);
  assert.equal(zoomedIn, 150);

  // Pinch in (zoom out)
  const zoomedOut = calculatePinchZoom(200, 100, 100, 25, 500);
  assert.equal(zoomedOut, 50);

  // Bounded by max
  const clampedMax = calculatePinchZoom(100, 1000, 100, 25, 500);
  assert.equal(clampedMax, 500);

  // Bounded by min
  const clampedMin = calculatePinchZoom(1000, 10, 100, 25, 500);
  assert.equal(clampedMin, 25);
});

test('toggleEntityLock toggles locked flag on target entity', () => {
  const entities: CadEntity[] = [
    {
      type: 'image',
      id: 101,
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      href: 'data:...',
      locked: false,
      style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
    },
    {
      type: 'line',
      id: 102,
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      style: { width: 0.5, color: '#000', dash: 'none', marker: 'none' },
    },
  ];

  const toggled = toggleEntityLock(entities, 101);
  assert.equal(toggled[0].locked, true);
  assert.equal(toggled[1].locked, undefined);

  const toggledAgain = toggleEntityLock(toggled, 101);
  assert.equal(toggledAgain[0].locked, false);
});

test('toggleBgImageLock flips bgImageLocked flag on PageDocument', () => {
  const page: PageDocument = {
    id: 'page-1',
    title: 'Lámina 1',
    data: [],
    history: [],
    redoHistory: [],
    bgImage: 'data:image/png;base64,abc',
    bgImageLocked: false,
    sheetSize: { name: 'A4', w: 297, h: 210, orientation: 'landscape' },
  };

  const lockedPage = toggleBgImageLock(page);
  assert.equal(lockedPage.bgImageLocked, true);

  const unlockedPage = toggleBgImageLock(lockedPage);
  assert.equal(unlockedPage.bgImageLocked, false);
});
