import type { ReadinessDomain, ReadinessPhase, ReadinessStatus } from './operationReadinessTypes';

export const READINESS_DOMAIN_LABELS: Record<ReadinessDomain, string> = {
  personnel: 'Ekip',
  vehicle: 'Araç',
  equipment: 'Ekipman',
  facility: 'Tesis',
  budget: 'Bütçe / Kaynak',
  route: 'Rota',
  social: 'Sosyal Tepki',
  operation: 'Operasyon',
};

export const READINESS_DOMAIN_ICONS: Record<ReadinessDomain, string> = {
  personnel: 'people-outline',
  vehicle: 'car-outline',
  equipment: 'construct-outline',
  facility: 'business-outline',
  budget: 'wallet-outline',
  route: 'navigate-outline',
  social: 'chatbubbles-outline',
  operation: 'pulse-outline',
};

export const READINESS_STATUS_LABELS: Record<ReadinessDomain, Record<ReadinessStatus, string>> = {
  personnel: {
    ready: 'Hazır',
    limited: 'Sınırlı',
    strained: 'Yorgun',
    blocked: 'Riskli',
    unknown: 'İzleniyor',
  },
  vehicle: {
    ready: 'Hazır',
    limited: 'Sınırlı',
    strained: 'Rota Baskısı',
    blocked: 'Uygun Değil',
    unknown: 'İzleniyor',
  },
  equipment: {
    ready: 'Hazır',
    limited: 'Kontrol Gerekir',
    strained: 'Yıpranmış',
    blocked: 'Eksik',
    unknown: 'İzleniyor',
  },
  facility: {
    ready: 'Dengeli',
    limited: 'İzlenmeli',
    strained: 'Baskı Altında',
    blocked: 'Kritik',
    unknown: 'İzleniyor',
  },
  budget: {
    ready: 'Dengeli',
    limited: 'Orta Baskı',
    strained: 'Yüksek Baskı',
    blocked: 'Kritik',
    unknown: 'İzleniyor',
  },
  route: {
    ready: 'Açık',
    limited: 'Yoğun',
    strained: 'Gecikme Riski',
    blocked: 'Aksıyor',
    unknown: 'İzleniyor',
  },
  social: {
    ready: 'Sakin',
    limited: 'İzleniyor',
    strained: 'Yüksek',
    blocked: 'Kritik',
    unknown: 'İzleniyor',
  },
  operation: {
    ready: 'Kontrol Altında',
    limited: 'İzleniyor',
    strained: 'Baskı Altında',
    blocked: 'Durdu',
    unknown: 'İzleniyor',
  },
};

type PhaseCopy = Record<ReadinessStatus, string>;

export const READINESS_DESCRIPTIONS: Record<ReadinessDomain, PhaseCopy> = {
  personnel: {
    ready: 'Ekip sahaya çıkmaya hazır.',
    limited: 'Ekip kapasitesi yeterli ama sınırlı.',
    strained: 'Ekip temposu yüksek, yarına baskı taşıyabilir.',
    blocked: 'Ekip hazırlığı riskli görünüyor.',
    unknown: 'Ekip temposu izleniyor.',
  },
  vehicle: {
    ready: 'Araç operasyon için hazır.',
    limited: 'Araç uygun, rota yoğunluğu izlenmeli.',
    strained: 'Rota baskısı süreyi artırabilir.',
    blocked: 'Araç hazırlığı operasyonu sınırlıyor.',
    unknown: 'Araç durumu izleniyor.',
  },
  equipment: {
    ready: 'Saha ekipmanı yeterli görünüyor.',
    limited: 'Ekipman kontrolü önerilir.',
    strained: 'Ekipman yıpranması müdahale süresini etkileyebilir.',
    blocked: 'Eksik ekipman operasyonu sınırlayabilir.',
    unknown: 'Ekipman durumu izleniyor.',
  },
  facility: {
    ready: 'Saha altyapısı operasyonu destekliyor.',
    limited: 'Tesis kapasitesi izlenmeli.',
    strained: 'Altyapı baskısı müdahale etkisini sınırlayabilir.',
    blocked: 'Tesis kapasitesi kritik sinyal veriyor.',
    unknown: 'Altyapı sinyali izleniyor.',
  },
  budget: {
    ready: 'Kaynak durumu dengede.',
    limited: 'Kaynak kullanımı izlenmeli.',
    strained: 'Plan maliyeti kaynak baskısını artırabilir.',
    blocked: 'Kaynak baskısı operasyonu sınırlıyor.',
    unknown: 'Kaynak nabzı izleniyor.',
  },
  route: {
    ready: 'Rota akışı operasyonu destekliyor.',
    limited: 'Rota yoğunluğu süreyi artırabilir.',
    strained: 'Gecikme riski sosyal tepkiyi büyütebilir.',
    blocked: 'Rota aksaması müdahaleyi zorlaştırıyor.',
    unknown: 'Rota akışı izleniyor.',
  },
  social: {
    ready: 'Sosyal nabız sakin.',
    limited: 'Mahalle beklentisi izleniyor.',
    strained: 'Sosyal tepki yüksek; görünür müdahale gerekebilir.',
    blocked: 'Sosyal baskı kritik seviyede.',
    unknown: 'Sosyal nabız izleniyor.',
  },
  operation: {
    ready: 'Operasyon akışı kontrol altında.',
    limited: 'Saha temposu izleniyor.',
    strained: 'Operasyon baskı altında ilerliyor.',
    blocked: 'Operasyon akışı kritik sinyal veriyor.',
    unknown: 'Operasyon temposu izleniyor.',
  },
};

