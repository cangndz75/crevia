import type { TutorialStep } from './tutorialTypes';

export const DAY1_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'day1_intro',
    screen: 'hub',
    title: 'Pilot görev başladı',
    body: 'Cumhuriyet Mahallesi ilk pilot bölgen. Bugün ilk olayı inceleyip bir aksiyon seçeceksin.',
    primaryActionLabel: 'Göreve Başla',
    blocking: true,
  },
  {
    id: 'hub_metrics',
    screen: 'hub',
    targetKey: 'hub_metrics',
    title: 'Bölge göstergeleri',
    body: 'Bu göstergeler kararlarının mahalleye etkisini gösterir.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'hub_critical_event',
    screen: 'hub',
    targetKey: 'critical_event_card',
    title: 'Günün kritik olayı',
    body: 'Bugünün ana problemi burada. İlk olayı inceleyerek başlayalım.',
    primaryActionLabel: 'Olayı İncele',
    blocking: true,
    navigateToDay1Event: true,
  },
  {
    id: 'event_timeline',
    screen: 'event_detail',
    targetKey: 'event_status_timeline',
    title: 'Olay süreci',
    body: 'Olay şu anda inceleme aşamasında. Karar verdikçe süreç yönlendirme ve saha adımlarına ilerler.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'event_insight',
    screen: 'event_detail',
    targetKey: 'event_insight_card',
    title: 'Risk özeti',
    body: 'Bu kart olayın riskini gösterir. Mahalle güveni düşük, sosyal geri bildirim yüksek.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'event_resources',
    screen: 'event_detail',
    targetKey: 'field_resources_card',
    title: 'Saha kaynakları',
    body: 'Uygun ekipleri buradan görürsün. Yoğun ekipleri zorlamak sonraki günleri etkileyebilir.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'event_decisions',
    screen: 'event_detail',
    targetKey: 'quick_decisions',
    title: 'Aksiyon seç',
    body: 'Şimdi bir aksiyon seç. Yönlendir hızlı çözüm sağlar ama ekip yoğunluğunu artırabilir.',
    primaryActionLabel: 'Anladım',
  },
  {
    id: 'decision_result',
    screen: 'decision_result',
    title: 'Kararın uygulandı',
    body: 'Sonuç ekranında kararının metriklere etkisini görürsün. İyi karar, tüm dengeleri birlikte yönetir.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'hub_social_signal',
    screen: 'hub',
    targetKey: 'social_signal_card',
    title: 'Sosyal medya etkisi',
    body: 'Halkın tepkisi burada görünür. Bazı yorumlar ileride yeni olaylara dönüşebilir.',
    primaryActionLabel: 'Devam',
  },
  {
    id: 'daily_report',
    screen: 'daily_report',
    title: '1. Gün tamamlandı',
    body: 'Bugün ilk kararını verdin. Yarın kararlarının yan etkilerini daha net görmeye başlayacaksın.',
    primaryActionLabel: '2. Güne Geç',
  },
];

export const FIRST_DAY1_STEP_ID = DAY1_TUTORIAL_STEPS[0]!.id;

export function getTutorialStepById(stepId: string): TutorialStep | undefined {
  return DAY1_TUTORIAL_STEPS.find((s) => s.id === stepId);
}
