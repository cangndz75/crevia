import {
  DISTRICT_BONUS_AMOUNT,
  DISTRICT_BONUS_QUICK_RESOLVE,
  DISTRICT_BONUS_SOCIAL_RISK_MODERATE,
} from '@/core/xp/constants';
import type {
  DistrictBonusFlags,
  DistrictBonusInput,
  DistrictBonusResult,
  XpBreakdownItem,
  XpDistrictType,
} from '@/core/xp/types';

const DISTRICT_ID_ALIASES: Record<string, XpDistrictType> = {
  merkez: 'merkez',
  central: 'merkez',
  pazar: 'pazar',
  industrial_market: 'pazar',
  sanayipazar: 'pazar',
  sanayi: 'sanayi',
  yesilpark: 'yesilpark',
  cumhuriyet: 'cumhuriyet',
  istasyon: 'istasyon',
};

export function resolveXpDistrictType(
  districtId?: string,
  districtType?: XpDistrictType,
): XpDistrictType | undefined {
  if (districtType) {
    return districtType;
  }
  if (!districtId) {
    return undefined;
  }
  const normalized = districtId.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return DISTRICT_ID_ALIASES[normalized];
}

function pushBonus(
  items: XpBreakdownItem[],
  title: string,
  description?: string,
): void {
  if (items.some((item) => item.title === title)) {
    return;
  }
  items.push({
    category: 'district',
    amount: DISTRICT_BONUS_AMOUNT,
    title,
    description,
  });
}

function pushQuickResolve(items: XpBreakdownItem[]): void {
  items.push({
    category: 'district',
    amount: DISTRICT_BONUS_QUICK_RESOLVE,
    title: 'Hızlı müdahale',
    description: 'Olay kısa sürede çözüldü',
  });
}

function pushModerateSocialRiskBonus(items: XpBreakdownItem[]): void {
  const title = 'Sosyal risk önlendi';
  if (items.some((item) => item.title === title)) {
    return;
  }
  items.push({
    category: 'district',
    amount: DISTRICT_BONUS_SOCIAL_RISK_MODERATE,
    title,
    description: 'Mahalle güveni korunarak yayılım sınırlandı',
  });
}

function bonusesForMerkez(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.socialRiskPrevented) {
    pushBonus(items, 'Sosyal risk önlendi');
  }
  if (flags.publicTrustProtected) {
    pushBonus(items, 'Kamu güveni korundu');
  }
  if (flags.resolvedQuickly) {
    pushQuickResolve(items);
  }
}

function bonusesForPazar(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.trafficReduced) {
    pushBonus(items, 'Yoğunluk kontrol edildi', 'Trafik ve akış rahatlatıldı');
  }
  if (flags.crowdControlled) {
    pushBonus(items, 'Kalabalık yönetildi');
  }
  if (flags.publicTrustProtected) {
    pushBonus(items, 'Kamu güveni korundu');
  }
}

function bonusesForSanayi(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.vehicleBreakdownPrevented) {
    pushBonus(items, 'Araç arızası önlendi');
  }
  if (flags.trafficReduced) {
    pushBonus(items, 'Yoğunluk kontrol edildi', 'Rota ve trafik baskısı azaltıldı');
  }
  // İleride risk ciddi düşüşü (+15) buraya eklenebilir.
}

function bonusesForCumhuriyet(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.publicTrustProtected) {
    pushBonus(items, 'Kamu güveni korundu');
  }
  if (flags.resolvedQuickly) {
    pushQuickResolve(items);
  }
  if (flags.socialRiskPrevented) {
    pushModerateSocialRiskBonus(items);
  }
}

function bonusesForYesilpark(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.parkOrderProtected) {
    pushBonus(items, 'Park düzeni korundu');
  }
  if (flags.publicTrustProtected) {
    pushBonus(items, 'Kamu güveni korundu');
  }
  if (flags.resolvedQuickly) {
    pushQuickResolve(items);
  }
}

function bonusesForIstasyon(flags: DistrictBonusFlags, items: XpBreakdownItem[]): void {
  if (flags.crowdControlled) {
    pushBonus(items, 'Kalabalık yönetildi');
  }
  if (flags.trafficReduced) {
    pushBonus(items, 'Yoğunluk kontrol edildi');
  }
  if (flags.publicTrustProtected) {
    pushBonus(items, 'Kamu güveni korundu');
  }
}

/**
 * Mahalleye göre çarpan uygulamaz; yalnızca özel koşul bayraklarına göre bonus üretir.
 */
export function calculateDistrictBonus(input: DistrictBonusInput): DistrictBonusResult {
  const districtType = resolveXpDistrictType(input.districtId, input.districtType);
  const items: XpBreakdownItem[] = [];

  if (!districtType) {
    return { total: 0, items };
  }

  switch (districtType) {
    case 'merkez':
      bonusesForMerkez(input.flags, items);
      break;
    case 'pazar':
      bonusesForPazar(input.flags, items);
      break;
    case 'sanayi':
      bonusesForSanayi(input.flags, items);
      break;
    case 'yesilpark':
      bonusesForYesilpark(input.flags, items);
      break;
    case 'cumhuriyet':
      bonusesForCumhuriyet(input.flags, items);
      break;
    case 'istasyon':
      bonusesForIstasyon(input.flags, items);
      break;
    default:
      break;
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return { total, items };
}
