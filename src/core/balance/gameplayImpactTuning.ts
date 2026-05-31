import { deriveMainOperationAccessMode } from '@/core/mainOperation/mainOperationEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  CRISIS_IMPACT_MULTIPLIER,
  FULL_MAIN_IMPACT_MULTIPLIER,
  LIMITED_IMPACT_MULTIPLIER,
  MAX_SINGLE_DOMAIN_DELTA,
  MAX_TOTAL_DAILY_IMPROVEMENT_DELTA,
  MAX_TOTAL_DAILY_RISK_DELTA,
  PILOT_IMPACT_MULTIPLIER,
} from './gameplayImpactConstants';
import type {
  GameplayImpactDirection,
  GameplayImpactMagnitude,
  GameplayImpactProfile,
  GameplayImpactScaleContext,
} from './gameplayImpactTypes';

export function clampGameplayDelta(delta: number): number {
  if (!Number.isFinite(delta) || delta === 0) return 0;
  return Math.max(-MAX_SINGLE_DOMAIN_DELTA, Math.min(MAX_SINGLE_DOMAIN_DELTA, Math.round(delta)));
}

export function classifyGameplayImpact(delta: number): GameplayImpactMagnitude {
  const abs = Math.abs(delta);
  if (abs <= 2) return 'tiny';
  if (abs <= 4) return 'small';
  if (abs <= 7) return 'medium';
  return 'strong';
}

export function classifyGameplayDirection(delta: number): GameplayImpactDirection {
  if (delta === 0) return 'neutral';
  if (delta < 0) return 'improves';
  return 'worsens';
}

export function shouldUseStrongerImpactContext(ctx: GameplayImpactScaleContext): boolean {
  if (ctx.crisisRiskElevated && ctx.isCrisisRelated) return true;
  const day = ctx.gameState.city.day;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) return false;
  if (!ctx.monetization) return false;
  return deriveMainOperationAccessMode(ctx.gameState, ctx.monetization) === 'full';
}

export function getGameplayImpactMultiplier(ctx: GameplayImpactScaleContext): number {
  const day = ctx.gameState.city.day;
  const pilotActive = ctx.gameState.pilot.status === 'active';

  if (ctx.isDay1Tutorial) {
    return 0.5;
  }

  if (pilotActive && day <= 2) {
    return 0.5;
  }

  if (pilotActive && day <= 7) {
    return PILOT_IMPACT_MULTIPLIER;
  }

  if (ctx.postPilotLightPhase) {
    return LIMITED_IMPACT_MULTIPLIER;
  }

  if (ctx.monetization) {
    const access = deriveMainOperationAccessMode(ctx.gameState, ctx.monetization);
    if (access === 'limited') {
      return LIMITED_IMPACT_MULTIPLIER;
    }
  }

  return FULL_MAIN_IMPACT_MULTIPLIER;
}

export function scaleGameplayDelta(
  delta: number,
  ctx: GameplayImpactScaleContext,
): number {
  if (delta === 0) return 0;

  let mult = getGameplayImpactMultiplier(ctx);
  if (ctx.isCrisisRelated && ctx.crisisRiskElevated) {
    mult = Math.min(mult * CRISIS_IMPACT_MULTIPLIER, 1.2);
  }

  let scaled = Math.round(delta * mult);
  const pilotActive = ctx.gameState.pilot.status === 'active';
  const day = ctx.gameState.city.day;

  if (pilotActive && day <= 2 && delta > 0) {
    scaled = Math.min(scaled, 2);
  }
  if (pilotActive && day <= 2 && delta < 0) {
    scaled = Math.max(scaled, -2);
  }

  if (ctx.isDay1Tutorial) {
    if (delta < 0) {
      scaled = Math.min(-1, Math.round(delta * 0.5));
    } else {
      scaled = Math.max(1, Math.round(delta * 0.5));
    }
  }

  return clampGameplayDelta(scaled);
}

export function buildGameplayImpactProfile(params: {
  id: string;
  domain: GameplayImpactProfile['domain'];
  delta: number;
  reason: string;
  sourceTags: string[];
}): GameplayImpactProfile {
  const delta = clampGameplayDelta(params.delta);
  return {
    id: params.id,
    domain: params.domain,
    delta,
    magnitude: classifyGameplayImpact(delta),
    direction: classifyGameplayDirection(delta),
    reason: params.reason,
    sourceTags: params.sourceTags,
  };
}

function clampDomainDailyTotal(domain: string, total: number): number {
  if (total < 0) {
    return Math.max(total, -MAX_TOTAL_DAILY_IMPROVEMENT_DELTA);
  }
  if (total > 0) {
    return Math.min(total, MAX_TOTAL_DAILY_RISK_DELTA);
  }
  return 0;
}

export function mergeAndClampImpactProfiles(
  profiles: GameplayImpactProfile[],
): GameplayImpactProfile[] {
  const byDomain = new Map<string, GameplayImpactProfile>();

  for (const profile of profiles) {
    const prev = byDomain.get(profile.domain);
    if (!prev) {
      byDomain.set(profile.domain, { ...profile });
      continue;
    }
    const total = prev.delta + profile.delta;
    const clamped = clampDomainDailyTotal(profile.domain, total);
    byDomain.set(profile.domain, {
      ...prev,
      delta: clamped,
      magnitude: classifyGameplayImpact(clamped),
      direction: classifyGameplayDirection(clamped),
      reason: profile.reason || prev.reason,
      sourceTags: [...new Set([...prev.sourceTags, ...profile.sourceTags])],
    });
  }

  return [...byDomain.values()].filter((p) => p.delta !== 0);
}

export function normalizeTradeoffCopy(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function buildScaleContextFromGame(
  params: GameplayImpactScaleContext,
): GameplayImpactScaleContext {
  return params;
}
