export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

/** Metrikleri 0–100 aralığında tutar; NaN için 0 döner. */
export function clampMetric(value: number): number {
  return clamp(value, 0, 100);
}
