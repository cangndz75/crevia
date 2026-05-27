export type DailyEventCounts = {
  anchor: number;
  side: number;
  quick: number;
  opportunity: number;
  butterfly: number;
};

/**
 * Pilot gününe göre günlük olay slot sayıları (Faz 1 — sadeleştirilmiş).
 */
export function getDailyEventCounts(day: number): DailyEventCounts {
  if (day <= 1) {
    return { anchor: 1, side: 1, quick: 0, opportunity: 0, butterfly: 0 };
  }
  if (day <= 3) {
    return { anchor: 1, side: 2, quick: 1, opportunity: 0, butterfly: 0 };
  }
  if (day === 4) {
    return { anchor: 1, side: 3, quick: 1, opportunity: 0, butterfly: 0 };
  }
  if (day === 5) {
    return { anchor: 1, side: 2, quick: 1, opportunity: 1, butterfly: 0 };
  }
  if (day === 6) {
    return { anchor: 1, side: 2, quick: 1, opportunity: 0, butterfly: 1 };
  }
  // Gün 7
  return { anchor: 1, side: 2, quick: 0, opportunity: 0, butterfly: 0 };
}
