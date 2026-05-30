import type {
  Day1HubGuidanceModel,
  FirstEventGuidanceModel,
  FirstReportGuidanceModel,
  FirstResultGuidanceModel,
  OnboardingHint,
  OnboardingWorkflowStepId,
  PilotBriefingModel,
  WorkflowStepHintModel,
} from './onboardingTypes';

export const ONBOARDING_MAX_HINT_TEXT_LENGTH = 160;

/** Mobil satır kırılımı için güvenli kısaltma */
export function mobileSafeLine(text: string, maxLen = 96): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }
  return `${slice.trim()}…`;
}

export const ONBOARDING_HINTS: readonly OnboardingHint[] = [
  {
    id: 'onb_hub_intro_d1',
    moment: 'hub_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Pilot göreve hoş geldin',
    text: 'Bu hafta bir pilot bölgeyi yöneteceksin. Önceliğin, olayları doğru sırayla çözmek ve gün sonunda dengeli rapor almak.',
    ctaText: 'İlk olayı incele',
    tone: 'info',
    targetKey: 'critical_event_card',
    priority: 10,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: '1/3 İlk Gün',
  },
  {
    id: 'onb_critical_event_d1',
    moment: 'critical_event_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Günün ana olayı',
    text: 'Günün ana olayı burada. Önce olayı incele, sonra kararını seç.',
    tone: 'info',
    targetKey: 'critical_event_card',
    priority: 20,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_event_detail_d1',
    moment: 'event_detail_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'event_detail',
    title: 'Olay detayı',
    text: 'Bu ekranda mahalle notunu, saha bilgisini ve karar seçeneklerini görürsün.',
    tone: 'neutral',
    priority: 30,
    dismissible: true,
    presentationMode: 'focus',
    stepPill: 'İpucu',
  },
  {
    id: 'onb_decision_card_d1',
    moment: 'decision_card_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'event_detail',
    title: 'Karar kartları',
    text: 'Karar kartlarında strateji, risk ve kısa tradeoff yazar. Tek doğru cevap yok; ilk görevine göre karar ver.',
    tone: 'info',
    targetKey: 'quick_decisions',
    priority: 40,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_decision_result_d1',
    moment: 'decision_result_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'decision_result',
    title: 'Karar sonucu',
    text: 'Sonuç ekranı kararının etkisini gösterir. Metrik değişimleri ve sistem etkileri gün sonu raporuna yansır.',
    tone: 'success',
    priority: 50,
    dismissible: true,
    presentationMode: 'coach',
  },
  {
    id: 'onb_live_flow_d1',
    moment: 'live_flow_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'hub',
    title: 'Bugünün Akışı',
    text: 'Kararlarından sonra gelişmeler burada kısa satırlar halinde görünür.',
    tone: 'info',
    priority: 60,
    dismissible: true,
    presentationMode: 'focus',
  },
  {
    id: 'onb_daily_report_d1',
    moment: 'daily_report_intro',
    dayMin: 1,
    dayMax: 1,
    screen: 'daily_report',
    title: 'Gün sonu raporu',
    text: 'Rapor, günün kararlarını ve hedef sonuçlarını özetler. Yarın bazı kararların yankısı geri dönebilir.',
    tone: 'neutral',
    priority: 70,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: '3/3 İlk Gün',
  },
  {
    id: 'onb_day2_priority',
    moment: 'day2_priority_choice',
    dayMin: 2,
    dayMax: 2,
    screen: 'hub',
    title: 'Günlük öncelik',
    text: 'Artık güne bir öncelik seçerek başlıyorsun. Halkı rahatlatabilir, operasyonu toparlayabilir veya kaynakları koruyabilirsin.',
    tone: 'info',
    priority: 80,
    dismissible: true,
    presentationMode: 'coach',
    stepPill: 'Yeni',
  },
  {
    id: 'onb_day2_goals',
    moment: 'day2_goals_intro',
    dayMin: 2,
    dayMax: 2,
    screen: 'hub',
    title: 'Bugünün hedefleri',
    text: 'Bugünün hedefleri seçtiğin önceliğe göre şekillenir. Gün içinde kararların bu hedefleri ilerletir veya riske atar.',
    tone: 'info',
    priority: 90,
    dismissible: true,
    presentationMode: 'focus',
  },
] as const;

