import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  AdvisorRelationshipFamiliarityBand,
  AdvisorRelationshipStyleKind,
  AdvisorRelationshipTrustTone,
  AdvisorRelationshipVisibility,
} from './advisorRelationshipTypes';

export const ADVISOR_RELATIONSHIP_COPY_LIMITS = {
  main: 180,
  supporting: 140,
  report: 160,
  hub: 160,
  result: 140,
  confidence: 100,
  prediction: 150,
} as const;

export const ADVISOR_RELATIONSHIP_FORBIDDEN_TERMS = [
  'aşk',
  'sevgi',
  'romantik',
  'flört',
  'yanlış yaptın',
  'başarısız',
  'felaket',
  'panik',
  'premium',
  'satın al',
  'kilitli',
  'openai',
  'llm',
  'metadata',
  'runtime',
  'content pack',
  'contentpack',
  'güvenmiyor',
  'yanıldı',
  'hata yaptım',
] as const;

export const ADVISOR_RELATIONSHIP_TRUST_UNDERMINING_TERMS = [
  'yanıldı',
  'yanlış yönlendirdim',
  'hata yaptım',
  'güvenmiyor',
  'başarısız oldun',
] as const;

export const ADVISOR_RELATIONSHIP_STYLE_LABELS: Record<AdvisorRelationshipStyleKind, string> = {
  fast_responder: 'Hızlı Müdahaleci',
  social_trust_focused: 'Sosyal Güven Odaklı',
  route_balancer: 'Rota Dengeleyici',
  resource_guardian: 'Kaynak Koruyucu',
  crisis_watcher: 'Kriz Gözcüsü',
  district_mediator: 'Mahalle Uzlaştırıcısı',
  recovery_builder: 'Toparlanma Kurucu',
  balanced_operator: 'Dengeli Operatör',
  unknown: 'Dengeli Operatör',
};

export const ADVISOR_RELATIONSHIP_STYLE_SOFT_LINES: Record<
  AdvisorRelationshipStyleKind,
  string
> = {
  fast_responder:
    'Ece, son günlerde hızlı müdahale kararlarını daha sık kullandığını görüyor; bugün araç temposunu da birlikte izlemek iyi olur.',
  social_trust_focused:
    'Ece, görünür hizmet ve sosyal güveni birlikte okuduğunu görüyor; bugünkü karar tarzın bu çizgide işe yarayabilir.',
  route_balancer:
    'Ece, rota dengesini koruyan kararlarının kısa vadede rahatlama sağladığını not ediyor.',
  resource_guardian:
    'Ece, kaynak temposunu koruyan kararlarının yarına daha sağlam bıraktığını görüyor.',
  crisis_watcher:
    'Ece, birleşen sinyalleri büyümeden okuma eğilimini not ediyor; bugün de erken izleme işe yarar.',
  district_mediator:
    'Ece, mahalle dengesini koruyan kararlarının görünür etkiyi yumuşattığını görüyor.',
  recovery_builder:
    'Ece, toparlanma çizgisini destekleyen kararların etkisini not ediyor.',
  balanced_operator:
    'Ece, bugünkü karar tarzının kaynak ve mahalle dengesini birlikte okuduğunu görüyor.',
  unknown:
    'Ece bugünkü karar tarzını izlemeye devam ediyor; birkaç gün daha netleşir.',
};

export const ADVISOR_RELATIONSHIP_DISTRICT_LINES: Record<MapDistrictId, string> = {
  merkez:
    'Ece Merkez’de görünür hizmet etkisinin rapor dengesiyle birlikte okunmasını öneriyor.',
  cumhuriyet:
    'Ece Cumhuriyet’te konteyner çevresi ile sosyal güveni birlikte izlemeni öneriyor.',
  sanayi:
    'Ece Sanayi’de rota desteğinin işe yaradığını, araç temposunun ise üst üste zorlanmaması gerektiğini not ediyor.',
  istasyon:
    'Ece İstasyon hattında aktarma yoğunluğu ile sosyal nabzı birlikte takip ediyor.',
  yesilvadi:
    'Ece Yeşilvadi’de çevre baskısının sakin ama kalıcı takip istediğini söylüyor.',
};

