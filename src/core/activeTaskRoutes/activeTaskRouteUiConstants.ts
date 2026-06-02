import type { CreviaActiveTaskRoutePhase } from './activeTaskRouteUiTypes';

export const ACTIVE_TASK_ROUTE_UI_MAX_STEPS = 4;
export const ACTIVE_TASK_ROUTE_UI_MAX_COPY_LENGTH = 88;
export const ACTIVE_TASK_ROUTE_UI_MOBILE_COPY_LENGTH = 72;

export const ACTIVE_TASK_ROUTE_UI_FORBIDDEN_COPY_TERMS: readonly string[] = [
  'canlı gps',
  'gerçek zamanlı rota',
  'gerçek gps',
  'kesin varış',
  'pathfinding',
  'optimizasyon motoru',
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun sonu',
  'panik',
  'felaket',
  'çöküş',
  'başarısız',
  'premium al',
  'satın al',
  'kilitli',
] as const;

export type CreviaActiveTaskRoutePhaseDefinition = {
  phase: CreviaActiveTaskRoutePhase;
  label: string;
  shortLabel: string;
  tone: 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';
  iconKey: string;
  mapLineIntent: string;
  dispatchLineIntent: string;
  fieldLineIntent: string;
  reportLineIntent: string;
  maxCopyLength: number;
  forbiddenTerms: readonly string[];
};

const phaseDef = (
  phase: CreviaActiveTaskRoutePhase,
  label: string,
  shortLabel: string,
  tone: CreviaActiveTaskRoutePhaseDefinition['tone'],
  iconKey: string,
  intents: { map: string; dispatch: string; field: string; report: string },
): CreviaActiveTaskRoutePhaseDefinition => ({
  phase,
  label,
  shortLabel,
  tone,
  iconKey,
  mapLineIntent: intents.map,
  dispatchLineIntent: intents.dispatch,
  fieldLineIntent: intents.field,
  reportLineIntent: intents.report,
  maxCopyLength: ACTIVE_TASK_ROUTE_UI_MOBILE_COPY_LENGTH,
  forbiddenTerms: ACTIVE_TASK_ROUTE_UI_FORBIDDEN_COPY_TERMS,
});

export const ACTIVE_TASK_ROUTE_UI_PHASE_DEFINITIONS: readonly CreviaActiveTaskRoutePhaseDefinition[] = [
  phaseDef('planned', 'Planlandı', 'Plan', 'neutral', 'calendar-outline', {
    map: 'Operasyon rotası plan aşamasında.',
    dispatch: 'Ekip ve araç seçimi sonrası rota netleşir.',
    field: 'Rota planı hazırlanıyor.',
    report: 'Planlanan saha yönü rapora taşınacak.',
  }),
  phaseDef('dispatch_ready', 'Yönlendirmeye Hazır', 'Hazır', 'teal', 'navigate-outline', {
    map: 'Merkezden hedef mahalleye yönlendirme hazır.',
    dispatch: 'Ekip ve araç hedef mahalle hattına hazır.',
    field: 'Yönlendirme tamamlandı, saha çıkışı bekleniyor.',
    report: 'Yönlendirme özeti rapora eklenecek.',
  }),
  phaseDef('en_route', 'Yolda', 'Yolda', 'mint', 'car-outline', {
    map: 'Ekip hedef mahalle hattına yönlendirildi.',
    dispatch: 'Araç hedef mahalle hattına yönlendirildi.',
    field: 'Saha ekibi yolda; hedef mahalle yaklaşıyor.',
    report: 'Saha yönü aktif; sonuç rapora bağlanacak.',
  }),
  phaseDef('on_site', 'Sahada', 'Sahada', 'teal', 'location-outline', {
    map: 'Saha ekibi hedef mahallede müdahalede.',
    dispatch: 'Ekip sahada; operasyon ilerliyor.',
    field: 'Saha ekibi hedef noktada müdahalede.',
    report: 'Saha müdahalesi devam ediyor.',
  }),
  phaseDef('resolving', 'Müdahale Sürüyor', 'Müdahale', 'gold', 'construct-outline', {
    map: 'Saha çözüm noktasında son kontrol sürüyor.',
    dispatch: 'Müdahale tamamlanıyor; rapor hazırlığı yakın.',
    field: 'Son kontrol yapılıyor; rapor hazırlığı yakın.',
    report: 'Son kontrol rapora taşınacak.',
  }),
  phaseDef('completed', 'Tamamlandı', 'Bitti', 'neutral', 'checkmark-circle-outline', {
    map: 'Saha rotası tamamlandı.',
    dispatch: 'Yönlendirme tamamlandı.',
    field: 'Saha görevi tamamlandı.',
    report: 'Rota özeti sonuç raporuna bağlandı.',
  }),
  phaseDef('delayed', 'Gecikiyor', 'Gecikme', 'warn', 'time-outline', {
    map: 'Rota baskısı nedeniyle gecikme izleniyor.',
    dispatch: 'Kaynak baskısı rotayı yavaşlatabilir.',
    field: 'Gecikme izleniyor; saha temposu ayarlanıyor.',
    report: 'Gecikme notu rapora yansıyacak.',
  }),
  phaseDef('risk_watch', 'Risk İzleniyor', 'İzleniyor', 'warn', 'eye-outline', {
    map: 'Rota baskısı izleniyor; yönlendirme kontrollü.',
    dispatch: 'Kaynak baskısı nedeniyle rota dikkatle izleniyor.',
    field: 'Baskı hattı izleniyor; tempo kontrollü tutuluyor.',
    report: 'Risk izi rapora not edilecek.',
  }),
] as const;

export function getActiveTaskRouteUiPhaseDefinition(
  phase: CreviaActiveTaskRoutePhase,
): CreviaActiveTaskRoutePhaseDefinition {
  return (
    ACTIVE_TASK_ROUTE_UI_PHASE_DEFINITIONS.find((d) => d.phase === phase) ??
    ACTIVE_TASK_ROUTE_UI_PHASE_DEFINITIONS[0]!
  );
}

export const ACTIVE_TASK_ROUTE_UI_VISIBLE_MIN_DAY = {
  hidden: 1,
  compact: 2,
  standard: 4,
  mapPostPilot: 8,
} as const;
