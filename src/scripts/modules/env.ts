/**
 * Shared environment flags. Read once at startup so modules don't each
 * pay for matchMedia evaluation.
 */
export const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isHoverDevice = window.matchMedia('(hover: hover)').matches;