export const ADVISOR_RELATIONSHIP_DAY_TONE_LINES = {
  day1: 'Ece bu ilk kararda etkiyi birlikte izleyecek.',
  day2_3: 'Ece karar tarzını gözlemliyor.',
  day4_7:
    'Ece hızlı müdahale kararlarının kısa vadede iyi çalıştığını, kaynak temposunu ise yükselttiğini not ediyor.',
  day8_plus:
    'Ece artık kararlarının mahalle dengesi ve kaynak temposuna birlikte yansıdığını daha net okuyor.',
  main_operation:
    'Ece bugün Sanayi rota baskısı ile araç temposunu birlikte izlemeni öneriyor; önceki hızlı müdahale çizgin burada işe yaradı ama üst üste zorlamamak daha güvenli.',
} as const;

export const ADVISOR_RELATIONSHIP_PREDICTION_LINES = {
  prediction_confirmed:
    'Ece’nin dünkü rota uyarısı bugün doğrulandı; Sanayi hattı hâlâ izleme notunda.',
  prediction_softened:
    'Ece, Cumhuriyet için beklenen baskının daha hafif geldiğini not ediyor; sosyal güven toparlanma çizgisinde.',
  prediction_corrected:
    'Ece bu alanda hâlâ gözlem yapıyor; tek karar yerine iki günlük çizgiye bakmak daha sağlıklı.',
  still_observing:
    'Ece bu alanda hâlâ gözlem yapıyor; tek karar yerine iki günlük çizgiye bakmak daha sağlıklı.',
  no_prediction: '',
} as const;

export const ADVISOR_RELATIONSHIP_PREVIOUS_DECISION_TEMPLATES = {
  route_relief:
    'Dünkü {district} rota kararın kısa vadede rahatlama sağladı; bugün araç yorgunluğunu zorlamadan ilerlemek daha güvenli.',
  visible_service:
    'Cumhuriyet’te görünür hizmet etkisi toparlandı. Ece bugün aynı hattı küçük bir kaynak dengesiyle korumanı öneriyor.',
  environmental:
    'Yeşilvadi’de çevre baskısı dün tamamen kapanmadı; bugün daha sakin bir takip kararı işe yarayabilir.',
  generic:
    'Dünkü {district} kararın bugünkü plana kısa bir iz bıraktı; Ece aynı çizgiyi sakin tempoyla sürdürmeni öneriyor.',
} as const;

export const ADVISOR_RELATIONSHIP_RESOURCE_LINES = {
  vehicle:
    'Ece araç temposunun son günlerde yükseldiğini görüyor; bugünkü karar tarzını kaynak dengesiyle birlikte okumak iyi olur.',
  personnel:
    'Ece ekip temposunun son kararlarda belirginleştiğini not ediyor; bugün sakin bir ritim daha güvenli.',
  container:
    'Ece konteyner baskısının kalıcı takip istediğini görüyor; bugünkü karar tarzını bu çizgiyle dengelemek işe yarar.',
  generic:
    'Ece kaynak temposunun son kararlarla birlikte okunması gerektiğini not ediyor.',
} as const;

export function resolveAdvisorRelationshipVisibility(day: number): AdvisorRelationshipVisibility {
  if (day <= 1) return 'compact';
  if (day <= 3) return 'compact';
  if (day <= 7) return 'standard';
  return 'strategic';
}

export function resolveAdvisorRelationshipTrustTone(day: number): AdvisorRelationshipTrustTone {
  if (day <= 1) return 'observing';
  if (day <= 3) return 'observing';
  if (day <= 5) return 'cautious';
  if (day <= 7) return 'clearer';
  if (day <= 14) return 'confident';
  return 'strategic';
}

export function resolveAdvisorRelationshipFamiliarityBand(
  day: number,
): AdvisorRelationshipFamiliarityBand {
  if (day <= 1) return 'new_partner';
  if (day <= 3) return 'learning_player';
  if (day <= 7) return 'recognizes_patterns';
  if (day <= 14) return 'trusted_operator';
  return 'strategic_partner';
}

export const MAP_DISTRICT_IDS: MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
];
