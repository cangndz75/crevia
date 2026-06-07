import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

export const MAIN_OPERATION_FEEL_FIRST_DAY = POST_PILOT_FIRST_OPERATION_DAY;

export const MAIN_OPERATION_FEEL_OPENING_DAY = POST_PILOT_FIRST_OPERATION_DAY;

export const MAIN_OPERATION_FEEL_MAX_HUB_LINES_OPENING = 4;

export const MAIN_OPERATION_FEEL_MAX_HUB_LINES_COMPACT = 2;

export const MAIN_OPERATION_FEEL_MAX_REPORT_LINES = 2;

export const MAIN_OPERATION_FEEL_FORBIDDEN_WORDS = [
  'premium',
  'kilitli',
  'satın al',
  'ödeme yap',
  'kaçırma',
  'fırsat',
  'paywall',
  'full mode',
  'pro dashboard',
  'büyük ödül',
  'xp',
] as const;

export const MAIN_OPERATION_FEEL_COPY = {
  fallbackScope:
    'Pilot tamamlandı. Şehir operasyonu bugün sınırlı kapsamla devam ediyor.',
  hubTitleOpening: 'Ana Operasyon Başladı',
  hubTitleCompact: 'Ana Operasyon',
  hubSubtitleOpeningFull:
    'Pilot tamamlandı. Bugün şehir dengesi daha geniş mahalle kapsamıyla izleniyor.',
  hubSubtitleOpeningLight:
    'Pilot tamamlandı. Ana operasyon önizlemesi sınırlı mahalle kapsamıyla devam ediyor.',
  hubSubtitleCompactFull:
    'Şehir dengesi geniş mahalle kapsamıyla izleniyor.',
  hubSubtitleCompactLight:
    'Ana operasyon önizlemesi; bugün şehir dengesinin bir bölümü izleniyor.',
  cityStateFull:
    'Ana operasyonda kararların mahalle güveni, kaynak dengesi ve yarınki risklere daha görünür yansır.',
  cityStateLight:
    'Kararların seçili mahalle dengesine yansır; tam kapsam sezon hedefleriyle genişler.',
  reportScopeFull:
    'Şehir kapsamı büyüdü; raporlar artık mahalleler arası dengeyi daha net gösterir.',
  reportScopeLight:
    'Sınırlı kapsamda rapor, izlenen mahalle dengesini özetler.',
  hubCta: 'Bugünkü Operasyona Geç',
  hubCtaSecondary: 'Mahalle Kapsamını Gör',
  contentVarietyNote:
    'Day 8+ event variety Content Pack Runtime Activation Lite ile güçlendirilmeli.',
} as const;

export const MAIN_OPERATION_FEEL_DISTRICT_STATUS_LABELS = {
  active: 'aktif',
  agenda: 'gündemde',
  preview: 'izleme notunda',
  inactive: 'hazırlık',
} as const;
