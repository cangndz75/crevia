import type {
  Day8StrategicContentDayPolicy,
  Day8StrategicContentKind,
  Day8StrategicContentSourceKind,
} from './day8StrategicContentTypes';

export const DAY8_STRATEGIC_CONTENT_MAX_INTERNAL_CANDIDATES = 4;
export const DAY8_STRATEGIC_CONTENT_MAX_PRESENTATION_CANDIDATES = 3;
export const DAY8_STRATEGIC_CONTENT_LINE_MAX = 110;
export const DAY8_STRATEGIC_CONTENT_SHORT_MAX = 72;
export const DAY8_STRATEGIC_CONTENT_TITLE_MAX = 48;
export const DAY8_STRATEGIC_CONTENT_ACCESSIBILITY_MAX = 160;

export const DAY8_STRATEGIC_CONTENT_ALLOWED_SOURCE_KINDS: Day8StrategicContentSourceKind[] =
  [
    'daily_capacity_portfolio',
    'portfolio_defer_risk',
    'one_more_day_retention',
    'city_memory_visibility',
    'follow_up_action',
    'positive_comeback',
    'district_neglect_recovery',
    'ece_strategy_line',
    'authority_gameplay_expansion',
    'district_personality',
    'map_gameplay_binding',
    'active_operation_map_binding',
    'event_gameplay_variety',
    'decision_consequence',
    'carry_over',
    'butterfly_effect',
    'city_archive',
    'story_chain',
    'district_trust',
    'social_pulse',
    'vehicle_maintenance',
    'team_specialization',
    'container_network',
    'operational_resource',
    'fallback',
  ];

export const DAY8_STRATEGIC_CONTENT_KIND_TITLES: Record<Day8StrategicContentKind, string> = {
  strategic_operation_focus: 'Ana operasyon odağı',
  district_neglect_focus: 'Mahalle önceliği',
  district_recovery_focus: 'Toparlanma fırsatı',
  resource_pressure_focus: 'Kaynak baskısı',
  route_pressure_focus: 'Rota baskısı',
  container_pressure_focus: 'Konteyner hattı',
  social_trust_focus: 'Güven ve sosyal nabız',
  memory_trace_focus: 'Şehir hafızası',
  follow_up_focus: 'Takip hamlesi',
  positive_comeback_focus: 'Olumlu fırsat',
  defer_risk_focus: 'Erteleme riski',
  map_priority_focus: 'Harita önceliği',
  authority_explanation_focus: 'Yetki açıklaması',
  safe_watch_focus: 'Güvenli izleme',
  fallback: 'Stratejik odak',
};

export const DAY8_STRATEGIC_CONTENT_KIND_BADGES: Record<Day8StrategicContentKind, string> = {
  strategic_operation_focus: 'Odağı',
  district_neglect_focus: 'Mahalle',
  district_recovery_focus: 'Toparlanma',
  resource_pressure_focus: 'Kaynak',
  route_pressure_focus: 'Rota',
  container_pressure_focus: 'Konteyner',
  social_trust_focus: 'Güven',
  memory_trace_focus: 'Hafıza',
  follow_up_focus: 'Takip',
  positive_comeback_focus: 'Fırsat',
  defer_risk_focus: 'Erteleme',
  map_priority_focus: 'Harita',
  authority_explanation_focus: 'Yetki',
  safe_watch_focus: 'İzleme',
  fallback: 'Strateji',
};

export const DAY8_STRATEGIC_CONTENT_KIND_PRIORITY: Record<Day8StrategicContentKind, number> = {
  district_neglect_focus: 92,
  district_recovery_focus: 90,
  positive_comeback_focus: 88,
  defer_risk_focus: 86,
  follow_up_focus: 84,
  memory_trace_focus: 82,
  map_priority_focus: 80,
  route_pressure_focus: 78,
  resource_pressure_focus: 76,
  container_pressure_focus: 74,
  social_trust_focus: 72,
  strategic_operation_focus: 70,
  authority_explanation_focus: 68,
  safe_watch_focus: 40,
  fallback: 20,
};

export const DAY8_STRATEGIC_CONTENT_RISK_KINDS: Day8StrategicContentKind[] = [
  'district_neglect_focus',
  'defer_risk_focus',
  'route_pressure_focus',
  'container_pressure_focus',
  'resource_pressure_focus',
];

export const DAY8_STRATEGIC_CONTENT_POSITIVE_KINDS: Day8StrategicContentKind[] = [
  'district_recovery_focus',
  'positive_comeback_focus',
  'follow_up_focus',
];

export const DAY8_STRATEGIC_CONTENT_FAKE_CLAIM_PATTERNS = [
  /kesin\s+(ihmal|toparland|kayboldu)/i,
  /mutlaka\s+(kaybed|toparlan)/i,
  /tamamen\s+(çöktü|düzeldi)/i,
];

