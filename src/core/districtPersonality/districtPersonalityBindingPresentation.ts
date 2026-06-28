import {
  DISTRICT_PERSONALITY_BINDING_DEFINITIONS,
  DISTRICT_PERSONALITY_BINDING_PROHIBITED_TERMS,
} from './districtPersonalityBindingConstants';
import {
  deriveDistrictPersonalityKey,
  mapOutcomeBandToPersonalityOutcome,
  resolveDistrictPersonalityProfile,
} from './districtPersonalityBindingModel';
import type {
  DistrictMemoryReportInsight,
  DistrictPersonalityBindingInput,
  DistrictPersonalityOutcomeBand,
  DistrictPersonalityPresentation,
  DistrictPersonalitySurface,
  DistrictPersonalityTone,
  DistrictReactionFlavor,
} from './districtPersonalityBindingTypes';

const ECE_HINT_MAX = 118;
const REPORT_LINE_MAX = 132;
const REPLAY_LINE_MAX = 110;

function normalizeLine(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

function clamp(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function containsProhibited(text: string): boolean {
  const normalized = normalizeLine(text);
  return DISTRICT_PERSONALITY_BINDING_PROHIBITED_TERMS.some((term) =>
    normalized.includes(term),
  );
}

export function dedupeDistrictPersonalityCopy(
  line: string,
  avoidLines: string[] = [],
): boolean {
  const normalized = normalizeLine(line);
  if (!normalized) return true;
  return avoidLines.some((avoid) => {
    const other = normalizeLine(avoid);
    if (!other) return false;
    if (other === normalized) return true;
    if (normalized.length >= 18 && other.includes(normalized.slice(0, 18))) return true;
    if (other.length >= 18 && normalized.includes(other.slice(0, 18))) return true;
    return false;
  });
}

function resolveOutcomeKey(
  outcomeBand?: DistrictPersonalityOutcomeBand | null,
): 'positive' | 'neutral' | 'warning' {
  return mapOutcomeBandToPersonalityOutcome(outcomeBand ?? 'neutral');
}

function toneForOutcome(outcome: 'positive' | 'neutral' | 'warning'): DistrictPersonalityTone {
  if (outcome === 'positive') return 'positive';
  if (outcome === 'warning') return 'warning';
  return 'neutral';
}

export function buildDistrictPersonalityPresentation(
  input: DistrictPersonalityBindingInput,
): DistrictPersonalityPresentation {
  const profile =
    input.profile ??
    resolveDistrictPersonalityProfile({
      districtId: input.districtId,
      districtName: input.districtName,
      day: input.day,
    });

  const districtName =
    input.districtName?.trim() || profile.districtName || 'Bölge';
  const personalityKey = deriveDistrictPersonalityKey({
    districtId: input.districtId ?? profile.districtId,
    districtName,
    profile: input.districtId ? profile : profile,
    publicSatisfaction: input.publicSatisfaction,
    eventFamily: input.eventFamily,
  });
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[personalityKey];
  const outcome = resolveOutcomeKey(input.outcomeBand);

  return {
    districtId: profile.districtId,
    districtName,
    personalityKey,
    label: definition.label,
    shortTrait: definition.shortTrait,
    expectationLabel: definition.expectationLabel,
    toleranceLabel: definition.toleranceLabel,
    reactsTo: definition.reactsTo,
    positiveResponse: definition.positiveResponse,
    negativeResponse: definition.negativeResponse,
    riskWhenIgnored: definition.riskWhenIgnored,
    tone: toneForOutcome(outcome),
  };
}

export function buildDistrictReactionFlavor(
  input: DistrictPersonalityBindingInput,
): DistrictReactionFlavor {
  const presentation = buildDistrictPersonalityPresentation(input);
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  const outcome = resolveOutcomeKey(input.outcomeBand);
  const copy = definition.result[outcome];

  return {
    title: copy.title,
    description: copy.description,
    tone: presentation.tone,
    chips: [
      {
        label: presentation.label,
        tone: presentation.tone,
      },
      {
        label: presentation.expectationLabel,
        tone: 'neutral',
      },
    ],
  };
}

export function buildDistrictMemoryReportInsight(
  input: DistrictPersonalityBindingInput,
): DistrictMemoryReportInsight | null {
  if ((input.day ?? 1) <= 1) return null;

  const presentation = buildDistrictPersonalityPresentation(input);
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  const outcome = resolveOutcomeKey(input.outcomeBand);
  const body = definition.report[outcome].description;
  const line = clamp(`${presentation.districtName} ${body}`, REPORT_LINE_MAX);

  if (!line || containsProhibited(line)) return null;
  if (dedupeDistrictPersonalityCopy(line, input.avoidLines ?? [])) return null;

  return {
    sectionTitle: 'Mahalle Hafızası',
    line,
    tone: presentation.tone,
  };
}

export function buildDistrictReplayFlavorLine(
  input: DistrictPersonalityBindingInput & {
    replayKind: 'cityImpact' | 'socialEcho' | 'maintenance';
  },
): string | null {
  const presentation = buildDistrictPersonalityPresentation(input);
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  const line = clamp(definition.replay[input.replayKind], REPLAY_LINE_MAX);

  if (!line || containsProhibited(line)) return null;
  if (dedupeDistrictPersonalityCopy(line, input.avoidLines ?? [])) return null;
  return line;
}

export function buildDistrictFeedWatchCopy(
  input: DistrictPersonalityBindingInput & { fragile?: boolean },
): { title: string; subtitle: string } | null {
  const presentation = buildDistrictPersonalityPresentation(input);
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  const outcome = resolveOutcomeKey(input.outcomeBand);
  const positive = outcome === 'positive' && !input.fragile;

  const title = positive
    ? definition.feed.positiveTitle(presentation.districtName)
    : definition.feed.watchTitle(presentation.districtName);
  const subtitle = positive
    ? definition.feed.positiveSubtitle
    : definition.feed.watchSubtitle;

  if (dedupeDistrictPersonalityCopy(title, input.avoidLines ?? [])) return null;
  if (dedupeDistrictPersonalityCopy(subtitle, input.avoidLines ?? [])) return null;

  return {
    title: clamp(title, 72),
    subtitle: clamp(subtitle, 72),
  };
}

export function buildDistrictPersonalityEceHint(
  input: DistrictPersonalityBindingInput,
  surface: DistrictPersonalitySurface = 'ece',
): string | null {
  if ((input.day ?? 1) <= 1 && surface !== 'result') return null;

  const presentation = buildDistrictPersonalityPresentation(input);
  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  const hint = clamp(definition.eceHint, ECE_HINT_MAX);

  if (!hint || containsProhibited(hint)) return null;
  if (dedupeDistrictPersonalityCopy(hint, input.avoidLines ?? [])) return null;
  return hint;
}

export function buildDistrictMapPersonalityLabel(
  input: DistrictPersonalityBindingInput,
): string | null {
  const presentation = buildDistrictPersonalityPresentation(input);
  if (presentation.personalityKey === 'balanced_unknown') return null;

  const definition = DISTRICT_PERSONALITY_BINDING_DEFINITIONS[presentation.personalityKey];
  return clamp(definition.mapLabel, 24);
}

export function buildDistrictPersonalityBindingContext(
  input: DistrictPersonalityBindingInput,
) {
  const profile = resolveDistrictPersonalityProfile({
    districtId: input.districtId,
    districtName: input.districtName,
    day: input.day,
  });

  return {
    profile,
    presentation: buildDistrictPersonalityPresentation({
      ...input,
      profile,
    }),
  };
}