export const ONBOARDING_HINT_BY_ID: Record<string, OnboardingHint> =
  Object.fromEntries(ONBOARDING_HINTS.map((h) => [h.id, h]));

export const DAY1_PRIORITY_FALLBACK =
  'İlk gün önceliğin: temel müdahaleyi öğrenmek.';

export const DAY1_FLOW_PLACEHOLDER = 'Bugün ilk olayını bekliyorsun.';

export const DAY1_GOALS_PLACEHOLDER =
  'İlk hedefler olaydan sonra netleşecek.';

export const DAY2_PRIORITY_PROMPT =
  'Güne başlamadan önce bir öncelik seç.';

export const DAY1_STATUS_MUTED_NOTE = 'Yakında önem kazanacak';

/** Eski tutorial adımı ile aynı anda gösterilmemesi gereken onboarding momentleri */
export const LEGACY_TUTORIAL_STEP_BY_MOMENT: Partial<
  Record<OnboardingHint['moment'], string>
> = {
  hub_intro: 'day1_intro',
  critical_event_intro: 'hub_critical_event',
  event_detail_intro: 'event_timeline',
  decision_card_intro: 'event_decisions',
  decision_result_intro: 'decision_result',
  daily_report_intro: 'daily_report',
};

// —— İlk 5 dakika / pilot görev sunumu (oyuncuya görünen metinler) ——

export const ONBOARDING_UI_MAX_BRIEFING_STEPS = 3;

