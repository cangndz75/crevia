import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  STORY_CHAIN_COMPACT_COPY_MAX,
  STORY_CHAIN_FORBIDDEN_COPY_TERMS,
  STORY_CHAIN_MOBILE_COPY_MAX,
  STORY_CHAIN_PANIC_COPY_TERMS,
  getStoryChainKindDefinition,
} from './storyChainConstants';
import {
  buildResolvedStoryChain,
  buildStoryChainContext,
  resolveStoryChainForDistrict,
} from './storyChainResolver';
import { getStoryChainTemplateById } from './storyChainTemplates';
import type {
  CreviaResolvedStoryChain,
  CreviaStoryChainAnalyticsHint,
  CreviaStoryChainContext,
  CreviaStoryChainPresentationModel,
  CreviaStoryChainStep,
} from './storyChainTypes';

function clampCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function storyChainCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return STORY_CHAIN_FORBIDDEN_COPY_TERMS.some((term) => normalized.includes(term.toLocaleLowerCase('tr-TR')));
}

export function storyChainCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return STORY_CHAIN_PANIC_COPY_TERMS.some((term) => normalized.includes(term.toLocaleLowerCase('tr-TR')));
}

function safeCopy(text: string, max = STORY_CHAIN_COMPACT_COPY_MAX): string {
  const clamped = clampCopy(text, max);
  if (storyChainCopyContainsForbiddenTerms(clamped) || storyChainCopyContainsPanicTerms(clamped)) {
    return clampCopy('Mahallede kisa operasyon izi yarin icin takip penceresi birakiyor.', max);
  }
  return clamped;
}

function currentStep(chain: CreviaResolvedStoryChain): CreviaStoryChainStep | undefined {
  return chain.steps[chain.currentStepIndex];
}

function resolveChain(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): CreviaResolvedStoryChain | null {
  return resolveStoryChainForDistrict(districtId, context);
}

export function buildStoryChainHubLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) {
    return safeCopy('Bugun kisa saha izi; yarin takip penceresi acilabilir.');
  }
  const step = currentStep(chain);
  return safeCopy(step?.hints.advisorHint ?? chain.reasonLine, STORY_CHAIN_MOBILE_COPY_MAX);
}

export function buildStoryChainMapLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Haritada kisa iz; detay yarin acilir.');
  const step = currentStep(chain);
  return safeCopy(step?.hints.mapHint ?? `${chain.districtName}: ${chain.shortLabel} izi.`);
}

export function buildStoryChainReportLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Gun sonu: kisa iz, yarin takip notu olabilir.');
  const step = currentStep(chain);
  return safeCopy(step?.hints.reportHint ?? chain.reasonLine, STORY_CHAIN_MOBILE_COPY_MAX);
}

export function buildStoryChainResultLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Sonuc: kisa iz birakildi, yarin okunacak.');
  const step = currentStep(chain);
  return safeCopy(step?.hints.resultHint ?? `${chain.shortLabel} kontrollu kapandi.`);
}

export function buildStoryChainAdvisorLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Danisman: bugun sade plan, yarin iz takibi.');
  const step = currentStep(chain);
  return safeCopy(step?.hints.advisorHint ?? getStoryChainKindDefinition(chain.kind).label);
}

export function buildStoryChainTomorrowLine(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Yarin: kisa takip penceresi acilabilir.');
  const step = currentStep(chain);
  return safeCopy(step?.hints.tomorrowHint ?? chain.freshnessIntent);
}

export function buildStoryChainCompactChip(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): string {
  const chain = resolveChain(districtId, context);
  if (!chain || chain.isComplexityHidden) return safeCopy('Iz: yarin');
  return safeCopy(`${chain.shortLabel} · ${chain.steps.length} gun`, STORY_CHAIN_COMPACT_COPY_MAX);
}

export function buildStoryChainPresentationModel(
  districtId: MapDistrictId | string,
  context: Partial<CreviaStoryChainContext> = {},
): CreviaStoryChainPresentationModel | null {
  const chain = resolveChain(districtId, context);
  if (!chain) return null;

  return {
    chainId: chain.id,
    kind: chain.kind,
    status: chain.status,
    districtId: chain.districtId,
    districtName: chain.districtName,
    compactChip: buildStoryChainCompactChip(districtId, context),
    hubLine: buildStoryChainHubLine(districtId, context),
    mapLine: buildStoryChainMapLine(districtId, context),
    reportLine: buildStoryChainReportLine(districtId, context),
    resultLine: buildStoryChainResultLine(districtId, context),
    advisorLine: buildStoryChainAdvisorLine(districtId, context),
    tomorrowLine: buildStoryChainTomorrowLine(districtId, context),
    stepCount: chain.stepCount,
    currentStepIndex: chain.currentStepIndex,
    isRuntimeLinked: false,
  };
}

export function buildStoryChainAnalyticsHint(
  chain: CreviaResolvedStoryChain,
): CreviaStoryChainAnalyticsHint {
  const step = currentStep(chain);
  return {
    chainKind: chain.kind,
    status: chain.status,
    districtId: chain.districtId,
    stepCount: chain.stepCount,
    variantBias: step?.variantBias ?? [],
    isRuntimeLinked: false,
  };
}

export function validateStoryChainPresentationCopy(text: string, max = STORY_CHAIN_MOBILE_COPY_MAX): {
  ok: boolean;
  length: number;
  hasForbidden: boolean;
  hasPanic: boolean;
} {
  return {
    ok:
      text.length <= max &&
      !storyChainCopyContainsForbiddenTerms(text) &&
      !storyChainCopyContainsPanicTerms(text),
    length: text.length,
    hasForbidden: storyChainCopyContainsForbiddenTerms(text),
    hasPanic: storyChainCopyContainsPanicTerms(text),
  };
}

export function buildStoryChainPresentationFromTemplateId(
  templateId: string,
  context: Partial<CreviaStoryChainContext> = {},
): CreviaStoryChainPresentationModel | null {
  const template = getStoryChainTemplateById(templateId);
  if (!template) return null;
  const chain = buildResolvedStoryChain(template, buildStoryChainContext(context));
  return buildStoryChainPresentationModel(chain.districtId, { ...context, selectedDistrictId: chain.districtId });
}
