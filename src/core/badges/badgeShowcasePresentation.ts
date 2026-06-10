import type { BadgeCategory, BadgeHistorySource, BadgeId, BadgeRarity } from './badgeTypes';
import type { BadgeShowcaseCategory, BadgeShowcaseState } from './badgeShowcaseTypes';

export const BADGE_SHOWCASE_CATEGORY_ORDER: BadgeShowcaseCategory[] = [
  'operations',
  'trust',
  'resources',
  'strategy',
  'authority',
  'city_memory',
];

export const BADGE_SHOWCASE_CATEGORY_LABELS: Record<BadgeShowcaseCategory, string> = {
  operations: 'Operasyon',
  trust: 'Güven',
  resources: 'Kaynak',
  strategy: 'Strateji',
  authority: 'Yetki',
  city_memory: 'Şehir Hafızası',
};

export const BADGE_SHOWCASE_CATEGORY_SUBTITLES: Record<BadgeShowcaseCategory, string> = {
  operations: 'Saha kararları ve görev tamamlama izleri',
  trust: 'Mahalle güveni ve sosyal nabız dengesi',
  resources: 'Personel, araç ve konteyner dengesi',
  strategy: 'Uzun vadeli karar etkisi ve istikrar',
  authority: 'Yetki seviyesi ve terfi adaylığı',
  city_memory: 'Pilot dönemi ve şehirde bıraktığın iz',
};

export const BADGE_SHOWCASE_PRESTIGE_BANDS: Record<BadgeRarity, string> = {
  common: 'Saha Başlangıcı',
  uncommon: 'Güvenilir Operatör',
  rare: 'Şehir Hafızasında',
  epic: 'Kriz Ustası',
};

export const BADGE_SHOWCASE_STATE_PILLS: Record<BadgeShowcaseState, string> = {
  earned: 'Kazanıldı',
  in_progress: 'Yaklaşıyor',
  locked: 'Kilitli',
};

export const BADGE_SHOWCASE_EMPTY_STATE = {
  title: 'İlk rozetin sahada bekliyor',
  body: 'İlk birkaç kararın operasyon tarzını belirleyecek. Rozet vitrini şehirde bıraktığın izi burada gösterecek.',
  ctaLabel: 'Operasyona dön',
} as const;

export const BADGE_SHOWCASE_HUB_CTA = 'Vitrine bak';

const CATEGORY_DOMAIN_MAP: Record<BadgeCategory, BadgeShowcaseCategory> = {
  operations: 'operations',
  publicTrust: 'trust',
  resources: 'resources',
  personnel: 'resources',
  crisis: 'operations',
  authority: 'authority',
  consistency: 'strategy',
  pilot: 'city_memory',
};

const BADGE_CATEGORY_OVERRIDES: Partial<Record<BadgeId, BadgeShowcaseCategory>> = {
  butterfly_handler: 'strategy',
  pilot_finisher: 'city_memory',
  crisis_cooler: 'operations',
};

const STYLE_SIGNALS: Record<BadgeShowcaseCategory, string> = {
  operations: 'Saha odaklı, kararlı operatör',
  trust: 'Mahalleyle dengeli ilişki kuran profil',
  resources: 'Kaynak baskısını yöneten operatör',
  strategy: 'Uzun vadeli etkiyi gözeten karar verici',
  authority: 'Yetki gelişimine odaklı kariyer çizgisi',
  city_memory: 'Şehir hafızasına iz bırakan operatör',
};

const SYSTEM_TAGS: Record<BadgeShowcaseCategory, string> = {
  operations: 'Operasyon kararları',
  trust: 'Sosyal nabız',
  resources: 'Kaynak yönetimi',
  strategy: 'Uzun vadeli etki',
  authority: 'Yetki sistemi',
  city_memory: 'Pilot & arşiv',
};

