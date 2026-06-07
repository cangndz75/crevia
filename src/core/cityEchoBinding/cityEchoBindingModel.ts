import {
  buildPackCityEchoKind,
  buildPackEchoSurfaceLines,
  isContentPackWiringEligibleDay,
  makeContentPackDuplicateKey,
  resolveContentPackMetaForWiring,
} from '@/core/contentRuntimeActivation/contentRuntimeActivationWiring';
import { getNeighborhoodDisplayName } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';

import {
  buildCityEchoHubLine,
  diversifySurfaceLines,
  isDuplicateCityEchoLine,
  makeCityEchoDuplicateKey,
  sanitizeCityEchoCopy,
  shouldSuppressFallbackAcrossSurfaces,
} from './cityEchoBindingPresentation';
import type {
  CityEchoBinding,
  CityEchoBindingInput,
  CityEchoBindingKind,
  CityEchoBindingSourceKind,
  CityEchoBindingTone,
} from './cityEchoBindingTypes';

function packMetaFromInput(input: CityEchoBindingInput) {
  return resolveContentPackMetaForWiring({
    event: input.event,
    contentPackMeta: input.contentPackMeta,
    eventId: input.snapshot?.eventId,
    districtId:
      input.snapshot?.neighborhoodId ??
      input.decisionImpact?.relatedDistrictId ??
      input.tomorrowRisk?.relatedDistrictId,
    day: input.day,
    eventPool: input.eventPool,
    postPilotCatalog: input.postPilotCatalog,
  });
}

function districtLabel(input: CityEchoBindingInput): string {
  const packMeta = packMetaFromInput(input);
  if (packMeta) {
    return (
      input.snapshot?.neighborhoodName?.trim() ||
      getNeighborhoodDisplayName(packMeta.districtId) ||
      'şehir'
    );
  }
  return (
    input.snapshot?.neighborhoodName?.trim() ||
    input.decisionImpact?.relatedDistrictId ||
    input.tomorrowRisk?.relatedDistrictId ||
    input.operationSignals?.priorityDistrictId ||
    'şehir'
  );
}

function relatedDomain(input: CityEchoBindingInput): string {
  return (
    input.decisionImpact?.relatedDomain ||
    input.tomorrowRisk?.relatedDomain ||
    input.snapshot?.eventType ||
    input.operationSignals?.dailyFocus ||
    'operation'
  );
}

function relatedResource(input: CityEchoBindingInput): string | undefined {
  return input.decisionImpact?.relatedResource ?? input.tomorrowRisk?.relatedResource;
}

function hasPressure(signal?: { status?: string; score?: number }): boolean {
  return (
    signal?.status === 'critical' ||
    signal?.status === 'strained' ||
    (typeof signal?.score === 'number' && signal.score >= 65)
  );
}

function dominantPressure(input: CityEchoBindingInput): string | undefined {
  const signals = input.operationSignals;
  if (!signals) return undefined;
  if (hasPressure(signals.vehicles)) return 'vehicle';
  if (hasPressure(signals.containers)) return 'container';
  if (hasPressure(signals.personnel)) return 'personnel';
  if (hasPressure(signals.districts)) return 'district';
  if (hasPressure(signals.overall)) return 'resource';
  return undefined;
}

function sourceKind(input: CityEchoBindingInput): CityEchoBindingSourceKind {
  const packMeta = packMetaFromInput(input);
  if (packMeta && isContentPackWiringEligibleDay(input.day)) return 'event_echo';
  if (input.decisionImpact) return 'decision_impact';
  if (input.tomorrowRisk) return 'tomorrow_risk';
  if (input.carryOverSummary) return 'carry_over';
  if (dominantPressure(input)) return 'operation_signal';
  if (input.socialPulse) return 'social_pulse';
  return 'fallback';
}

function kindFor(input: CityEchoBindingInput): CityEchoBindingKind {
  if (input.carryOverSummary) return 'carry_over_echo';
  if (input.tomorrowRisk) {
    if (input.tomorrowRisk.kind === 'operation_era_hint') return 'operation_era_echo';
    if (input.tomorrowRisk.kind === 'post_pilot_next_scope') return 'post_pilot_scope_echo';
    return 'tomorrow_risk_echo';
  }
  const packMeta = packMetaFromInput(input);
  if (packMeta && isContentPackWiringEligibleDay(input.day)) {
    return buildPackCityEchoKind(packMeta);
  }
  const pressure = dominantPressure(input);
  if (pressure === 'vehicle') return 'vehicle_fatigue_echo';
  if (pressure === 'container') return 'container_pressure_echo';
  if (pressure === 'personnel') return 'personnel_fatigue_echo';
  if (pressure === 'district') return 'district_trust_echo';

  const domain = relatedDomain(input);
  if (domain === 'route') return 'route_balance_echo';
  if (domain === 'container') return 'container_pressure_echo';
  if (domain === 'personnel') return 'personnel_fatigue_echo';
  if (domain === 'social') return 'social_trust_echo';
  if (domain === 'district') return 'district_trust_echo';
  if (domain === 'crisis') return 'crisis_prevention_echo';
  if (input.decisionImpact?.tone === 'recovery') return 'recovery_momentum_echo';
  if (input.decisionImpact) return 'decision_tradeoff_echo';
  if (input.snapshot || input.eventEchoLine) return 'generic_city_echo';
  return 'fallback';
}

