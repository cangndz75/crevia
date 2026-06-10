import { DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS } from './districtReportCardConstants';

export function normalizeDistrictReportCardText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function districtReportCardContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = normalizeDistrictReportCardText(text);
  return DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS.some((word) => normalized.includes(word));
}

export function isDistrictReportCardDuplicate(
  line: string | null | undefined,
  existingLines: string[] = [],
): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeDistrictReportCardText(line);
  return existingLines.some((existing) => {
    const other = normalizeDistrictReportCardText(existing);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 22 && other.includes(normalized.slice(0, 22))) return true;
    if (other.length >= 22 && normalized.includes(other.slice(0, 22))) return true;
    return false;
  });
}
