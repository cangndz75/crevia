import type {
  PlayerStyleId,
  PlayerStyleObservation,
  PlayerStyleSignalKind,
  PlayerStyleTone,
} from './playerStyleTypes';

export type PlayerStyleDefinition = {
  title: string;
  shortLabel: string;
  summary: string;
  strengthLine: string;
  strengthLineAlt?: string;
  riskLine?: string;
  advisorLine: string;
  tone: PlayerStyleTone;
  tags: string[];
  currentSignal: string;
};

export const PLAYER_STYLE_DEFINITIONS: Record<PlayerStyleId, PlayerStyleDefinition> = {
  fast_responder: {
    title: 'Krizci Yönetici',
    shortLabel: 'Hızlı müdahale odaklı',
    summary: 'Risk büyümeden sahaya hızlı hamle yapıyorsun.',
    strengthLine: 'Güveni hızlı toparlayabilir.',
    strengthLineAlt: 'Kritik olayları bekletmez.',
    riskLine: 'Ekip temposu yorulabilir.',
    advisorLine:
      'Yine hızlı çözüme yaslanıyorsun. Güven toparlanır, ama ekip temposunu izle.',
    tone: 'strategic',
    tags: ['Hızlı müdahale', 'Güven odağı'],
    currentSignal: 'Son kararlarda hızlı müdahale eğilimi görünüyor.',
  },
  preventive_planner: {
    title: 'Önleyici Planlayıcı',
    shortLabel: 'Yarın riskini azaltmaya odaklı',
    summary: 'Bugünkü hamleleri yarınki baskıyı azaltacak şekilde kuruyorsun.',
    strengthLine: 'Tekrarlayan olay riskini azaltabilir.',
    strengthLineAlt: 'Mahalle hafızasında istikrar yaratır.',
    riskLine: 'Anlık kaynak maliyeti yüksek olabilir.',
    advisorLine:
      'Önleyici düşünüyorsun. Bugünkü maliyet yarınki baskıyı azaltabilir.',
    tone: 'calm',
    tags: ['Önleyici plan', 'Yarın'],
    currentSignal: 'Son kararlarda yarını rahatlatma eğilimi var.',
  },
  public_focused: {
    title: 'Halk Odaklı',
    shortLabel: 'Güven ve sosyal nabız odaklı',
    summary: 'Kararlarında mahalle güvenini ve görünür etkiyi öne alıyorsun.',
    strengthLine: 'Sosyal tepki daha hızlı sakinleşebilir.',
    strengthLineAlt: 'Mahalle hafızasında olumlu iz bırakabilir.',
    riskLine: 'Kaynak maliyeti görünmez büyüyebilir.',
    advisorLine:
      'Halk güvenini öncelemen olumlu. Kaynak baskısını görünmez bırakma.',
    tone: 'encouraging',
    tags: ['Sosyal güven', 'Görünür etki'],
    currentSignal: 'Son kararlarda halk güveni önceliği öne çıkıyor.',
  },
  resource_guardian: {
    title: 'Kaynak Koruyucu',
    shortLabel: 'Maliyet ve kapasite odaklı',
    summary: 'Kaynakları dikkatli kullanıyor, operasyon baskısını sınırlamaya çalışıyorsun.',
    strengthLine: 'Bütçe ve ekip temposu korunur.',
    strengthLineAlt: 'Uzun vadeli kapasite daha dengeli kalır.',
    riskLine: 'Geciken müdahale güveni zayıflatabilir.',
    advisorLine:
      'Kaynakları koruyorsun. Bu iyi, fakat gecikme algısı güveni zayıflatabilir.',
    tone: 'calm',
    tags: ['Kaynak koruma', 'Kapasite'],
    currentSignal: 'Son kararlarda kaynak koruma eğilimi belirgin.',
  },
  crisis_watcher: {
    title: 'Risk İzleyici',
    shortLabel: 'Birleşen sinyalleri erken okur',
    summary: 'Birleşen sinyalleri büyümeden okuma eğilimi var.',
    strengthLine: 'Sorun büyümeden kontrol altında tutulur.',
    strengthLineAlt: 'Kriz öncesi erken uyarı sağlar.',
    riskLine: 'Görünür sorunlar gecikirse mahalle algısı etkilenebilir.',
    advisorLine:
      'Birleşen sinyalleri krize dönmeden okumaya çalışıyorsun. Görünür sorunları da geciktirmeden dengelemek önemli.',
    tone: 'strategic',
    tags: ['Risk izleme', 'Erken uyarı'],
    currentSignal: 'Son kararlarda risk izleme eğilimi görünüyor.',
  },
  balanced_operator: {
    title: 'Dengeli Operatör',
    shortLabel: 'Risk ve kaynak dengesini korur',
    summary: 'Kararlarında etki, risk ve kaynak bedelini birlikte tartıyorsun.',
    strengthLine: 'Ani riskleri büyütmeden ilerler.',
    strengthLineAlt: 'Kaynak baskısını kontrol altında tutar.',
    riskLine: 'Bazı krizlerde etki yavaş kalabilir.',
    advisorLine:
      'Dengeli çizgin riski büyütmeden ilerliyor. Sosyal nabzı izlemeye devam et.',
    tone: 'neutral',
    tags: ['Denge', 'Operasyon'],
    currentSignal: 'Son kararlarda dengeli operasyon eğilimi var.',
  },
  route_focused: {
    title: 'Rota Disiplinli',
    shortLabel: 'Akış ve saha düzeni odaklı',
    summary: 'Operasyon akışını, rota düzenini ve saha sürekliliğini önemsiyorsun.',
    strengthLine: 'Rutin hizmet baskısını azaltır.',
    strengthLineAlt: 'Saha verimliliğini korur.',
    riskLine: 'Sosyal tepkiyi bazen geç fark edebilir.',
    advisorLine:
      'Rota düzenine yaslanıyorsun. Akış korunur, sosyal nabzı da ara sıra kontrol et.',
    tone: 'neutral',
    tags: ['Rota düzeni', 'Saha akışı'],
    currentSignal: 'Son kararlarda rota ve akış disiplini öne çıkıyor.',
  },
  district_loyalist: {
    title: 'Mahalle Sadakatli',
    shortLabel: 'Belirli bölgelere yoğunlaşır',
    summary: 'Bazı mahallelere güçlü odaklanıyor, orada güveni toparlamaya çalışıyorsun.',
    strengthLine: 'Odaklandığın bölgede iz bırakır.',
    strengthLineAlt: 'Mahalle hafızasını güçlendirebilir.',
    riskLine: 'Diğer bölgelerde beklenti birikebilir.',
    advisorLine:
      'Belirli mahallelere yoğunlaşıyorsun. Odak güçlü, diğer bölgeleri de izle.',
    tone: 'strategic',
    tags: ['Mahalle odağı', 'Güven'],
    currentSignal: 'Son günlerde aynı mahallelere tekrar odaklanıyorsun.',
  },
  inconsistent_operator: {
    title: 'Uyumlu Yönetici',
    shortLabel: 'Duruma göre tarz değiştirir',
    summary: 'Tek bir kalıba bağlı kalmadan olayın ihtiyacına göre karar veriyorsun.',
    strengthLine: 'Farklı risklere esnek yanıt verir.',
    strengthLineAlt: 'Kaynak ve güven dengesini duruma göre kurar.',
    riskLine: 'Net bir uzmanlık çizgisi geç oluşabilir.',
    advisorLine:
      'Farklı baskılara farklı tepkiler veriyorsun. Birkaç gün içinde operasyon çizgin daha net görünecek.',
    tone: 'neutral',
    tags: ['Esnek', 'Uyum'],
    currentSignal: 'Son kararlarda tarz değişimi görülüyor; çizgi netleşiyor.',
  },
  unknown: {
    title: 'Yeni Yönetici',
    shortLabel: 'Tarz oluşuyor',
    summary: 'Karar tarzın henüz netleşiyor. Birkaç operasyon sonra eğilimlerin daha görünür olacak.',
    strengthLine: 'Esnek başlangıç.',
    strengthLineAlt: 'Farklı stratejileri deneme alanı.',
    riskLine: 'Henüz belirgin karar paterni yok.',
    advisorLine: 'Birkaç kararını gördükten sonra yönetim tarzını daha net yorumlayacağım.',
    tone: 'calm',
    tags: ['Gözlem'],
    currentSignal: 'Karar tarzın henüz oluşuyor.',
  },
};

