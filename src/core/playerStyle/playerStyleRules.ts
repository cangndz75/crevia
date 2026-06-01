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
  riskLine?: string;
  advisorLine: string;
  tone: PlayerStyleTone;
  tags: string[];
};

export const PLAYER_STYLE_DEFINITIONS: Record<PlayerStyleId, PlayerStyleDefinition> = {
  fast_responder: {
    title: 'Hızlı Müdahaleci',
    shortLabel: 'Hızlı müdahale',
    summary: 'Görünür baskıyı hızlı düşüren kararlar öne çıkıyor.',
    strengthLine: 'Kısa vadeli baskıyı hızlı düşürür.',
    riskLine: 'Araç ve ekip yükü yükselirse yarın dengeyi korumak gerekebilir.',
    advisorLine:
      'Son kararların görünür şikayeti hızlı düşürüyor. Araç ve ekip yükü yükselirse yarın dengeyi koruman gerekebilir.',
    tone: 'strategic',
    tags: ['Hız', 'Saha'],
  },
  preventive_planner: {
    title: 'Önleyici Planlayıcı',
    shortLabel: 'Önleyici plan',
    summary: 'Kararlar bugünden çok yarını rahatlatmaya dönük.',
    strengthLine: 'Yarını rahatlatır, baskı birikimini azaltır.',
    riskLine: 'Bugünkü etki daha sakin görünebilir.',
    advisorLine:
      'Kararların bugünden çok yarını rahatlatmaya dönük. Bugünkü etki daha sakin görünse de baskı birikimini azaltıyorsun.',
    tone: 'calm',
    tags: ['Yarın', 'Plan'],
  },
  public_focused: {
    title: 'Halk Odaklı',
    shortLabel: 'Halk odaklı',
    summary: 'Sosyal görünürlük ve güven sinyalleri öne çıkıyor.',
    strengthLine: 'Halk algısını ve görünür güveni korur.',
    riskLine: 'Saha temposu veya kaynak dengesi yavaşlayabilir.',
    advisorLine:
      'Sosyal görünürlüğü iyi okuyorsun. Bunu saha temposuyla dengelediğinde mahalle güveni daha stabil kalır.',
    tone: 'encouraging',
    tags: ['Sosyal', 'Güven'],
  },
  resource_guardian: {
    title: 'Kaynak Koruyucu',
    shortLabel: 'Kaynak koruma',
    summary: 'Araç ve ekip dayanıklılığını koruyan kararlar öne çıkıyor.',
    strengthLine: 'Sürdürülebilir operasyon çizgisi kurar.',
    riskLine: 'Bazı şikayetler bugün daha yavaş kapanabilir.',
    advisorLine:
      'Araç ve ekip dayanıklılığını koruyan kararlar veriyorsun. Bazı şikayetler daha yavaş kapanabilir, ama yarına daha sağlam girersin.',
    tone: 'calm',
    tags: ['Kaynak', 'Denge'],
  },
  crisis_watcher: {
    title: 'Risk İzleyici',
    shortLabel: 'Risk izleme',
    summary: 'Birleşen sinyalleri büyümeden okuma eğilimi var.',
    strengthLine: 'Sorun büyümeden kontrol altında tutulur.',
    riskLine: 'Görünür sorunlar gecikirse mahalle algısı etkilenebilir.',
    advisorLine:
      'Birleşen sinyalleri krize dönmeden okumaya çalışıyorsun. Görünür sorunları da geciktirmeden dengelemek önemli.',
    tone: 'strategic',
    tags: ['Risk', 'İzleme'],
  },
  balanced_operator: {
    title: 'Dengeci Yönetici',
    shortLabel: 'Dengeci',
    summary: 'Mahalle, kaynak ve sosyal etki arasında dengeli ilerliyor.',
    strengthLine: 'Çoklu baskıyı aynı anda yönetir.',
    riskLine: 'Kritik günlerde hangi baskının öncelikli olduğunu netleştirmek gerekebilir.',
    advisorLine:
      'Kararların mahalle, kaynak ve sosyal etki arasında dengeli ilerliyor. Kritik günlerde hangi baskının öncelikli olduğunu netleştirmen gerekebilir.',
    tone: 'neutral',
    tags: ['Denge', 'Operasyon'],
  },
  inconsistent_operator: {
    title: 'Esnek Yönetici',
    shortLabel: 'Esnek',
    summary: 'Farklı baskılara farklı tepkiler veriliyor; çizgi henüz netleşiyor.',
    strengthLine: 'Esnek müdahale kapasitesi sunar.',
    riskLine: 'Operasyon çizgisi birkaç gün içinde netleşebilir.',
    advisorLine:
      'Farklı baskılara farklı tepkiler veriyorsun. Birkaç gün içinde operasyon çizgin daha net görünecek.',
    tone: 'neutral',
    tags: ['Esnek', 'Gözlem'],
  },
  unknown: {
    title: 'Gözlem Başlıyor',
    shortLabel: 'Gözlem',
    summary: 'Ece birkaç kararını gördükten sonra yönetim tarzını daha net yorumlayacak.',
    strengthLine: 'Henüz yeterli gözlem yok.',
    advisorLine: 'Ece birkaç kararını gördükten sonra yönetim tarzını daha net yorumlayacak.',
    tone: 'calm',
    tags: ['Gözlem'],
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
  resource_heavy: { fast_responder: 2, inconsistent_operator: 1 },
  social_priority: { public_focused: 3 },
  crisis_prevention: { crisis_watcher: 3, preventive_planner: 1 },
  district_balance: { balanced_operator: 3 },
  delayed_response: { preventive_planner: 1, inconsistent_operator: 1 },
  mixed: { balanced_operator: 2, inconsistent_operator: 2 },
};

export const DECISION_KIND_SIGNAL: Record<
  string,
  { kind: PlayerStyleSignalKind; weight: number }
> = {
  fast_response: { kind: 'fast_response', weight: 2.5 },
  preventive_route: { kind: 'preventive', weight: 2.5 },
  balanced_dispatch: { kind: 'district_balance', weight: 2 },
  communication_first: { kind: 'social_priority', weight: 2.5 },
  monitor_only: { kind: 'crisis_prevention', weight: 2 },
  resource_heavy: { kind: 'resource_heavy', weight: 2.5 },
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