const EARNED_REASONS: Partial<Record<BadgeId, string>> = {
  first_step: 'İlk günlük operasyonu tamamladığın için kazanıldı.',
  steady_operator: 'Üst üste istikrarlı operasyon günleri kapattığın için kazanıldı.',
  public_listener: 'Mahalle güvenini dengeli tuttuğun için kazanıldı.',
  budget_guardian: 'Kaynak baskısı altındayken bütçe disiplinini koruduğun için kazanıldı.',
  team_caretaker: 'Personel moralini koruyan sonuçlar ürettiğin için kazanıldı.',
  crisis_cooler: 'Kriz kararlarında güven kaybını sınırladığın için kazanıldı.',
  route_mind: 'Rota ve araç kararlarında olumlu etki ürettiğin için kazanıldı.',
  container_watch: 'Konteyner riskini kontrol altında tuttuğun için kazanıldı.',
  butterfly_handler: 'Kelebek etkisini başarıyla yönettiğin için kazanıldı.',
  authority_candidate: 'Terfi adaylığı oluşturduğun için kazanıldı.',
  promoted_operator: 'Resmi yetki değerlendirmesinde yeni görevlendirme açtığın için kazanıldı.',
  pilot_finisher: 'Pilot dönemini tamamladığın için kazanıldı.',
};

const IN_PROGRESS_HINTS: Partial<Record<BadgeId, string>> = {
  steady_operator: 'Birkaç başarılı saha kararı daha bu rozeti açabilir.',
  public_listener: 'Sosyal Nabız etkisini toparladığında bu rozet görünür olur.',
  budget_guardian: 'Bütçe dengesini koruyarak birkaç gün daha ilerle.',
  team_caretaker: 'Personel moralini koruyan günlerle yaklaşabilirsin.',
  route_mind: 'Araç yorgunluğunu daha dengeli yöneterek yaklaşabilirsin.',
  container_watch: 'Konteyner müdahalelerini dengeli yöneterek ilerle.',
  crisis_cooler: 'Kritik riski büyümeden kapattığında rozet açılır.',
  butterfly_handler: 'Follow-up sonucunu başarıyla yönettiğinde tamamlanır.',
  authority_candidate: 'Yetki güvenini artırarak terfi adaylığına yaklaş.',
  promoted_operator: 'Üst yönetim değerlendirmesinde terfi sinyali oluştur.',
  first_step: 'İlk günlük operasyonu tamamladığında açılır.',
  pilot_finisher: 'Pilot dönemini tamamladığında kazanılır.',
};

const LOCKED_HINTS: Partial<Record<BadgeId, string>> = {
  authority_candidate: 'Daha yüksek yetki seviyelerinde açılır.',
  promoted_operator: 'Resmi yetki değerlendirmesi tamamlandığında görünür olur.',
  pilot_finisher: 'Pilot dönemi tamamlandığında açılır.',
  butterfly_handler: 'Ana operasyon zincirleri derinleşince açılır.',
  crisis_cooler: 'Kritik olayları yönettiğinde rozet yolu açılır.',
  steady_operator: 'Ardışık başarılı operasyon günleriyle ilerler.',
  public_listener: 'Mahalle güvenini dengede tutarak ilerle.',
};

const IN_PROGRESS_MOTIVATION = 'Yaklaşıyorsun — bir adım daha yakınsın.';

const SOURCE_REASON_FRAGMENTS: Record<BadgeHistorySource, string> = {
  daily_report: 'günlük operasyon değerlendirmesinde',
  pilot_completion: 'pilot tamamlama değerlendirmesinde',
  authority_evaluation: 'yetki değerlendirmesinde',
};

const RARITY_WEIGHT: Record<BadgeRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
};

export function mapBadgeCategoryToShowcaseCategory(
  badgeId: BadgeId,
  category: BadgeCategory,
): BadgeShowcaseCategory {
  return BADGE_CATEGORY_OVERRIDES[badgeId] ?? CATEGORY_DOMAIN_MAP[category] ?? 'operations';
}

export function buildShowcaseCategoryLabel(category: BadgeShowcaseCategory): string {
  return BADGE_SHOWCASE_CATEGORY_LABELS[category] ?? 'Operasyon';
}

export function buildShowcasePrestigeBandLabel(rarity: BadgeRarity): string {
  return BADGE_SHOWCASE_PRESTIGE_BANDS[rarity] ?? BADGE_SHOWCASE_PRESTIGE_BANDS.common;
}

