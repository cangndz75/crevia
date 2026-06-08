import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { OnboardingStarterDecisionId } from '@/core/onboarding/onboardingStarterDecision';

import {
  ONBOARDING_DECISION_STYLE_BY_ID,
  ONBOARDING_DISTRICT_OPTIONS,
  ONBOARDING_FALLBACK_DECISION_STYLE,
  ONBOARDING_FALLBACK_DISTRICT_ID,
} from './onboardingContinuationConstants';
import type {
  OnboardingContinuationViewModel,
  OnboardingDecisionStyle,
  OnboardingDistrictOption,
  OnboardingPilotDistrictId,
} from './onboardingContinuationTypes';

type DistrictCopy = {
  eceBase: string;
  briefingBody: string;
  focus: string;
  caution: string;
  mapHint: string;
  socialBase: string;
};

type DecisionCopy = {
  label: string;
  eceLine: string;
  reactionSuffix: string;
  effects: OnboardingContinuationViewModel['firstImpact']['effects'];
};

const DISTRICT_COPY: Record<OnboardingPilotDistrictId, DistrictCopy> = {
  merkez: {
    eceBase:
      'Merkez dengeli bir başlangıç alanı. Burada halk güveni, ekip temposu ve kaynak dengesi net okunur.',
    briefingBody: 'Merkez öğretici başlar; kararların etkisi hızlı ama sakin görünür.',
    focus: 'Hizmet yükünü dengeli okuyup ilk kararın etkisini gözlemlemek.',
    caution: 'Kaynak kullanımını hafife alma; küçük kararlar da iz bırakır.',
    mapHint: 'Merkezde ilk düzenleme sakin bir iz bıraktı.',
    socialBase: 'Merkezde ilk düzenleme sakin ama olumlu karşılandı.',
  },
  cumhuriyet: {
    eceBase:
      'Cumhuriyet’te halk beklentisi yüksek. Görünür hizmet güveni artırabilir, ekip temposu izlenmeli.',
    briefingBody: 'Cumhuriyet görünür hizmet baskısını erken hissettirir.',
    focus: 'Halk beklentisini hızlı ve görünür hizmetle dengelemek.',
    caution: 'Hızlı müdahale güveni artırabilir, fakat ekip temposunu yükseltebilir.',
    mapHint: 'Cumhuriyet hattında görünür hizmet etkisi başladı.',
    socialBase: 'Cumhuriyet’te sabah hattındaki hareketlilik fark edilmiş görünüyor.',
  },
  sanayi: {
    eceBase:
      'Sanayi hattında zamanlama ve araç kullanımı kritik. Kaynak baskısı daha çabuk görünür.',
    briefingBody: 'Sanayi rota, araç ve vardiya temposunu birlikte okutacaktır.',
    focus: 'Rota ve araç kullanımını kontrollü tutmak.',
    caution: 'Kaynak baskısı karar sonrasında daha görünür olabilir.',
    mapHint: 'Sanayi hattında ekip temposu görünür oldu.',
    socialBase: 'Sanayi tarafında ekip temposu dikkat çekmeye başladı.',
  },
  istasyon: {
    eceBase:
      'İstasyon’da akış ve zamanlama önemlidir. Küçük bir gecikme günün temposunu değiştirebilir.',
    briefingBody: 'İstasyon transfer akışını ve saat baskısını öne çıkarır.',
    focus: 'Akış saatlerini ve transfer yoğunluğunu izlemek.',
    caution: 'Küçük gecikmeler çevre mahallelere de baskı taşıyabilir.',
    mapHint: 'İstasyon çevresinde akış değişimi görünür oldu.',
    socialBase: 'İstasyon çevresinde akışın değiştiği konuşuluyor.',
  },
  yesilvadi: {
    eceBase:
      'Yeşilvadi’de çevre dengesi ve konteyner düzeni öne çıkar. Sakin kararlar güçlü iz bırakır.',
    briefingBody: 'Yeşilvadi sakin görünür, ama çevre hassasiyeti kararı görünür kılar.',
    focus: 'Konteyner düzenini ve çevre hassasiyetini korumak.',
    caution: 'Küçük gecikmeler ertesi güne iz bırakabilir.',
    mapHint: 'Yeşilvadi’de çevre düzeni için küçük bir rahatlama başladı.',
    socialBase: 'Yeşilvadi’de çevre düzeniyle ilgili küçük bir rahatlama hissediliyor.',
  },
};

