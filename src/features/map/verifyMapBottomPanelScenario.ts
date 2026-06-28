import { composeMapBottomPanelPresentation, resolveMapPanelCtaLabel } from './utils/mapBottomPanelPresentation';
import type { MapGameplayMarker } from './utils/mapGameplayPresentation';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';

function resolvedMarker(): MapGameplayMarker {
  return {
    id: 'marker-resolved-test',
    type: 'resolved',
    title: 'Park Güvenliği Toparlandı',
    subtitle: 'Operasyon tamamlandı',
    districtName: 'İnönü Parkı',
    severity: 'low',
    status: 'resolved',
    coordinate: { x: 28, y: 52 },
  };
}

function activeMarker(): MapGameplayMarker {
  return {
    id: 'marker-active-test',
    type: 'active_event',
    title: 'Mahalle Güveni Düşüyor',
    subtitle: 'Saha sinyali yükseldi',
    districtName: 'Cumhuriyet Mahallesi',
    severity: 'medium',
    status: 'active',
    coordinate: { x: 36, y: 58 },
    eventId: 'evt-1',
    eventDetailRoute: '/events/evt-1',
  };
}

export function verifyMapBottomPanelScenario(): { ok: boolean; lines: string[] } {
  const lines: string[] = [];
  const assert = (ok: boolean, label: string) => {
    lines.push(ok ? `PASS ${label}` : `FAIL ${label}`);
  };

  const resolvedPanel = composeMapBottomPanelPresentation({
    marker: resolvedMarker(),
    navIndex: 1,
    navTotal: 4,
    activeOperationCard: null,
    activeOperationBinding: null,
    activeEventCount: 1,
    operationalResources: createInitialOperationalResourcesState(1),
  });

  assert(resolvedPanel.primaryActionLabel === 'Sonucu İncele', 'resolved CTA Sonucu İncele');
  assert(resolvedPanel.statusLabel === 'Çözüldü', 'resolved status pill');
  assert(resolvedPanel.navLabel === 'Olay 2/4', 'nav label format');
  assert(!resolvedPanel.primaryActionLabel.includes('Operasyonu Aç'), 'resolved not Operasyonu Aç');
  assert(resolvedPanel.chips.length === 3, 'three compact chips');
  assert(resolvedPanel.footerContextLabel === 'Son Etki', 'resolved footer context');

  const inspectCta = resolveMapPanelCtaLabel({
    marker: activeMarker(),
    phase: 'inspecting',
    bindingMatches: true,
    activeOperationCard: null,
  });
  assert(inspectCta === 'Olayı İncele', 'inspect phase CTA');

  const startCta = resolveMapPanelCtaLabel({
    marker: activeMarker(),
    phase: 'before_inspect',
    bindingMatches: true,
    activeOperationCard: null,
  });
  assert(startCta === 'Operasyonu Başlat', 'before_inspect CTA');

  const activePanel = composeMapBottomPanelPresentation({
    marker: activeMarker(),
    navIndex: 0,
    navTotal: 1,
    activeOperationCard: null,
    activeOperationBinding: {
      id: 'bind-1',
      eventId: 'evt-1',
      title: 'Test',
      phase: 'before_inspect',
      phaseLabel: 'İnceleme öncesi',
      mapLine: 'Aktif operasyon bu bölgede başlıyor',
      decisionLine: '',
      signalKinds: [],
      sourceIds: [],
      confidence: 'high',
      visibilityLevel: 'detailed',
      tone: 'inspect',
      priority: 80,
      isActionable: true,
      canOpenOperation: true,
      canShowRouteHint: false,
      canShowDistrictContext: true,
      accessibilityLabel: 'Test',
    },
    activeEventCount: 1,
    operationalResources: createInitialOperationalResourcesState(1),
    gameDay: 3,
    activeEvents: [
      {
        id: 'evt-1',
        title: 'Mahalle Güveni Düşüyor',
        category: 'social',
        riskLevel: 'medium',
        district: 'Cumhuriyet Mahallesi',
        description: 'Sosyal risk yükseldi.',
        contextTag: 'Sosyal Risk',
        urgencyHours: 4,
        decisions: [],
        previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
      },
    ],
  });

  assert(activePanel.contextLine.includes('Sosyal Risk'), 'context line domain');
  assert(activePanel.statusLabel === 'İnceleme', 'inspect status pill');
  assert(activePanel.primaryActionLabel === 'Operasyonu Başlat', 'active binding CTA');
  assert(activePanel.socialEcho?.surface === 'map', 'map bottom panel social echo');
  assert(
    Boolean(activePanel.socialEcho?.title && activePanel.socialEcho.message.length <= 96),
    'map social echo compact copy',
  );

  const ok = lines.every((line) => line.startsWith('PASS'));
  return { ok, lines };
}

if (require.main === module) {
  const result = verifyMapBottomPanelScenario();
  for (const line of result.lines) console.log(line);
  if (!result.ok) process.exit(1);
}