export const READINESS_FIELD_VALUE_LABELS: Record<
  ReadinessDomain,
  Partial<Record<ReadinessStatus, string>>
> = {
  personnel: {
    ready: 'Stabil',
    limited: 'Normal tempo',
    strained: 'Yoruluyor',
    blocked: 'Zorlanıyor',
    unknown: 'İzleniyor',
  },
  vehicle: {
    ready: 'Akış uygun',
    limited: 'İzleniyor',
    strained: 'Yoğun',
    blocked: 'Bekliyor',
    unknown: 'İzleniyor',
  },
  budget: {
    ready: 'Dengede',
    limited: 'Plan sınırında',
    strained: 'Yüksek tempo',
    blocked: 'Kritik',
    unknown: 'İzleniyor',
  },
  route: {
    ready: 'Kontrol altında',
    limited: 'Yoğun',
    strained: 'Baskı altında',
    blocked: 'Aksıyor',
    unknown: 'İzleniyor',
  },
  social: {
    ready: 'Sakin',
    limited: 'İzleniyor',
    strained: 'Yüksek',
    blocked: 'Kritik',
    unknown: 'İzleniyor',
  },
  operation: {
    ready: 'Kontrol altında',
    limited: 'İzleniyor',
    strained: 'Baskı altında',
    blocked: 'Durdu',
    unknown: 'İzleniyor',
  },
  equipment: {},
  facility: {},
};

export const READINESS_FIELD_ITEM_LABELS: Partial<Record<ReadinessDomain, string>> = {
  personnel: 'Ekip Temposu',
  route: 'Saha Akışı',
  budget: 'Kaynak Kullanımı',
  social: 'Sosyal Nabız',
};

export const OVERALL_STATUS_LABELS: Record<ReadinessStatus, string> = {
  ready: 'Hazır',
  limited: 'Sınırlı',
  strained: 'Baskı Altında',
  blocked: 'Hazırlık Eksik',
  unknown: 'İzleniyor',
};

export const OVERALL_STATUS_SUMMARIES: Record<ReadinessStatus, string> = {
  ready: 'Operasyon hazırlığı güçlü görünüyor.',
  limited: 'Operasyon başlatılabilir, ancak bazı kaynaklar izlenmeli.',
  strained: 'Hazırlık mümkün, fakat ekip ve kaynak baskısı yüksek.',
  blocked: 'Operasyonu başlatmadan önce kritik hazırlık eksikleri var.',
  unknown: 'Hazırlık sinyalleri sınırlı veriyle izleniyor.',
};

export const DISPATCH_OVERALL_LABELS: Record<ReadinessStatus, string> = {
  ready: 'Sahaya hazır',
  limited: 'Sınırlı hazırlık',
  strained: 'Kaynak baskısı yüksek',
  blocked: 'Hazırlık eksik',
  unknown: 'İzleniyor',
};

export function readinessDescriptionForPhase(
  domain: ReadinessDomain,
  status: ReadinessStatus,
  phase: ReadinessPhase,
): string {
  const base = READINESS_DESCRIPTIONS[domain][status];
  if (phase === 'field' && domain === 'personnel' && status === 'unknown') {
    return 'Ekip temposu izleniyor.';
  }
  if (phase === 'field' && domain === 'route' && status === 'ready') {
    return 'Rota akışı kontrol altında.';
  }
  if (phase === 'result' && domain === 'personnel' && status === 'strained') {
    return 'Ekip temposu yarına baskı taşıyabilir.';
  }
  if (phase === 'result' && domain === 'budget' && status === 'limited') {
    return 'Kaynak kullanımı orta seviyede kaldı.';
  }
  return base;
}
