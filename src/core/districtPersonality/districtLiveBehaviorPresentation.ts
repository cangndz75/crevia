import {
  buildDistrictPersonalityPresentation,
  dedupeDistrictPersonalityCopy,
} from './districtPersonalityBindingPresentation';
import type {
  DistrictPersonalityBindingInput,
  DistrictPersonalityKey,
} from './districtPersonalityBindingTypes';

export type DistrictLiveBehaviorTone =
  | 'stable'
  | 'fragile'
  | 'logistics'
  | 'social'
  | 'crisis'
  | 'recovery';

export type DistrictLiveBehaviorSignal = {
  districtId: string;
  districtName: string;
  personalityKey: DistrictPersonalityKey;
  label: string;
  behaviorTone: DistrictLiveBehaviorTone;
  priority: number;
  mapChip?: string;
  cityAgendaLine?: string;
  advisorLine?: string;
  reportLine?: string;
  neglectRecoveryLine?: string;
  socialPressureLine?: string;
  eventBiasLine?: string;
  recommendedActionHint?: {
    actionId: string;
    label: string;
    reason: string;
  };
};

const LIVE_BEHAVIOR_COPY: Record<
  DistrictPersonalityKey,
  {
    tone: DistrictLiveBehaviorTone;
    mapChip: string;
    cityAgenda: (name: string) => string;
    advisor: string;
    report: (name: string) => string;
    neglectRecovery: string;
    socialPressure: (name: string) => string;
    eventBias: (name: string) => string;
    action: DistrictLiveBehaviorSignal['recommendedActionHint'];
    priority: number;
  }
> = {
  civic_core: {
    tone: 'stable',
    mapChip: 'Dengeli mahalle',
    cityAgenda: (name) => `${name} dengeli yapida; gorunur takip guveni korur.`,
    advisor: 'Burada hizli ama dengeli mudahale guveni korur.',
    report: (name) => `${name} dengeli yapisiyla gorunur hizmete olumlu yanit verdi.`,
    neglectRecovery: 'Dengeli mahallede duzenli takip riski buyutmeden kontrol eder.',
    socialPressure: (name) => `${name} sosyal nabzi dengeli; gorunur hizmet mesaji yeterli olabilir.`,
    eventBias: (name) => `${name} icin genel riskler dengeli okunuyor.`,
    action: {
      actionId: 'balanced_visible_followup',
      label: 'Gorunur takip',
      reason: 'Dengeli mahallede sureklilik guven uretir.',
    },
    priority: 48,
  },
  market_pressure: {
    tone: 'social',
    mapChip: 'Sosyal etki yuksek',
    cityAgenda: (name) => `${name} sosyal etkiye acik; gecikme baskiya donusebilir.`,
    advisor: 'Halkla iletisim hamlesi bu bolgede daha degerli.',
    report: (name) => `${name} sosyal etki yapisi nedeniyle gecikmeyi daha gorunur hissetti.`,
    neglectRecovery: 'Sosyal tepki bu bolgede hizli yayilir; iletisim hamlesi riski yumusatabilir.',
    socialPressure: (name) => `${name} sosyal etkiyi hizli buyutebilir; iletisim dili onemli.`,
    eventBias: (name) => `${name} sosyal ve hizmet gorunurlugu olaylarini one cikarabilir.`,
    action: {
      actionId: 'public_communication',
      label: 'Halkla iletisim',
      reason: 'Sosyal etki yuksek oldugu icin gecikme algisini yumusatir.',
    },
    priority: 82,
  },
  industrial_route: {
    tone: 'logistics',
    mapChip: 'Rota hassas',
    cityAgenda: (name) => `${name} rota baskisini kaynak maliyetine cevirebilir.`,
    advisor: 'Ekip gondermeden once rota optimizasyonu daha verimli olabilir.',
    report: (name) => `${name} rota hassasiyeti nedeniyle kaynak baskisini daha belirgin hissettirdi.`,
    neglectRecovery: 'Rota baskisi bu bolgede daha pahaliya doner; kaynak plani gecikmeden yapilmali.',
    socialPressure: (name) => `${name} rota gecikmesini hizmet aksamasina cevirebilir.`,
    eventBias: (name) => `${name} rota ve kaynak baskisi olaylarini daha gorunur kilar.`,
    action: {
      actionId: 'route_optimization',
      label: 'Rota optimizasyonu',
      reason: 'Rota hassasiyeti kaynak kaybini buyutebilir.',
    },
    priority: 84,
  },
  family_residential: {
    tone: 'recovery',
    mapChip: 'Toparlanma acik',
    cityAgenda: (name) => `${name} duzenli takibe hizli toparlanma sinyali verebilir.`,
    advisor: 'Kucuk ama surekli takip bu bolgede daha guclu karsilik bulur.',
    report: (name) => `${name} yasam alani odagi sayesinde duzenli takibe hizli yanit verdi.`,
    neglectRecovery: 'Dogru mudahale bu bolgede hizli toparlanma sinyali uretir.',
    socialPressure: (name) => `${name} sakin takip mesajina olumlu yanit verebilir.`,
    eventBias: (name) => `${name} toparlanma ve yasam alani takibini daha anlamli kilar.`,
    action: {
      actionId: 'support_recovery',
      label: 'Toparlanmayi destekle',
      reason: 'Dogru takip guven toparlanmasini hizlandirir.',
    },
    priority: 72,
  },
  trust_fragile: {
    tone: 'fragile',
    mapChip: 'Guven kirilgan',
    cityAgenda: (name) => `${name} guven kirilgan oldugu icin gecikme sosyal baskiya donusebilir.`,
    advisor: 'Burada hizli ama kontrollu mudahale guven kaybini onler.',
    report: (name) => `${name} guven kirilgan yapisi nedeniyle gecikme etkisini daha belirgin hissetti.`,
    neglectRecovery: 'Bu mahallede guven kirilmasi hizli buyur; geciken mudahale yarina sertlesebilir.',
    socialPressure: (name) => `${name} guven kirilgan; sosyal baski hizli yukselebilir.`,
    eventBias: (name) => `${name} guven ve takip eksigi olaylarini daha hassas okur.`,
    action: {
      actionId: 'controlled_fast_response',
      label: 'Kontrollu hizli mudahale',
      reason: 'Guven kaybi buyumeden gorunur takip gerekir.',
    },
    priority: 90,
  },
  service_sensitive: {
    tone: 'logistics',
    mapChip: 'Hizmet hassas',
    cityAgenda: (name) => `${name} hizmet gorunurlugundeki gecikmeyi hizli hisseder.`,
    advisor: 'Hizmet gorunurlugunu artirmak bu bolgede guveni korur.',
    report: (name) => `${name} hizmet hassasiyeti nedeniyle rutin aksamalari daha net hissettirdi.`,
    neglectRecovery: 'Rutin hizmet gecikirse baski buyur; hazirlik sinyali gorunur kalmali.',
    socialPressure: (name) => `${name} hizmet aksamasini sosyal tepkiye cevirebilir.`,
    eventBias: (name) => `${name} bakim ve rutin hizmet olaylarini daha gorunur kilar.`,
    action: {
      actionId: 'visible_service_check',
      label: 'Hizmet kontrolu',
      reason: 'Rutin gorunurluk guven algisini dogrudan etkiler.',
    },
    priority: 78,
  },
  routine_dependent: {
    tone: 'crisis',
    mapChip: 'Kriz egilimli',
    cityAgenda: (name) => `${name} rutin aksarsa sessiz riski buyutebilir.`,
    advisor: 'Onleyici hamle bu bolgede yarin riskini azaltir.',
    report: (name) => `${name} rutin bagimli yapisiyla gecikme riskini yarina tasidi.`,
    neglectRecovery: 'Rutin aksarsa risk sessizce buyur; onleyici kontrol daha degerli.',
    socialPressure: (name) => `${name} rutin aksamasini gec fark ettirir ama etkisi birikebilir.`,
    eventBias: (name) => `${name} onleyici kontrol ve takip olaylarini one cikarabilir.`,
    action: {
      actionId: 'preventive_check',
      label: 'Onleyici kontrol',
      reason: 'Sessiz birikim yarin krize donusmeden izlenir.',
    },
    priority: 80,
  },
  balanced_unknown: {
    tone: 'stable',
    mapChip: 'Dengeli bolge',
    cityAgenda: (name) => `${name} icin sosyal nabiz ve hizmet gorunurlugu birlikte izlenmeli.`,
    advisor: 'Sosyal nabiz ve hizmet gorunurlugunu birlikte izle.',
    report: (name) => `${name} dengeli sinyal verdi; yarin izleme surmeli.`,
    neglectRecovery: 'Veri sinirliyken dengeli takip en guvenli okuma saglar.',
    socialPressure: (name) => `${name} sosyal nabzi dengeli izleniyor.`,
    eventBias: (name) => `${name} icin belirgin bir karakter baskisi yok.`,
    action: {
      actionId: 'balanced_watch',
      label: 'Dengeli izleme',
      reason: 'Veri sinirliyken tek riske asiri yuklenmeden takip gerekir.',
    },
    priority: 36,
  },
};

