import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import { pilotAreaFromDistrict } from '@/features/map/data/pilotAreaMapping';
import { buildMapOperationPanelModel } from '@/features/map/utils/mapUiPresentation';
import { verifyMapUiScenario } from '@/features/map/verifyMapUiScenario';

import {
  MAP_DISTRICT_IDENTITY_IDS,
  DISTRICT_IDENTITIES,
} from './districtIdentityConstants';
import {
  buildDistrictEventContextLine,
  buildDistrictFlavorLine,
  buildDistrictIdentitySummary,
  buildDistrictMapPanelLines,
  buildDistrictRiskChips,
  collectDistrictIdentityPresentationStrings,
  districtIdentityTextContainsBannedWords,
  getDistrictIdentity,
  normalizeMapDistrictId,
} from './districtIdentityPresentation';

export type VerifyDistrictIdentityOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyDistrictIdentityScenario(): VerifyDistrictIdentityOutcome {
  const checks: Check[] = [];

  assert(
    checks,
    MAP_DISTRICT_IDENTITY_IDS.length === 5,
    '5 mahalle için identity tanımı vardır',
    `count=${MAP_DISTRICT_IDENTITY_IDS.length}`,
  );

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    const identity = DISTRICT_IDENTITIES[id];
    assert(
      checks,
      Boolean(identity?.name?.trim() && identity.summary?.trim() && identity.personality?.trim()),
      `Identity içerikleri dolu (${id})`,
      identity?.name ?? 'missing',
    );
    assert(
      checks,
      identity?.riskProfile != null &&
        typeof identity.riskProfile.social === 'string',
      `Risk profili tanımlı (${id})`,
    );
  }

  const unknown = getDistrictIdentity('unknown_district_xyz');
  assert(
    checks,
    unknown.name === 'Operasyon Bölgesi' &&
      unknown.summary.includes('saha etkisi'),
    'Unknown id fallback döner',
    unknown.name,
  );

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    const panelLines = buildDistrictMapPanelLines(id);
    assert(
      checks,
      panelLines.length >= 1 && panelLines.length <= 2,
      `Map panel lines max 2 (${id})`,
      `lines=${panelLines.length}`,
    );

    const chips = buildDistrictRiskChips(id);
    assert(
      checks,
      chips.length >= 1 && chips.length <= 3,
      `Risk chips max 3 (${id})`,
      `chips=${chips.length}`,
    );

    const eventLine = buildDistrictEventContextLine(id);
    assert(
      checks,
      eventLine.length > 0 && !eventLine.includes('\n'),
      `Event context tek satır (${id})`,
      `len=${eventLine.length}`,
    );
  }

  const istasyon = getDistrictIdentity('istasyon');
  const istasyonPostPilotOk =
    (istasyon.personality.toLowerCase().includes('post-pilot') ||
      istasyon.personality.toLowerCase().includes('geçiş')) &&
    (istasyon.eventContextLine.toLowerCase().includes('geçiş') ||
      istasyon.eventContextLine.toLowerCase().includes('yoğunluk'));
  assert(
    checks,
    istasyonPostPilotOk,
    'İstasyon post-pilot geçiş diliyle uyumlu',
    istasyon.eventContextLine,
  );

  const bannedHits = MAP_DISTRICT_IDENTITY_IDS.flatMap((id) =>
    collectDistrictIdentityPresentationStrings(id).flatMap((text) =>
      districtIdentityTextContainsBannedWords(text).map((word) => `${word}@${id}`),
    ),
  );
  assert(
    checks,
    bannedHits.length === 0,
    'Yasaklı kelime taraması 0',
    bannedHits.join('; '),
  );

  let nullSafeOk = true;
  try {
    getDistrictIdentity(null);
    getDistrictIdentity(undefined);
    buildDistrictRiskChips(null);
    buildDistrictMapPanelLines(undefined);
    buildDistrictEventContextLine('');
    buildDistrictFlavorLine(null, 'event');
    buildDistrictIdentitySummary(undefined);
    normalizeMapDistrictId(null);
  } catch {
    nullSafeOk = false;
  }
  assert(checks, nullSafeOk, 'Presentation helper null/undefined ile crash olmaz');

  let mapPanelUndefinedOk = true;
  try {
    const lines = buildDistrictMapPanelLines('not_a_real_district');
    mapPanelUndefinedOk = lines.length > 0;
  } catch {
    mapPanelUndefinedOk = false;
  }
  assert(
    checks,
    mapPanelUndefinedOk,
    'Map panel unknown district güvenli',
  );

  let mapBottomPanelOk = true;
  try {
    const panel = buildMapOperationPanelModel({
      viewMode: 'overview',
      focusDistrictId: 'unknown_zone' as ReturnType<typeof mapDistrictFromPilot>,
      pilotAreaId: pilotAreaFromDistrict(DEFAULT_PILOT_DISTRICT_ID),
      pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
      gameDay: 1,
      activeEvents: [],
    });
    mapBottomPanelOk =
      panel.visible &&
      (panel.characterLine?.length ?? 0) > 0 &&
      (panel.identityRiskChips?.length ?? 0) > 0;
  } catch {
    mapBottomPanelOk = false;
  }
  assert(
    checks,
    mapBottomPanelOk,
    'MapOperationBottomPanel seçili bölge tanımsızken crash olmaz',
  );

  const mapUi = verifyMapUiScenario();
  assert(
    checks,
    mapUi.ok,
    'Existing map-ui verify bozulmaz',
    `failCount=${mapUi.failCount}`,
  );

  const eventResultUi = verifyEventResultUiScenario();
  assert(
    checks,
    eventResultUi.ok,
    'Existing event-result-ui verify bozulmaz',
    `failCount=${eventResultUi.failCount}`,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
