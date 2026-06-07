import {
  CITY_ECHO_COPY_LIMITS,
  CITY_ECHO_FORBIDDEN_TERMS,
} from './cityEchoBindingConstants';
import type { CityEchoBinding, CityEchoBindingInput } from './cityEchoBindingTypes';

export function normalizeCityEchoText(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function cityEchoCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = normalizeCityEchoText(text);
  return CITY_ECHO_FORBIDDEN_TERMS.some((term) => normalized.includes(term));
}

export function clampCityEchoCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function sanitizeCityEchoCopy(
  text: string | undefined,
  surface: keyof typeof CITY_ECHO_COPY_LIMITS,
): string | undefined {
  if (!text?.trim()) return undefined;
  const clamped = clampCityEchoCopy(text, CITY_ECHO_COPY_LIMITS[surface]);
  if (cityEchoCopyContainsForbiddenTerms(clamped)) return undefined;
  return clamped;
}

export function makeCityEchoDuplicateKey(input: {
  districtId?: string;
  domain?: string;
  resource?: string;
  sourceKind?: string;
}): string {
  return [
    input.districtId ?? 'city',
    input.domain ?? 'operation',
    input.resource ?? 'none',
    input.sourceKind ?? 'fallback',
  ].join(':');
}

export function isDuplicateCityEchoLine(line: string | undefined, existing: string[] = []): boolean {
  if (!line?.trim()) return true;
  const normalized = normalizeCityEchoText(line);
  return existing.some((existingLine) => {
    const other = normalizeCityEchoText(existingLine);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 24 && other.includes(normalized.slice(0, 24))) return true;
    if (other.length >= 24 && normalized.includes(other.slice(0, 24))) return true;
    return false;
  });
}

export function diversifySurfaceLines(binding: CityEchoBinding): CityEchoBinding {
  const lines = [
    binding.eceLine,
    binding.socialLine,
    binding.reportLine,
    binding.tomorrowLine,
    binding.hubLine,
  ].filter(Boolean).map((line) => normalizeCityEchoText(line!));
  const unique = new Set(lines);
  if (unique.size === lines.length) return binding;

  return {
    ...binding,
    socialLine:
      binding.socialLine && normalizeCityEchoText(binding.socialLine) === normalizeCityEchoText(binding.reportLine ?? '')
        ? sanitizeCityEchoCopy('Sahadaki görünürlük bugün mahallede fark edildi.', 'social')
        : binding.socialLine,
    hubLine:
      binding.hubLine && normalizeCityEchoText(binding.hubLine) === normalizeCityEchoText(binding.reportLine ?? '')
        ? sanitizeCityEchoCopy('Dünkü karar bugünkü plan için kısa bir iz bıraktı.', 'hub')
        : binding.hubLine,
  };
}

export function buildCityEchoAdvisorLine(binding: CityEchoBinding | null | undefined): string | undefined {
  return binding?.shouldShowAdvisor ? binding.eceLine : undefined;
}

export function buildCityEchoSocialLine(binding: CityEchoBinding | null | undefined): string | undefined {
  return binding?.shouldShowSocial ? binding.socialLine : undefined;
}

export function buildCityEchoReportLine(binding: CityEchoBinding | null | undefined): string | undefined {
  return binding?.shouldShowReport ? binding.reportLine : undefined;
}

export function buildCityEchoHubLine(binding: CityEchoBinding | null | undefined): string | undefined {
  return binding?.shouldShowHub ? binding.hubLine : undefined;
}

export function shouldSuppressFallbackAcrossSurfaces(
  binding: CityEchoBinding,
  input: Pick<CityEchoBindingInput, 'existingLines'>,
): boolean {
  return (
    binding.kind === 'fallback' &&
    (input.existingLines ?? []).some((line) => normalizeCityEchoText(line).includes('karar'))
  );
}