function withDistrictName(line: string, districtName: string): string {
  return line.replace(/\bBu mahallede\b/i, `${districtName} hattinda`);
}

export function buildDistrictLiveBehaviorSignal(
  input: DistrictPersonalityBindingInput,
): DistrictLiveBehaviorSignal | null {
  const presentation = buildDistrictPersonalityPresentation(input);
  const copy = LIVE_BEHAVIOR_COPY[presentation.personalityKey];
  const districtName = presentation.districtName || 'Bolge';

  const signal: DistrictLiveBehaviorSignal = {
    districtId: presentation.districtId ?? input.districtId ?? 'district',
    districtName,
    personalityKey: presentation.personalityKey,
    label: presentation.label,
    behaviorTone: copy.tone,
    priority: copy.priority,
    mapChip: copy.mapChip,
    cityAgendaLine: copy.cityAgenda(districtName),
    advisorLine: copy.advisor,
    reportLine: copy.report(districtName),
    neglectRecoveryLine: withDistrictName(copy.neglectRecovery, districtName),
    socialPressureLine: copy.socialPressure(districtName),
    eventBiasLine: copy.eventBias(districtName),
    recommendedActionHint: copy.action,
  };

  const avoidLines = input.avoidLines ?? [];
  if (dedupeDistrictPersonalityCopy(signal.reportLine ?? '', avoidLines)) {
    signal.reportLine = undefined;
  }
  if (dedupeDistrictPersonalityCopy(signal.cityAgendaLine ?? '', avoidLines)) {
    signal.cityAgendaLine = undefined;
  }
  if (dedupeDistrictPersonalityCopy(signal.advisorLine ?? '', avoidLines)) {
    signal.advisorLine = undefined;
  }
  if (dedupeDistrictPersonalityCopy(signal.neglectRecoveryLine ?? '', avoidLines)) {
    signal.neglectRecoveryLine = undefined;
  }

  return signal;
}