/** Signal kind → style score deltas */
export const SIGNAL_STYLE_WEIGHTS: Record<
  PlayerStyleSignalKind,
  Partial<Record<PlayerStyleId, number>>
> = {
  fast_response: { fast_responder: 3, inconsistent_operator: 0.5 },
  preventive: { preventive_planner: 3, crisis_watcher: 1 },
  resource_saving: { resource_guardian: 3, balanced_operator: 1 },
  resource_heavy: { fast_responder: 2, route_focused: 1.5, inconsistent_operator: 1 },
  social_priority: { public_focused: 3 },
  crisis_prevention: { crisis_watcher: 3, preventive_planner: 1 },
  district_balance: { balanced_operator: 3 },
  route_continuity: { route_focused: 3, balanced_operator: 1 },
  district_focus: { district_loyalist: 3, public_focused: 1 },
  delayed_response: { preventive_planner: 1, inconsistent_operator: 1 },
  mixed: { balanced_operator: 2, inconsistent_operator: 2 },
};

export const DECISION_KIND_SIGNAL: Record<
  string,
  { kind: PlayerStyleSignalKind; weight: number }
> = {
  fast_response: { kind: 'fast_response', weight: 2.5 },
  rapid_response: { kind: 'fast_response', weight: 2.5 },
  preventive_route: { kind: 'preventive', weight: 2.5 },
  long_term_fix: { kind: 'preventive', weight: 2.5 },
  balanced_dispatch: { kind: 'district_balance', weight: 2 },
  balanced_plan: { kind: 'district_balance', weight: 2 },
  communication_first: { kind: 'social_priority', weight: 2.5 },
  monitor_only: { kind: 'crisis_prevention', weight: 2 },
  resource_heavy: { kind: 'resource_heavy', weight: 2.5 },
  resource_saving: { kind: 'resource_saving', weight: 2.5 },
};