const DECISION_COPY: Record<OnboardingDecisionStyle, DecisionCopy> = {
  fast_response: {
    label: 'Hızlı Müdahale',
    eceLine:
      'Seçtiğin yaklaşım hızlı sonuç verir. Halk bunu çabuk fark eder, ekip yorgunluğu izlenmeli.',
    reactionSuffix: 'Erken müdahale fark edildi.',
    effects: [
      {
        label: 'Halk güveni',
        value: 'Olumlu',
        body: 'Görünür sonuç hızlı fark edilir.',
        tone: 'positive',
      },
      {
        label: 'Ekip dengesi',
        value: 'Baskılı',
        body: 'Ekip temposu biraz yükselir.',
        tone: 'pressure',
      },
      {
        label: 'Yarın riski',
        value: 'İzlenmeli',
        body: 'Kaynak yorgunluğu takip edilmeli.',
        tone: 'watch',
      },
    ],
  },
  planned_solution: {
    label: 'Planlı Çözüm',
    eceLine:
      'Planlı yaklaşım kalıcı düzen kurar. Etkisi sakin görünür, yarına daha temiz iz bırakabilir.',
    reactionSuffix: 'Daha düzenli bir akış beklentisi oluştu.',
    effects: [
      {
        label: 'Halk güveni',
        value: 'Dengeli',
        body: 'Etkisi daha sakin görünür.',
        tone: 'balanced',
      },
      {
        label: 'Ekip dengesi',
        value: 'Kontrollü',
        body: 'Program daha düzenli ilerler.',
        tone: 'positive',
      },
      {
        label: 'Yarın riski',
        value: 'Düşük',
        body: 'Kalıcı düzen yarına daha temiz iz bırakabilir.',
        tone: 'balanced',
      },
    ],
  },
  partial_intervention: {
    label: 'Kısmi Müdahale',
    eceLine:
      'Kısmi müdahale kaynakları korur. Bazı mahalle baskıları kısa süre izlenmeye devam edebilir.',
    reactionSuffix: 'Kaynaklar korunurken bazı noktalar izlenmeye devam ediyor.',
    effects: [
      {
        label: 'Halk güveni',
        value: 'Hassas',
        body: 'Halk etkisi hemen güçlü görünmeyebilir.',
        tone: 'watch',
      },
      {
        label: 'Ekip dengesi',
        value: 'Rahat',
        body: 'Kaynaklar korunur.',
        tone: 'positive',
      },
      {
        label: 'Yarın riski',
        value: 'İzlenmeli',
        body: 'Baskı kısa süre takipte kalabilir.',
        tone: 'watch',
      },
    ],
  },
};

export function normalizeOnboardingDistrictId(
  id: OnboardingPilotDistrictId | null | undefined,
): OnboardingPilotDistrictId {
  return id && ONBOARDING_DISTRICT_OPTIONS.some((item) => item.id === id)
    ? id
    : ONBOARDING_FALLBACK_DISTRICT_ID;
}

export function normalizeOnboardingDecisionStyle(
  style: OnboardingDecisionStyle | null | undefined,
): OnboardingDecisionStyle {
  return style ?? ONBOARDING_FALLBACK_DECISION_STYLE;
}

export function mapStarterDecisionToContinuationStyle(
  decisionId: OnboardingStarterDecisionId | string | null | undefined,
): OnboardingDecisionStyle {
  if (decisionId === 'planned' || decisionId === 'partial' || decisionId === 'fast') {
    return ONBOARDING_DECISION_STYLE_BY_ID[decisionId];
  }
  return ONBOARDING_FALLBACK_DECISION_STYLE;
}

