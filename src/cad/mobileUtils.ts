/**
 * Mobile interaction & Gesture utilities for VektorCAD
 */

import { CadEntity, PageDocument } from './types.ts';

/**
 * Determines whether the interface should activate mobile device mode
 * based on viewport dimensions, pointer capabilities, and touch support.
 */
export function detectMobileDevice(
  viewportWidth: number,
  hasTouch: boolean,
  hasCoarsePointer: boolean
): boolean {
  // Mobile phones and narrow screens (<= 768px) always qualify
  if (viewportWidth <= 768) {
    return true;
  }
  // Tablets with touch screens up to 1024px in portrait or coarse touch pointer
  if (viewportWidth <= 1024 && (hasTouch || hasCoarsePointer)) {
    return true;
  }
  return false;
}

/**
 * Computes updated zoom level given pinch-to-zoom distance delta
 */
export function calculatePinchZoom(
  initialDist: number,
  currentDist: number,
  initialZoom: number,
  minZoom = 25,
  maxZoom = 500
): number {
  if (initialDist <= 5) return initialZoom;
  const ratio = currentDist / initialDist;
  const newZoom = Math.round(initialZoom * ratio);
  return Math.max(minZoom, Math.min(maxZoom, newZoom));
}

/**
 * Toggles the locked status of an entity by ID
 */
export function toggleEntityLock(entities: CadEntity[], targetId: number): CadEntity[] {
  return entities.map((ent) => {
    if (ent.id === targetId) {
      return {
        ...ent,
        locked: !ent.locked,
      };
    }
    return ent;
  });
}

/**
 * Toggles the locked status of the background PDF/image on a PageDocument
 */
export function toggleBgImageLock(page: PageDocument): PageDocument {
  // If bgImageLocked is undefined, it was default unlocked (or vice versa); toggling flips it
  const isCurrentlyLocked = Boolean(page.bgImageLocked);
  return {
    ...page,
    bgImageLocked: !isCurrentlyLocked,
  };
}