export const ONBOARDING_FORBIDDEN_WORDS = [
  'tutorial',
  'onboarding',
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

const PILOT_BRIEFING_COPY = {
  title: '7 Günlük Pilot Görev',
  subtitle:
    'Cumhuriyet bölgesinde operasyon kararlarını yönetecek, halk güveni, ekip dengesi ve kaynak kullanımını birlikte takip edeceksin.',
  goalLine: 'Pilot sonunda üst yönetim performansını değerlendirecek.',
} as const;

const PILOT_BRIEFING_HUB_STEPS: PilotBriefingModel['steps'] = [
  {
    title: 'İncele',
    line: 'Sahadan gelen sinyali oku.',
    iconKey: 'workflow_inspect',
  },
  {
    title: 'Planla',
    line: 'Halk, ekip ve kaynak etkisini karşılaştır.',
    iconKey: 'workflow_plan',
  },
  {
    title: 'Sahaya Yönlendir',
    line: 'Doğru ekibi ve önceliği sahaya çıkar.',
    iconKey: 'workflow_assign',
  },
] as const;

const WORKFLOW_STEP_HINT_COPY: Record<
  Exclude<OnboardingWorkflowStepId, 'unknown'>,
  string
> = {
  inspect: 'Önce sahadan gelen sinyali incele.',
  plan: 'Her seçenek halk, ekip ve kaynak dengesini farklı etkiler.',
  assign: 'Seçtiğin planı sahaya çıkar.',
  field: 'Operasyonun ilk etkisini izle.',
  result: 'Bu ekran kararının sahadaki etkisini özetler.',
};

export function assertNoOnboardingForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const word of ONBOARDING_FORBIDDEN_WORDS) {
    const pattern =
      word === 'xp'
        ? /\bxp\b/i
        : new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (pattern.test(lower)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectOnboardingVisibleStrings(): string[] {
  const strings: string[] = [
    PILOT_BRIEFING_COPY.title,
    PILOT_BRIEFING_COPY.subtitle,
    PILOT_BRIEFING_COPY.goalLine,
    ...PILOT_BRIEFING_HUB_STEPS.flatMap((s) => [s.title, s.line]),
    ...Object.values(WORKFLOW_STEP_HINT_COPY),
    buildFirstReportGuidanceModel().title,
    ...buildFirstReportGuidanceModel().summaryLines,
    ...buildFirstReportGuidanceModel().authorityIntroLines,
    buildFirstResultGuidanceModel(true, true).title,
    buildFirstResultGuidanceModel(true, true).line,
  ];
  for (const hint of ONBOARDING_HINTS) {
    strings.push(hint.title, hint.text, ...(hint.ctaText ? [hint.ctaText] : []));
    if (hint.stepPill) strings.push(hint.stepPill);
  }
  return strings;
}

export function buildPilotBriefingModel(): PilotBriefingModel {
  return {
    title: PILOT_BRIEFING_COPY.title,
    subtitle: mobileSafeLine(PILOT_BRIEFING_COPY.subtitle, 120),
    goalLine: PILOT_BRIEFING_COPY.goalLine,
    steps: PILOT_BRIEFING_HUB_STEPS.slice(0, ONBOARDING_UI_MAX_BRIEFING_STEPS),
  };
}

export type BuildDay1HubGuidanceInput = {
  pilotDay?: number;
  pilotDayTotal?: number;
  isDay1?: boolean;
};

export function buildDay1HubGuidanceModel(
  input: BuildDay1HubGuidanceInput = {},
): Day1HubGuidanceModel {
  const pilotDay = Math.max(1, input.pilotDay ?? 1);
  const pilotDayTotal = Math.max(1, input.pilotDayTotal ?? 7);
  const isDay1 = input.isDay1 ?? pilotDay === 1;

  if (!isDay1) {
    return {
      showPilotBriefing: false,
      pilotProgressLabel: null,
      pilotGoalLine: null,
    };
  }

  return {
    showPilotBriefing: true,
    pilotProgressLabel: `Pilot: ${pilotDay} / ${pilotDayTotal}`,
    pilotGoalLine: mobileSafeLine(
      'Hedef: 7 günü tamamla, yetki değerlendirmesine hazırlan.',
      72,
    ),
  };
}

export type BuildFirstEventGuidanceInput = {
  day?: number;
  eventId?: string | null;
  isDay1LearningEvent?: boolean;
};

export function buildFirstEventGuidanceModel(
  input: BuildFirstEventGuidanceInput = {},
): FirstEventGuidanceModel {
  const day = input.day ?? 1;
  const isFirst =
    day === 1 &&
    !!input.eventId &&
    (input.isDay1LearningEvent ?? false);

  if (!isFirst) {
    return { showInspectBanner: false, inspectHint: null };
  }

  return {
    showInspectBanner: true,
    inspectHint: WORKFLOW_STEP_HINT_COPY.inspect,
  };
}

export type BuildWorkflowStepHintInput = {
  step: OnboardingWorkflowStepId;
  day?: number;
  isDay1LearningEvent?: boolean;
  isFirstTutorialResult?: boolean;
};

export function buildWorkflowStepHintModel(
  input: BuildWorkflowStepHintInput,
): WorkflowStepHintModel {
  const day = input.day ?? 1;
  const onDay1Flow =
    day === 1 && (input.isDay1LearningEvent ?? false);

  if (input.step === 'result') {
    const visible =
      !!input.isFirstTutorialResult && (day === 1 || onDay1Flow);
    return {
      visible,
      text: visible ? WORKFLOW_STEP_HINT_COPY.result : '',
      compact: true,
    };
  }

  if (!onDay1Flow || input.step === 'unknown') {
    return { visible: false, text: '', compact: true };
  }

  const text =
    input.step in WORKFLOW_STEP_HINT_COPY
      ? WORKFLOW_STEP_HINT_COPY[
          input.step as Exclude<OnboardingWorkflowStepId, 'unknown'>
        ]
      : '';

  return {
    visible: text.length > 0,
    text,
    compact: true,
  };
}

export function buildFirstResultGuidanceModel(
  isDay1TutorialFlow: boolean,
  isFirstTutorialResult: boolean,
): FirstResultGuidanceModel {
  const visible = isDay1TutorialFlow && isFirstTutorialResult;
  return {
    visible,
    title: 'Sonucu Gör',
    line: WORKFLOW_STEP_HINT_COPY.result,
  };
}

export function buildFirstReportGuidanceModel(): FirstReportGuidanceModel {
  return {
    title: 'Bugünkü pilot başlangıcı tamamlandı.',
    summaryLines: [
      'Yarın kararların daha fazla sistem etkisi gösterecek.',
    ],
    authorityIntroLines: [
      'Yetki değerlendirmesi pilot boyunca izlenir.',
      'Gün sonunda üst yönetim güven puanını günceller.',
    ],
    hideBadgeBlock: true,
    hideScoreCard: true,
  };
}