export function getOnboardingDistrictOption(
  id: OnboardingPilotDistrictId | null | undefined,
): OnboardingDistrictOption {
  const normalized = normalizeOnboardingDistrictId(id);
  return (
    ONBOARDING_DISTRICT_OPTIONS.find((option) => option.id === normalized) ??
    ONBOARDING_DISTRICT_OPTIONS[0]!
  );
}

export function mapOnboardingDistrictToGameDistrict(
  id: OnboardingPilotDistrictId | null | undefined,
): PilotDistrictId {
  return getOnboardingDistrictOption(id).gameDistrictId;
}

export function buildOnboardingContinuationViewModel(
  districtId: OnboardingPilotDistrictId | null | undefined,
  decisionStyle: OnboardingDecisionStyle | null | undefined,
): OnboardingContinuationViewModel {
  const district = getOnboardingDistrictOption(districtId);
  const districtCopy = DISTRICT_COPY[district.id];
  const style = normalizeOnboardingDecisionStyle(decisionStyle);
  const decisionCopy = DECISION_COPY[style];

  return {
    eceIntro: {
      title: `${district.title}: ilk operasyon notu`,
      body: `${districtCopy.eceBase} ${decisionCopy.eceLine}`,
      advisorLabel: 'Operasyon Danışmanı',
      toneChip: 'İlk brifing',
      fieldFocus: districtCopy.focus,
      decisionApproach: decisionCopy.label,
    },
    fieldBriefing: {
      districtName: district.title,
      title: 'İlk saha brifingi',
      body: districtCopy.briefingBody,
      focus: districtCopy.focus,
      caution: districtCopy.caution,
      chips: [
        {
          label: district.metrics.socialRisk.label,
          value: district.metrics.socialRisk.value,
          tone: district.metrics.socialRisk.tone === 'low' ? 'low' : district.metrics.socialRisk.tone === 'high' ? 'high' : 'medium',
        },
        {
          label: district.metrics.staffPace.label,
          value: district.metrics.staffPace.value,
          tone: district.metrics.staffPace.tone === 'high' ? 'high' : 'medium',
        },
        {
          label: district.metrics.difficulty.label,
          value: district.metrics.difficulty.value,
          tone: district.metrics.difficulty.tone === 'low' ? 'low' : district.metrics.difficulty.tone === 'high' ? 'high' : 'medium',
        },
      ],
    },
    firstImpact: {
      title: 'İlk etkin hazır',
      body: 'Seçtiğin yaklaşım ilk operasyon izini oluşturdu.',
      effects: decisionCopy.effects,
    },
    cityReaction: {
      districtName: district.title,
      mapHint: districtCopy.mapHint,
      socialBubble: `${districtCopy.socialBase} ${decisionCopy.reactionSuffix}`,
      eceLine: 'Şehir küçük etkileri hemen göstermeye başlar.',
      reactionTone: style === 'fast_response' ? 'positive' : style === 'partial_intervention' ? 'watch' : 'balanced',
    },
    centerUnlocked: {
      title: 'Merkez açıldı',
      body: 'Günlük operasyon akışını artık buradan takip edeceksin.',
      lines: [
        'Ece günlük önerilerini burada paylaşır.',
        'Haritada mahallelerin durumunu izlersin.',
        'Gün sonunda kararlarının raporunu alırsın.',
      ],
    },
  };
}

export function collectOnboardingContinuationStrings(
  model: OnboardingContinuationViewModel,
): string[] {
  return [
    model.eceIntro.title,
    model.eceIntro.body,
    model.eceIntro.fieldFocus,
    model.eceIntro.decisionApproach,
    model.fieldBriefing.districtName,
    model.fieldBriefing.title,
    model.fieldBriefing.body,
    model.fieldBriefing.focus,
    model.fieldBriefing.caution,
    ...model.fieldBriefing.chips.flatMap((chip) => [chip.label, chip.value]),
    model.firstImpact.title,
    model.firstImpact.body,
    ...model.firstImpact.effects.flatMap((effect) => [effect.label, effect.value, effect.body]),
    model.cityReaction.mapHint,
    model.cityReaction.socialBubble,
    model.cityReaction.eceLine,
    model.centerUnlocked.title,
    model.centerUnlocked.body,
    ...model.centerUnlocked.lines,
  ];
}
