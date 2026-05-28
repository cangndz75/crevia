import type { DailyPriorityChoice } from './dailyPriorityTypes';

export const DAILY_PRIORITY_CHOICES: DailyPriorityChoice[] = [
  {
    key: 'public_relief',
    title: 'Halkı Rahatlat',
    shortTitle: 'Halk',
    description: 'Vatandaş baskısı ve sosyal nabız öncelikli.',
    promiseText:
      'Bugün öncelik vatandaş baskısını azaltmak ve güveni korumak.',
    tradeoffText:
      'Daha fazla saha ve iletişim hamlesi bütçe/personel yükünü artırabilir.',
    iconName: 'people-outline',
    visualTone: 'green',
    goalWeights: {
      publicSatisfaction: 0.9,
      operationRisk: 0.45,
      budget: 0.4,
      personnelMorale: 0.5,
      containerPressure: 0.45,
      vehicleRisk: 0.4,
      socialPulse: 0.88,
    },
    decisionBiasHints: {
      positiveKeywords: [
        'communicate',
        'iletisim',
        'citizen',
        'social',
        'sosyal',
        'şikayet',
        'memnun',
        'trust',
      ],
      riskyKeywords: ['stay_silent', 'sessiz', 'gecik', 'ignore'],
    },
  },
  {
    key: 'operation_stability',
    title: 'Operasyonu Toparla',
    shortTitle: 'Operasyon',
    description: 'Saha, konteyner, araç ve operasyon riski öncelikli.',
    promiseText:
      'Bugün öncelik saha yükünü düşürmek ve operasyon riskini kontrol etmek.',
    tradeoffText:
      'Hızlı müdahaleler ekip ve araç yorgunluğunu artırabilir.',
    iconName: 'construct-outline',
    visualTone: 'blue',
    goalWeights: {
      publicSatisfaction: 0.5,
      operationRisk: 0.9,
      budget: 0.48,
      personnelMorale: 0.55,
      containerPressure: 0.88,
      vehicleRisk: 0.85,
      socialPulse: 0.45,
    },
    decisionBiasHints: {
      positiveKeywords: [
        'dispatch',
        'route',
        'rota',
        'maintenance',
        'bakım',
        'container',
        'konteyner',
        'vehicle',
        'araç',
        'topla',
      ],
      riskyKeywords: ['ertele', 'bekle', 'monitor only'],
    },
  },
  {
    key: 'resource_protection',
    title: 'Kaynağı Koru',
    shortTitle: 'Kaynak',
    description: 'Bütçe, moral ve sürdürülebilir kararlar öncelikli.',
    promiseText:
      'Bugün öncelik bütçeyi, ekibi ve filoyu yıpratmadan ilerlemek.',
    tradeoffText:
      'Daha temkinli kararlar bazı mahallelerde baskıyı uzatabilir.',
    iconName: 'wallet-outline',
    visualTone: 'amber',
    goalWeights: {
      publicSatisfaction: 0.48,
      operationRisk: 0.55,
      budget: 0.9,
      personnelMorale: 0.85,
      containerPressure: 0.5,
      vehicleRisk: 0.72,
      socialPulse: 0.42,
    },
    decisionBiasHints: {
      positiveKeywords: [
        'monitor',
        'izle',
        'balanced',
        'dengeli',
        'resource',
        'kaynak',
        'koru',
        'rest',
        'dinlen',
      ],
      riskyKeywords: ['acil', 'hızlı', 'full', 'tüm', 'agresif'],
    },
  },
];

export const DAILY_PRIORITY_CHOICE_BY_KEY = Object.fromEntries(
  DAILY_PRIORITY_CHOICES.map((c) => [c.key, c]),
) as Record<
  DailyPriorityChoice['key'],
  DailyPriorityChoice
>;

export const INITIAL_PRIORITY_SCORE = 50;

export const PRIORITY_SCORE_DELTAS = {
  strong: 8,
  support: 4,
  neutral: 0,
  risk: -4,
  bad: -8,
} as const;