function toneFor(kind: CityEchoBindingKind, input: CityEchoBindingInput): CityEchoBindingTone {
  if (kind.includes('fatigue') || kind.includes('pressure')) return 'watch';
  if (kind === 'crisis_prevention_echo') return 'recovery';
  if (kind === 'recovery_momentum_echo') return 'recovery';
  if (input.decisionImpact?.tone === 'positive') return 'positive';
  if (input.tomorrowRisk?.tone === 'risk') return 'risk';
  if (input.tomorrowRisk?.tone === 'recovery') return 'recovery';
  return 'operational';
}

function linesFor(kind: CityEchoBindingKind, input: CityEchoBindingInput) {
  const packMeta = packMetaFromInput(input);
  if (packMeta && isContentPackWiringEligibleDay(input.day)) {
    const surfaces = buildPackEchoSurfaceLines(packMeta);
    const decisionTomorrow = input.decisionImpact?.tomorrowLine;
    const tomorrowRiskLine = input.tomorrowRisk?.mainLine;
    const tomorrow =
      decisionTomorrow && !isDuplicateCityEchoLine(decisionTomorrow, [surfaces.report])
        ? decisionTomorrow
        : tomorrowRiskLine &&
            !isDuplicateCityEchoLine(tomorrowRiskLine, [surfaces.report, surfaces.ece])
          ? tomorrowRiskLine
          : surfaces.tomorrow;
    return {
      ece: surfaces.ece,
      social: surfaces.social,
      report: surfaces.report,
      tomorrow,
      hub: surfaces.hub,
    };
  }

  const district = districtLabel(input);
  const decisionLine = input.decisionImpact?.mainLine;
  const tomorrow = input.tomorrowRisk?.mainLine ?? input.decisionImpact?.tomorrowLine;
  const carry = input.carryOverSummary;

  if (kind === 'carry_over_echo') {
    return {
      ece: `Dünkü kararın izi bugün plana taşınıyor; ${district} çevresi dengeli izlenmeli.`,
      social: `${district} tarafında dünkü müdahalenin etkisi bugün de fark ediliyor.`,
      report: carry ?? `Dünkü karar ${district} için izleme notu bıraktı.`,
      tomorrow: tomorrow ?? `Yarın ${district} çevresindeki iz tekrar kontrol edilmeli.`,
      hub: carry ? `Dünkü iz: ${carry}` : `Dünkü karar ${district} için kısa bir iz bıraktı.`,
    };
  }

  if (kind === 'vehicle_fatigue_echo' || kind === 'route_balance_echo') {
    return {
      ece: `Sanayi rotasında rahatlama var; aynı tempoyu araçlar üzerinde zorlamamak gerekiyor.`,
      social: `${district} hattında rota bugün biraz daha akıcı hissedildi.`,
      report: `${district} rotasında görünür rahatlama oluştu; araç yorgunluğu izleme notu olarak kaldı.`,
      tomorrow: tomorrow ?? `Yarın ${district} hattında rota dengesi korunmalı.`,
      hub: `Dünkü rota kararı ${district} hattını rahatlattı; araç yorgunluğu bugün izleniyor.`,
    };
  }

  if (kind === 'container_pressure_echo') {
    return {
      ece: `${district} çevresinde konteyner baskısı azaldı; kalan yoğunluk yarına not bırakıyor.`,
      social: `${district} çevresinde konteyner noktaları hala konuşuluyor.`,
      report: `${district} konteyner hattında rahatlama var; kalan baskı izleme notu olarak kaldı.`,
      tomorrow: tomorrow ?? `Yarın ${district} konteyner çevresi tekrar izlenmeli.`,
      hub: `${district} konteyner baskısı azaldı; kalan yoğunluk bugün izleniyor.`,
    };
  }

  if (kind === 'personnel_fatigue_echo') {
    return {
      ece: `Bugünkü görünür hizmet etkisi güçlüydü; ekip yorgunluğu yarına izleme notu kaldı.`,
      social: `${district} tarafında ekiplerin daha erken görünmesi bugün fark edildi.`,
      report: `Görünür hizmet etkisi desteklendi; ekip yorgunluğu izleme notu olarak kaldı.`,
      tomorrow: tomorrow ?? 'Yarın vardiya temposu kısa rotasyonla dengelenmeli.',
      hub: 'Dünkü ekip temposu bugün daha dikkatli dengeleniyor.',
    };
  }

  if (kind === 'social_trust_echo' || kind === 'district_trust_echo') {
    return {
      ece: `${district} güveni toparlanıyor; yarın aynı etkiyi sakin tempoyla korumak mantıklı.`,
      social: `${district} tarafında ekiplerin görünmesi bugün iyi karşılandı.`,
      report: `${district} güveninde toparlanma sinyali kayda geçti.`,
      tomorrow: tomorrow ?? `Yarın ${district} geri bildirimi izlenmeli.`,
      hub: `${district} güveni toparlanıyor; bugünkü plan bunu korumalı.`,
    };
  }

  if (kind === 'tomorrow_risk_echo') {
    return {
      ece: `Yarın için ana not net: ${input.tomorrowRisk?.mainLine ?? 'kalan baskı sakin izlenmeli.'}`,
      social: `${district} çevresinde yarına kalan etki sahada konuşuluyor.`,
      report: input.tomorrowRisk?.mainLine ?? 'Yarın için tek ana izleme notu oluşturuldu.',
      tomorrow: input.tomorrowRisk?.mainLine,
      hub: input.tomorrowRisk?.supportLine ?? input.tomorrowRisk?.mainLine,
    };
  }

  if (kind === 'operation_era_echo' || kind === 'post_pilot_scope_echo') {
    return {
      ece: 'Ana operasyon bağlamı güçleniyor; bugünkü karar yarının kapsamını daha okunur yaptı.',
      social: 'Şehir genelinde ana operasyon etkisi daha görünür hale geliyor.',
      report: 'Ana operasyon kapsamı için bugünkü karar kısa bir kayıt bıraktı.',
      tomorrow: tomorrow ?? 'Yarın ana operasyon kapsamı daha net izlenmeli.',
      hub: 'Ana operasyon izi bugün daha görünür.',
    };
  }

  return {
    ece: decisionLine ?? 'Bugünkü karar kısa vadeli dengeyi etkiledi; kalan baskı izlenmeli.',
    social: `${district} tarafında bugünkü müdahale sahada fark edildi.`,
    report: decisionLine ?? 'Bugünkü karar operasyon kaydına kısa bir etki bıraktı.',
    tomorrow: tomorrow ?? 'Yarın kalan baskı raporda izlenebilir.',
    hub: 'Dünkü karar bugünkü plan için kısa bir iz bıraktı.',
  };
}