export const DOMINANCE_GAP = 2.5;
export const HIGH_DOMINANCE_SCORE = 8;
export const BALANCED_GAP_THRESHOLD = 1.75;

export function scorePlayerStylesFromObservations(
  observations: PlayerStyleObservation[],
): Record<PlayerStyleId, number> {
  const scores: Record<PlayerStyleId, number> = {
    fast_responder: 0,
    preventive_planner: 0,
    public_focused: 0,
    resource_guardian: 0,
    crisis_watcher: 0,
    balanced_operator: 0,
    route_focused: 0,
    district_loyalist: 0,
    inconsistent_operator: 0,
    unknown: 0,
  };

  for (const obs of observations) {
    const weights = SIGNAL_STYLE_WEIGHTS[obs.kind];
    if (!weights) continue;
    for (const [styleId, delta] of Object.entries(weights)) {
      const id = styleId as PlayerStyleId;
      if (id in scores) {
        scores[id] += (delta ?? 0) * obs.weight;
      }
    }
  }

  return scores;
}

export function pickTopStyles(
  scores: Record<PlayerStyleId, number>,
): { top: PlayerStyleId; second: PlayerStyleId; topScore: number; secondScore: number } {
  const ranked = (Object.entries(scores) as [PlayerStyleId, number][])
    .filter(([id]) => id !== 'unknown')
    .sort((a, b) => b[1] - a[1]);

  const top = ranked[0]?.[0] ?? 'unknown';
  const second = ranked[1]?.[0] ?? 'unknown';
  return {
    top,
    second,
    topScore: ranked[0]?.[1] ?? 0,
    secondScore: ranked[1]?.[1] ?? 0,
  };
}
