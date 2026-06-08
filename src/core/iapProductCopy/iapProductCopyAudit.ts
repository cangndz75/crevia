import {
  IAP_PRODUCT_COPY_DOCS_PATH,
  IAP_PRODUCT_COPY_FALSE_PRESSURE_PHRASES,
  IAP_PRODUCT_COPY_ITEMS_TEMPLATE,
  IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS,
  IAP_PRODUCT_COPY_OFFER_SCREEN,
  IAP_PRODUCT_COPY_PACK_ID,
  IAP_PRODUCT_COPY_POSITIONING_EN,
  IAP_PRODUCT_COPY_POSITIONING_TR,
  IAP_PRODUCT_COPY_BENEFIT_BULLETS_TR,
  IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN,
  IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR,
  IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN,
  IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR,
  IAP_PRODUCT_COPY_PURCHASE_STATES,
  IAP_PRODUCT_COPY_RESTORE,
  IAP_PRODUCT_COPY_REVIEW_NOTES,
  IAP_PRODUCT_COPY_TRUST_CHECKLIST,
} from './iapProductCopyConstants';
import type {
  IapProductCopyAuditResult,
  IapProductCopyFalsePressureFinding,
  IapProductCopyManualSetupBlocker,
  IapProductCopyPackStatus,
} from './iapProductCopyTypes';

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

function matchesFalsePressure(text: string): string | undefined {
  const normalized = normalize(text);
  return IAP_PRODUCT_COPY_FALSE_PRESSURE_PHRASES.find((phrase) =>
    normalized.includes(normalize(phrase)),
  );
}

export function scanIapProductCopyForFalsePressure(
  items: Array<{ id: string; text: string }>,
): IapProductCopyFalsePressureFinding[] {
  const findings: IapProductCopyFalsePressureFinding[] = [];
  for (const { id, text } of items) {
    const hit = matchesFalsePressure(text);
    if (hit) findings.push({ phrase: hit, fieldId: id, severity: 'blocker' });
  }
  return findings;
}

function collectCopyTexts(): Array<{ id: string; text: string }> {
  return IAP_PRODUCT_COPY_ITEMS_TEMPLATE.map((item) => ({ id: item.id, text: item.text }));
}

function resolveStatus(copyGuardPassed: boolean): IapProductCopyPackStatus {
  if (!copyGuardPassed) return 'draft';
  return 'ready_for_dashboard_entry';
}

function buildManualSetupBlockers(): IapProductCopyManualSetupBlocker[] {
  return [
    {
      id: 'iap.product_setup_pending',
      title: 'Store product setup pending',
      message: 'App Store Connect / Play Console products not created — dashboard entry blocked.',
    },
    {
      id: 'iap.revenuecat_keys_pending',
      title: 'RevenueCat keys pending',
      message: 'Public SDK keys and offering configuration still manual.',
    },
    {
      id: 'iap.sandbox_purchase_pending',
      title: 'Sandbox purchase test pending',
      message: 'No verified sandbox purchase evidence.',
    },
    {
      id: 'iap.restore_test_pending',
      title: 'Restore purchase test pending',
      message: 'No verified restore flow evidence.',
    },
  ];
}

export function runIapProductCopyAudit(): IapProductCopyAuditResult {
  const productCopyItems = IAP_PRODUCT_COPY_ITEMS_TEMPLATE.map((item) => ({ ...item }));
  const falsePressureFindings = scanIapProductCopyForFalsePressure(collectCopyTexts());
  const copyGuardPassed = falsePressureFindings.length === 0;
  const status = resolveStatus(copyGuardPassed);
  const manualSetupBlockers = buildManualSetupBlockers();
  const blockerSummary = [...manualSetupBlockers];

  if (!copyGuardPassed) {
    blockerSummary.unshift({
      id: 'iap.copy_false_pressure',
      title: 'IAP copy false pressure detected',
      message: `${falsePressureFindings.length} dark-pattern phrase(s) in copy pack.`,
    });
  }

  const nextActions: string[] = [
    `Review IAP product copy pack: ${IAP_PRODUCT_COPY_DOCS_PATH}`,
    'Enter TR/EN product names and descriptions in App Store Connect / Play Console.',
    'Align RevenueCat offering display copy with dashboard — do not invent product IDs.',
    'Run sandbox purchase and restore tests on device before marking blockers done.',
    'Do not hardcode prices in offer screen — store provides localized price.',
    'Attach IAP evidence to manual launch tracker only after real tests.',
  ];

  if (!copyGuardPassed) {
    nextActions.unshift('Fix false pressure phrases in IAP copy pack.');
  }

  return {
    packId: IAP_PRODUCT_COPY_PACK_ID,
    status,
    positioningTR: IAP_PRODUCT_COPY_POSITIONING_TR,
    positioningEN: IAP_PRODUCT_COPY_POSITIONING_EN,
    productCopyItems,
    offerScreenCopy: { ...IAP_PRODUCT_COPY_OFFER_SCREEN },
    restoreCopy: { ...IAP_PRODUCT_COPY_RESTORE },
    purchaseStateCopy: { ...IAP_PRODUCT_COPY_PURCHASE_STATES },
    reviewNotes: { ...IAP_PRODUCT_COPY_REVIEW_NOTES },
    falsePressureFindings,
    trustChecklist: IAP_PRODUCT_COPY_TRUST_CHECKLIST.map((t) => ({ ...t })),
    manualSetupBlockers,
    copyGuardPassed,
    productSetupPending: true,
    sandboxPending: true,
    restoreTestPending: true,
    blockerSummary,
    nextActions,
    fakePassGuard: true,
    docsPath: IAP_PRODUCT_COPY_DOCS_PATH,
  };
}

export function assertIapProductCopyIntegrity(): { ok: boolean; message: string } {
  if (IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR.length < 2) {
    return { ok: false, message: 'TR product name alternatives below 2' };
  }
  if (IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN.length < 2) {
    return { ok: false, message: 'EN product name alternatives below 2' };
  }
  if (IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR.length < 1) {
    return { ok: false, message: 'TR product descriptions missing' };
  }
  if (IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN.length < 1) {
    return { ok: false, message: 'EN product descriptions missing' };
  }
  if (IAP_PRODUCT_COPY_BENEFIT_BULLETS_TR.length < IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS) {
    return { ok: false, message: 'Benefit bullets below minimum' };
  }
  if (IAP_PRODUCT_COPY_TRUST_CHECKLIST.length < 8) {
    return { ok: false, message: 'Trust checklist incomplete' };
  }
  if (!IAP_PRODUCT_COPY_REVIEW_NOTES.tr.includes('PENDING')) {
    return { ok: false, message: 'Review notes missing placeholders' };
  }
  return { ok: true, message: 'OK' };
}

export function buildIapProductCopySummary(result: IapProductCopyAuditResult): string {
  return [
    `Pack: ${result.packId}`,
    `Status: ${result.status}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Product setup: pending`,
    `Sandbox: pending`,
    `Restore test: pending`,
    `Items: ${result.productCopyItems.length}`,
    `Docs: ${result.docsPath}`,
  ].join(' | ');
}