export function buildCityEchoBinding(input: CityEchoBindingInput): CityEchoBinding {
  const kind = kindFor(input);
  const source = sourceKind(input);
  const domain = relatedDomain(input);
  const districtId =
    input.snapshot?.neighborhoodId ??
    input.decisionImpact?.relatedDistrictId ??
    input.tomorrowRisk?.relatedDistrictId ??
    input.operationSignals?.priorityDistrictId;
  const resource = relatedResource(input);
  const resolvedPackMeta = packMetaFromInput(input);
  const raw = linesFor(kind, input);
  const base: CityEchoBinding = {
    id: `city-echo-${input.day}-${districtId ?? 'city'}-${kind}`,
    kind,
    sourceKind: source,
    relatedEventId: input.snapshot?.eventId ?? input.decisionImpact?.id,
    relatedDistrictId: districtId,
    relatedDomain: domain,
    relatedResource: resource,
    priority: source === 'decision_impact' || source === 'tomorrow_risk' ? 'high' : 'medium',
    tone: toneFor(kind, input),
    eceLine: sanitizeCityEchoCopy(raw.ece, 'ece'),
    socialLine: sanitizeCityEchoCopy(raw.social, 'social'),
    reportLine: sanitizeCityEchoCopy(raw.report, 'report'),
    tomorrowLine: sanitizeCityEchoCopy(raw.tomorrow, 'tomorrow'),
    hubLine: sanitizeCityEchoCopy(raw.hub, 'hub'),
    sourceSignals: {
      hasDecisionImpact: Boolean(input.decisionImpact),
      hasTomorrowRisk: Boolean(input.tomorrowRisk),
      hasCarryOver: Boolean(input.carryOverSummary),
      hasOperationSignal: Boolean(input.operationSignals),
      hasSocialPulse: Boolean(input.socialPulse),
      hasResourcePressure: Boolean(dominantPressure(input)),
    },
    duplicateKey: resolvedPackMeta
      ? makeContentPackDuplicateKey(resolvedPackMeta, source)
      : makeCityEchoDuplicateKey({
          districtId,
          domain,
          resource,
          sourceKind: source,
        }),
    confidence: source === 'fallback' ? 'fallback' : source === 'operation_signal' ? 'medium' : 'high',
    maxVisibleLines: input.day <= 1 ? 1 : 2,
    shouldShowAdvisor: input.day >= 1,
    shouldShowSocial: input.day > 1 && source !== 'fallback',
    shouldShowReport: input.day > 1,
    shouldShowHub: input.day > 1 && source !== 'fallback',
    shouldShowTomorrow: Boolean(raw.tomorrow) && input.day > 1,
  };

  let binding = diversifySurfaceLines(base);

  if (isDuplicateCityEchoLine(binding.reportLine, input.existingLines)) {
    binding = { ...binding, shouldShowReport: false };
  }
  if (isDuplicateCityEchoLine(buildCityEchoHubLine(binding), input.existingLines)) {
    binding = { ...binding, shouldShowHub: false };
  }
  if (shouldSuppressFallbackAcrossSurfaces(binding, input)) {
    binding = {
      ...binding,
      shouldShowSocial: false,
      shouldShowReport: false,
      shouldShowHub: false,
      shouldShowTomorrow: false,
    };
  }

  return binding;
}