export function buildShowcaseStatePillLabel(state: BadgeShowcaseState): string {
  return BADGE_SHOWCASE_STATE_PILLS[state];
}

export function buildShowcaseStyleSignal(category: BadgeShowcaseCategory): string {
  return STYLE_SIGNALS[category];
}

export function buildShowcaseSystemTag(category: BadgeShowcaseCategory): string {
  return SYSTEM_TAGS[category];
}

export function buildShowcaseEarnedReason(
  badgeId: BadgeId,
  source?: BadgeHistorySource,
): string {
  const base = EARNED_REASONS[badgeId];
  if (base) {
    return base;
  }
  if (source) {
    return `${SOURCE_REASON_FRAGMENTS[source]} kazanıldı.`;
  }
  return 'Operasyon performansın bu rozeti açtı.';
}

export function buildShowcaseInProgressHint(badgeId: BadgeId): string {
  return IN_PROGRESS_HINTS[badgeId] ?? 'Birkaç başarılı saha kararı daha bu rozeti açabilir.';
}

export function buildShowcaseLockedHint(badgeId: BadgeId, category: BadgeShowcaseCategory): string {
  if (LOCKED_HINTS[badgeId]) {
    return LOCKED_HINTS[badgeId]!;
  }
  if (category === 'authority') {
    return 'Daha yüksek yetki seviyelerinde açılır.';
  }
  if (category === 'city_memory') {
    return 'Uzun vadeli şehir hafızası oluştuğunda görünür olur.';
  }
  if (category === 'strategy') {
    return 'Ana operasyon zincirleri derinleşince açılır.';
  }
  return 'Operasyon derinleştikçe bu rozet yoluna girer.';
}

export function buildShowcaseInProgressMotivation(): string {
  return IN_PROGRESS_MOTIVATION;
}

export function buildShowcaseHeadline(earnedCount: number, completionRatio: number): string {
  if (earnedCount === 0) {
    return BADGE_SHOWCASE_EMPTY_STATE.title;
  }
  if (completionRatio >= 0.75) {
    return 'Yetkin artarken vitrinin de güçleniyor';
  }
  if (completionRatio >= 0.5) {
    return 'Sahadaki izlerin rozetlere dönüştü';
  }
  if (completionRatio >= 0.25) {
    return 'Operasyon tarzın görünür oldu';
  }
  return 'Şehir seni tanımaya başladı';
}

export function buildShowcaseSubline(earnedCount: number): string {
  if (earnedCount === 0) {
    return BADGE_SHOWCASE_EMPTY_STATE.body;
  }
  if (earnedCount < 4) {
    return 'Kazandığın rozetler karar alışkanlıklarını ve şehirde bıraktığın izi gösterir.';
  }
  return 'Bazı rozetler başarıyı, bazıları ise yaklaşan uzmanlığı temsil eder.';
}

export function buildShowcasePrestigeLabel(
  earnedCount: number,
  highestRarity: BadgeRarity | null,
): string {
  if (earnedCount === 0) {
    return 'Saha yolculuğu başlıyor';
  }
  if (highestRarity === 'epic') {
    return 'Belediye vitrininde üst düzey iz';
  }
  if (highestRarity === 'rare' || earnedCount >= 6) {
    return 'Şehir seni tanıyor';
  }
  if (earnedCount >= 3) {
    return 'Güvenilir operatör profili';
  }
  return 'İlk izler vitrine düştü';
}

export function buildShowcaseDetailBody(
  state: BadgeShowcaseState,
  description: string,
  earnedReason?: string,
  unlockHint?: string,
  progressLabel?: string,
): string {
  if (state === 'earned' && earnedReason) {
    return earnedReason;
  }
  if (state === 'in_progress') {
    const parts = [buildShowcaseInProgressMotivation()];
    if (progressLabel) {
      parts.push(`İlerleme: ${progressLabel}.`);
    }
    if (unlockHint) {
      parts.push(unlockHint);
    }
    return parts.join(' ');
  }
  if (unlockHint) {
    return unlockHint;
  }
  return description;
}

export function compareBadgeRarityDesc(a: BadgeRarity, b: BadgeRarity): number {
  return RARITY_WEIGHT[b] - RARITY_WEIGHT[a];
}