export const DAY8_STRATEGIC_CONTENT_COPY: Record<Day8StrategicContentKind, string[]> = {
  strategic_operation_focus: [
    'Bugünün ana odağı tek olay değil; şehirdeki öncelik sırası.',
    'Bugün karar, hangi sinyali önce okuyacağını belirleyecek.',
    'Ana operasyon artık kaynak, mahalle ve takip izleriyle birlikte okunmalı.',
  ],
  district_neglect_focus: [
    'Bu mahallede ertelenen sinyal artık stratejik öncelik isteyebilir.',
    'Bölgeyi uzun süre pas geçmek yarınki baskıyı artırabilir.',
    'Bu mahalleyi bugün okumak, sonraki gün yükünü azaltabilir.',
  ],
  district_recovery_focus: [
    'Bu mahallede toparlanma fırsatı stratejik değer taşıyor.',
    'Küçük takip hamlesi bu bölgeyi yeniden dengeleyebilir.',
    'Risk kadar toparlanma penceresini de okumak önemli.',
  ],
  resource_pressure_focus: [
    'Kaynak baskısı kararın gerçek maliyetini belirliyor.',
    'Bugün pahalı görünen seçim, yarınki yükü azaltabilir.',
    'Kaynakları sadece korumak değil, doğru yere koymak önemli.',
  ],
  route_pressure_focus: [
    'Rota hattı bugünün stratejik kararını etkiliyor.',
    'Araç ve ekip yükünü erken okumak yarınki baskıyı azaltabilir.',
    'Bu bölgedeki rota sinyali küçük görünse de şehir akışını etkiler.',
  ],
  container_pressure_focus: [
    'Konteyner hattı tek nokta değil, bölge etkisi yaratıyor.',
    'Çevre baskısı büyümeden hattı birlikte okumak iyi olur.',
    'Bu sinyal küçük görünse de mahalle algısını etkileyebilir.',
  ],
  social_trust_focus: [
    'Güven hassasiyeti bu kararı daha stratejik hale getiriyor.',
    'Sosyal nabzı doğru okumak, operasyon etkisini yumuşatabilir.',
    'Bu bölgede görünür takip güveni koruyabilir.',
  ],
  memory_trace_focus: [
    'Şehir hafızası bu kararın arkasındaki izi gösteriyor.',
    'Bugünkü seçim, önceki izlerle birlikte okunmalı.',
    'Bu sinyal tek günlük değil; şehir hafızasında karşılığı var.',
  ],
  follow_up_focus: [
    'Küçük takip hamlesi bugün ana operasyon kadar değerli olabilir.',
    'Her çözüm büyük operasyon istemez; bazen doğru takip yeterlidir.',
    'Bu aksiyon yarınki kararı daha net hale getirebilir.',
  ],
  positive_comeback_focus: [
    'Bugün sadece risk değil, olumlu dönüş fırsatı da var.',
    'Doğru hamle şehirde küçük ama değerli bir iyileşme yaratabilir.',
    'Bu fırsat düşük maliyetle olumlu iz bırakabilir.',
  ],
  defer_risk_focus: [
    'Ertelediğin sinyal yarınki önceliği değiştirebilir.',
    'Bugün pas geçtiğin konu kaybolmaz; şehir onu tekrar hatırlatabilir.',
    'Bu sinyali izlemeye almak yarınki baskıyı daha okunur yapar.',
  ],
  map_priority_focus: [
    'Haritadaki iz, kararın şehirde nerede karşılık bulduğunu gösteriyor.',
    'Bu bölgeyi haritada okumak önceliği netleştirir.',
    'Konum, kaynak ve mahalle sinyali burada birleşiyor.',
  ],
  authority_explanation_focus: [
    'Yetki açıklaması bugünkü önceliği daha net okumanı sağlayabilir.',
    'Açık kaynaklı öncelik, kararın maliyetini daha görünür kılar.',
    'Stratejik odak, yetkiyle birlikte daha okunur hale gelir.',
  ],
  safe_watch_focus: [
    'Bugün bu sinyal izleme modunda kalabilir.',
    'Kapasiteyi koruyup en net önceliği seçmek daha doğru olabilir.',
    'Şehir sakin değil; ama bugün her sinyal operasyon istemiyor.',
  ],
  fallback: [
    'Day 8+ odağı için yeterli kaynak yok; güvenli izleme öneriliyor.',
    'Bugün stratejik sinyaller sınırlı, en net operasyonu seç.',
    'Şehir yeni faza geçiyor; ilk önceliği sakin belirle.',
  ],
};

export function resolveDay8StrategicContentDayPolicy(day: number): Day8StrategicContentDayPolicy {
  if (day <= 9) return 'day_8_9';
  return 'day_10_plus';
}
