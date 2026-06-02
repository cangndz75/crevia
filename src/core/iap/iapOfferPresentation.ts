import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import { buildPostPilotOfferViewModel } from '@/core/monetization/monetizationPresentation';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';

import {
  IAP_OFFER_COPY,
  IAP_STATUS_COPY,
  IAP_UI_FORBIDDEN_WORDS,
} from './iapProductConstants';
import { getMainOperationProductDefinition } from './iapProductDesign';
import type {
  IapDesignAuditResult,
  IapOfferCopyModel,
  IapPurchaseStatus,
  IapRestoreStatus,
} from './iapProductTypes';

export function buildIapOfferCopyModel(): IapOfferCopyModel {
  const product = getMainOperationProductDefinition();
  return {
    title: product.title,
    subtitle: product.subtitle,
    valueBullets: [...product.unlocks],
    primaryCtaLabel: IAP_OFFER_COPY.primaryCtaLabel,
    secondaryCtaLabel: IAP_OFFER_COPY.secondaryCtaLabel,
    restoreCtaLabel: IAP_OFFER_COPY.restoreCtaLabel,
    footerNote: IAP_OFFER_COPY.footerNote,
  };
}

export function buildIapRestoreCopy(status: IapRestoreStatus): string {
  switch (status) {
    case 'restored':
      return IAP_STATUS_COPY.restoreRestored;
    case 'not_found':
      return IAP_STATUS_COPY.restoreNotFound;
    case 'failed':
      return IAP_STATUS_COPY.restoreFailed;
    case 'pending':
    default:
      return IAP_STATUS_COPY.restorePending;
  }
}

export function buildIapPurchaseStatusCopy(status: IapPurchaseStatus): string {
  switch (status) {
    case 'completed':
      return IAP_STATUS_COPY.purchaseCompleted;
    case 'cancelled':
      return IAP_STATUS_COPY.purchaseCancelled;
    case 'failed':
      return IAP_STATUS_COPY.purchaseFailed;
    case 'pending':
    default:
      return IAP_STATUS_COPY.purchasePending;
  }
}

function containsForbidden(text: string): boolean {
  const lower = text.toLowerCase();
  return IAP_UI_FORBIDDEN_WORDS.some((w) => lower.includes(w));
}

export function validateIapOfferCopy(): IapDesignAuditResult {
  const findings: import('./iapProductTypes').IapDesignAuditFinding[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const push = (
    id: string,
    severity: 'pass' | 'warn' | 'fail',
    message: string,
    recommendation: string,
  ) => {
    findings.push({ id, severity, message, recommendation });
    if (severity === 'pass') passCount += 1;
    else if (severity === 'warn') warnCount += 1;
    else failCount += 1;
  };

  const model = buildIapOfferCopyModel();
  const blob = [
    model.title,
    model.subtitle,
    model.primaryCtaLabel,
    model.secondaryCtaLabel,
    model.restoreCtaLabel,
    model.footerNote,
    ...model.valueBullets,
    buildIapRestoreCopy('failed'),
    buildIapPurchaseStatusCopy('failed'),
  ].join(' ');

  if (!containsForbidden(blob)) {
    push('offer_forbidden', 'pass', 'Offer copy has no forbidden words', 'Keep Crevia tone');
  } else {
    push('offer_forbidden', 'fail', 'Forbidden word in offer copy', 'Remove paywall language');
  }

  if (model.primaryCtaLabel === 'Ana Operasyonu Aç') {
    push('primary_cta', 'pass', 'Primary CTA label', 'Match PostPilot screen');
  } else {
    push('primary_cta', 'fail', 'Primary CTA mismatch', 'Use Ana Operasyonu Aç');
  }

  if (model.secondaryCtaLabel === 'Sınırlı Gündemle Devam Et') {
    push('secondary_cta', 'pass', 'Secondary CTA label', 'Limited flow');
  } else {
    push('secondary_cta', 'fail', 'Secondary CTA mismatch', 'Align labels');
  }

  if (model.restoreCtaLabel === 'Erişimi Geri Yükle') {
    push('restore_cta', 'pass', 'Restore CTA label', 'Update screen when integrating IAP');
  } else {
    push('restore_cta', 'fail', 'Restore CTA mismatch', 'Use Erişimi Geri Yükle');
  }

  if (model.valueBullets.length >= 5) {
    push('value_bullets', 'pass', 'Value bullets count', 'Keep aligned with pack');
  }

  const crisis = model.valueBullets.some((b) => /kriz/i.test(b));
  const goals = model.valueBullets.some((b) => /hedef/i.test(b));
  const resources = model.valueBullets.some((b) => /kaynak|harita/i.test(b));
  const live = model.valueBullets.some((b) => /canlı|karar/i.test(b));
  const periodicReview = model.valueBullets.some((b) => /dönemsel operasyon değerlendirmesi/i.test(b));

  if (crisis) push('bullet_crisis', 'pass', 'Crisis in bullets', 'ok');
  if (goals) push('bullet_goals', 'pass', 'Season goals in bullets', 'ok');
  if (resources) push('bullet_resources', 'pass', 'Resources/map in bullets', 'ok');
  if (live) push('bullet_live', 'pass', 'Live decisions in bullets', 'ok');
  if (periodicReview) push('bullet_periodic_review', 'pass', 'Periodic review in bullets', 'ok');

  let health: IapDesignAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}

export type PostPilotOfferCopyAlignment = {
  aligned: boolean;
  mismatches: string[];
};

export function checkPostPilotOfferCopyAlignment(
  gameState: GameState,
  monetization?: MonetizationState,
): PostPilotOfferCopyAlignment {
  const iap = buildIapOfferCopyModel();
  const screen = buildPostPilotOfferViewModel(gameState, monetization);
  const mismatches: string[] = [];

  if (screen.primaryCtaLabel !== iap.primaryCtaLabel) {
    mismatches.push(`primary: screen="${screen.primaryCtaLabel}" iap="${iap.primaryCtaLabel}"`);
  }
  if (screen.secondaryCtaLabel !== iap.secondaryCtaLabel) {
    mismatches.push(
      `secondary: screen="${screen.secondaryCtaLabel}" iap="${iap.secondaryCtaLabel}"`,
    );
  }
  if (screen.restoreLabel !== iap.restoreCtaLabel) {
    mismatches.push(`restore: screen="${screen.restoreLabel}" iap="${iap.restoreCtaLabel}"`);
  }
  if (screen.title !== MONETIZATION_COPY.offerTitle && screen.title.length > 0) {
    mismatches.push('title differs from monetization offer title (acceptable)');
  }

  const critical = mismatches.filter((m) => !m.startsWith('title'));
  return { aligned: critical.length === 0, mismatches };
}
