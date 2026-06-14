import { ACTIVE_OPERATION_MAP_PHASES } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { DISTRICT_CRITERION_IDS } from '@/core/districtPersonality/districtPersonalityTypes';

import type {
  MapSignalCopyContext,
  MapSignalCopyDayPolicy,
  MapSignalCopyLineKind,
  MapSignalCopySourceGuard,
  MapSignalCopyTemplate,
  MapSignalCopyTone,
} from './mapSignalCopyTypes';

function tpl(
  id: string,
  context: MapSignalCopyContext,
  kind: MapSignalCopyLineKind,
  text: string,
  options: {
    tone?: MapSignalCopyTone;
    dayPolicy?: MapSignalCopyDayPolicy;
    sourceGuards?: MapSignalCopySourceGuard[];
    maxLength?: number;
    priority?: number;
    tags?: string[];
    operationPhase?: (typeof ACTIVE_OPERATION_MAP_PHASES)[number];
    districtCriterionId?: (typeof DISTRICT_CRITERION_IDS)[number];
  } = {},
): MapSignalCopyTemplate {
  return {
    id,
    context,
    kind,
    tone: options.tone ?? 'neutral',
    dayPolicy: options.dayPolicy ?? 'any',
    sourceGuards: options.sourceGuards ?? ['safe_baseline'],
    text,
    maxLength: options.maxLength ?? 100,
    priority: options.priority ?? 50,
    tags: options.tags ?? [],
    operationPhase: options.operationPhase,
    districtCriterionId: options.districtCriterionId,
  };
}

function activePhaseLines(
  phase: (typeof ACTIVE_OPERATION_MAP_PHASES)[number],
  mapLines: string[],
  decisionLines: string[],
  nextLines: string[],
): MapSignalCopyTemplate[] {
  const out: MapSignalCopyTemplate[] = [];
  mapLines.forEach((text, index) => {
    out.push(
      tpl(`active_op_${phase}_map_${index + 1}`, 'active_operation', 'map_line', text, {
        operationPhase: phase,
        dayPolicy: index === 0 ? 'day_1' : index === 1 ? 'any' : 'day_8_plus',
        priority: 70 - index,
        tags: [`phase:${phase}`],
        sourceGuards: phase === 'unknown' ? ['fallback_only'] : ['requires_active_event'],
      }),
    );
  });
  decisionLines.forEach((text, index) => {
    out.push(
      tpl(`active_op_${phase}_decision_${index + 1}`, 'active_operation', 'decision_line', text, {
        operationPhase: phase,
        dayPolicy: index === 0 ? 'day_1' : index === 1 ? 'any' : 'day_8_plus',
        priority: 65 - index,
        tags: [`phase:${phase}`],
        sourceGuards: phase === 'unknown' ? ['fallback_only'] : ['requires_active_event'],
      }),
    );
  });
  nextLines.forEach((text, index) => {
    out.push(
      tpl(`active_op_${phase}_next_${index + 1}`, 'active_operation', 'next_action_line', text, {
        operationPhase: phase,
        priority: 55 - index,
        tags: [`phase:${phase}`],
        sourceGuards: phase === 'unknown' ? ['fallback_only'] : ['requires_active_event'],
      }),
    );
  });
  return out;
}

const ACTIVE_OPERATION_TEMPLATES: MapSignalCopyTemplate[] = [
  ...activePhaseLines(
    'before_inspect',
    [
      'Aktif operasyon bu bölgede başlıyor.',
      'İlk bulgular bu noktadan okunacak.',
      'Olay konumu haritada inceleme için hazır.',
    ],
    [
      'Önce olay detayını haritadan incele.',
      'Harita konumunu bulgu akışıyla eşleştir.',
      'İnceleme öncesi bölge sinyalini not et.',
    ],
    ['Olayı aç ve incelemeye başla', 'İncelemeye başla', 'Konumu haritada kontrol et'],
  ),
  ...activePhaseLines(
    'inspecting',
    [
      'Bulgular bu bölgedeki karar baskısını netleştiriyor.',
      'İnceleme, mahalle sinyalini görünür kılıyor.',
      'İlk işaretler plan seçimini şekillendiriyor.',
    ],
    [
      'Baskı ve bölge sinyalini karşılaştır.',
      'Bulgu tonunu mahalle bağlamıyla oku.',
      'Plan öncesi hassas noktaları işaretle.',
    ],
    ['İncelemeyi sürdür', 'Bulgulara geri dön', 'Plan hazırlığına geç'],
  ),
  ...activePhaseLines(
    'planning',
    [
      'Seçilecek plan bu bölgedeki etkiyi belirleyecek.',
      'Harita baskısı plan seçimini önemli kılıyor.',
      'Bu konumda yaklaşım tarzı sonucu değiştirebilir.',
    ],
    [
      'Ekip, araç ve yaklaşım uyumunu kontrol et.',
      'Kaynak ve bölge baskısını birlikte tart.',
      'Strateji seçimini harita sinyaliyle hizala.',
    ],
    ['Planı tamamla', 'Stratejiyi seç', 'Etkiyi önceden oku'],
  ),
  ...activePhaseLines(
    'dispatch_ready',
    [
      'Ekip ve rota kararı saha riskini belirleyecek.',
      'Yönlendirme öncesi kaynak uyumunu kontrol et.',
      'Sahaya çıkmadan rota ve ekip baskısını oku.',
    ],
    [
      'Sevk öncesi kaynak baskısını kontrol et.',
      'Atama uyumunu rota sinyaliyle birlikte oku.',
      'Saha çıkışı öncesi son kontrolü yap.',
    ],
    ['Sevki başlat', 'Atamayı onayla', 'Rotayı haritada kontrol et'],
  ),
  ...activePhaseLines(
    'dispatching',
    [
      'Operasyon bu bölgede sahaya taşınıyor.',
      'Ekip hareketi bu bölgede yoğunlaşıyor.',
      'Yönlendirme başladı; saha etkisi izleniyor.',
    ],
    [
      'Rota ve kaynak baskısını haritadan izle.',
      'Hareket hattını harita üzerinden takip et.',
      'Saha öncesi son risk sinyalini oku.',
    ],
    ['Sahayı takip et', 'Rotayı haritada izle', 'Canlı duruma geç'],
  ),
  ...activePhaseLines(
    'field_active',
    [
      'Operasyon bu bölgede yürütülüyor.',
      'Saha akışı harita üzerinde takip ediliyor.',
      'Müdahale bu noktada haritada ilerliyor.',
    ],
    [
      'Saha sinyallerini ve rotayı takip et.',
      'Canlı müdahale etkisini haritadan oku.',
      'Saha akışında kaynak baskısını izle.',
    ],
    ['Canlı durumu izle', 'Sahayı haritada aç', 'Akışı haritada takip et'],
  ),
  ...activePhaseLines(
    'field_paused',
    [
      'Sahada kısa bir karar anı oluştu.',
      'Operasyon ilerlemeden önce saha kararı bekliyor.',
      'Bu noktada mikro karar sonucu belirleyebilir.',
    ],
    [
      'Gecikme veya risk sinyalini kontrol et.',
      'Saha kararını harita bağlamıyla oku.',
      'Mikro karar öncesi bölge etkisini not et.',
    ],
    ['Riski incele', 'Saha kararını ver', 'Sahaya geri dön'],
  ),
  ...activePhaseLines(
    'completed',
    [
      'Operasyon sonucu bu bölgede kapanıyor.',
      'Müdahale tamamlandı; etki sonucu okunabilir.',
      'Sonuç bu konum üzerinden değerlendirilecek.',
    ],
    [
      'Sonuç etkilerini raporda kontrol et.',
      'Kapanış etkisini harita iziyle birlikte oku.',
      'Bölge sonucunu bir sonraki güne not et.',
    ],
    ['Sonucu haritada gör', 'Raporu aç ve oku', 'Etkiyi haritada oku'],
  ),
  ...activePhaseLines(
    'result_trace_available',
    [
      'Bu operasyon şehirde iz bırakmış olabilir.',
      'Kararın bu bölgede sonraki güne taşınabilir.',
      'Bu nokta şehir hafızasında takip edilebilir.',
    ],
    [
      'Önceki karar etkisini haritada incele.',
      'Sonuç izini harita bağlamıyla oku.',
      'Geçmiş müdahaleyi bölge hafızasıyla eşleştir.',
    ],
    ['Sonuç izini aç', 'İzi haritada incele', 'Hafızayı oku'],
  ),
  ...activePhaseLines(
    'unknown',
    [
      'Aktif operasyon haritada izleniyor.',
      'Operasyon konumu haritada hazır.',
      'Detayı açarak operasyon akışını gör.',
    ],
    [
      'Yeni operasyon oluştuğunda burada görünür.',
      'Harita genel sinyali sakin görünüyor.',
      'Detayı açarak bir sonraki adımı gör.',
    ],
    ['Haritayı bekle', 'Haritayı tara', 'Merkeze geri dön'],
  ),
];

const DISTRICT_CRITERION_COPY: Record<
  (typeof DISTRICT_CRITERION_IDS)[number],
  {
    map_signal: string[];
    decision_line: string[];
    district_line: string[];
    next_action_line: string[];
  }
> = {
  social_sensitivity: {
    map_signal: [
      'Bu mahallede sosyal tepki daha hızlı büyüyebilir.',
      'Görünür hizmet burada karar tonunu etkiler.',
      'Sakin plan bu bölgede güveni daha güvenli taşıyabilir.',
      'Kamu tepkisi büyümeden bu mahalleyi takip et.',
      'Sosyal nabız bu bölgede karar stilini önemli kılar.',
    ],
    decision_line: [
      'Karar tonunu sosyal hassasiyetle birlikte seç.',
      'Görünür müdahale kısa vadede tepkiyi yatıştırabilir.',
      'Sakin ilerleme güven etkisini koruyabilir.',
      'İletişim dili bu bölgede sonucu etkileyebilir.',
      'Plan seçiminde kamu algısını hesaba kat.',
    ],
    district_line: [
      'Burada görünür hizmet kadar sakin ton da önemli.',
      'Sosyal nabız bu mahallede plan tonunu belirler.',
      'Ece: Bu bölgede iletişim dili sonucu büyütebilir.',
    ],
    next_action_line: [
      'Yarın bu bölgede nabzı tekrar kontrol etmek iyi olur.',
      'Yarın sosyal sinyali kısa bir notla izle.',
      'Yarın kamu tepkisini yeniden okumak faydalı olur.',
    ],
  },
  route_difficulty: {
    map_signal: [
      'Bu bölgede rota kararı operasyon süresini etkileyebilir.',
      'Araç ve ekip seçimi burada daha belirleyici.',
      'Hızlı müdahale zaman kazandırır ama rota baskısı yaratabilir.',
      'Bu hattı ertelemeden önce araç uygunluğunu kontrol et.',
      'Rota baskısı bu bölgede atama kararını öne çıkarır.',
    ],
    decision_line: [
      'Yönlendirme kararını rota sinyaliyle birlikte oku.',
      'Araç uygunluğu rota baskısını azaltabilir.',
      'Hızlı çözüm zaman kazandırır; rota maliyetini tart.',
      'Ekip geçişi bu hatta kararı etkileyebilir.',
      'Sevk öncesi rota hattını haritadan doğrula.',
    ],
    district_line: [
      'Araç ve ekip seçimi burada daha önemli.',
      'Rota hattı bu mahallede süreyi belirleyebilir.',
      'Ece: Bu bölgede araç uygunluğu öncelikli okunur.',
    ],
    next_action_line: [
      'Yarın rota hattını kısa bir kontrolle izlemek iyi olur.',
      'Yarın araç baskısını bu hatta yeniden oku.',
      'Yarın sevk planını rota sinyaliyle hizala.',
    ],
  },
  container_density: {
    map_signal: [
      'Konteyner ağı bu bölgede daha yoğun çalışıyor.',
      'Tek noktayı değil, hattın tamamını düşünmek gerekebilir.',
      'Kalıcı çözüm çevre baskısını azaltabilir.',
      'Bu bölgede ağ dengesi hızlı bozulabilir.',
      'Konteyner yoğunluğu plan seçimini etkileyebilir.',
    ],
    decision_line: [
      'Toplama önceliğini ağ yoğunluğuna göre seç.',
      'Hat etkisini tek nokta yerine ağ olarak oku.',
      'Kalıcı ağ çözümü ileride rahatlatır.',
      'Çevre baskısını plan tonuyla birlikte tart.',
      'Kapasiteyi ağ dengesiyle birlikte kullan.',
    ],
    district_line: [
      'Tek noktayı değil, hattın tamamını düşünmek gerekebilir.',
      'Konteyner ağı bu mahallede hat etkisi yaratır.',
      'Ece: Ağ dengesi burada hızlı bozulabilir.',
    ],
    next_action_line: [
      'Yarın konteyner hattını tekrar okumak faydalı olabilir.',
      'Yarın ağ yoğunluğunu kısa bir kontrolle izle.',
      'Yarın hat önceliğini yeniden değerlendir.',
    ],
  },
  trust_fragility: {
    map_signal: [
      'Bu mahallede güven etkisi hassas.',
      'Kararın tonu burada sonucu büyütebilir.',
      'Dengeli plan güven etkisini daha güvenli taşıyabilir.',
      'Bu bölgeyi yarın tekrar okumak iyi olur.',
      'Güven etkisi bu bölgede dikkatle okunmalı.',
    ],
    decision_line: [
      'Sert karar güven izini büyütebilir.',
      'Dengeli plan güveni daha kontrollü taşır.',
      'Bu mahallede kararın tonu önemli.',
      'Güven hassasiyetini plan seçimiyle hizala.',
      'Sosyal tepki yerine kalıcı güveni hedefle.',
    ],
    district_line: [
      'Kararın tonu burada sonucu büyütebilir.',
      'Güven hassasiyeti bu mahallede belirgin.',
      'Ece: Dengeli plan burada güveni korur.',
    ],
    next_action_line: [
      'Yarın güven etkisini tekrar yoklamak iyi olur.',
      'Yarın bu mahallede güven sinyalini izle.',
      'Yarın ton seçimini güven etkisiyle değerlendir.',
    ],
  },
  recovery_potential: {
    map_signal: [
      'Bu bölgede toparlanma fırsatı var.',
      'Doğru hamle hızlı iyileşme yaratabilir.',
      'Kalıcı plan burada olumlu iz bırakabilir.',
      'Yarın bu fırsatı kaçırmadan takip et.',
      'Toparlanma sinyali bu mahallede görünür.',
    ],
    decision_line: [
      'Kalıcı hamle bu bölgede olumlu etkiyi büyütebilir.',
      'Hızlı kazanım ile kalıcı etkiyi birlikte tart.',
      'Doğru plan toparlanmayı hızlandırabilir.',
      'Fırsat penceresini kaynak baskısıyla dengele.',
      'Bu bölgede olumlu iz için plan tonunu seç.',
    ],
    district_line: [
      'Doğru hamle hızlı bir iyileşme yaratabilir.',
      'Toparlanma fırsatı bu mahallede belirgin.',
      'Ece: Kalıcı plan burada olumlu etki verebilir.',
    ],
    next_action_line: [
      'Yarın bu bölgeyi takip etmek olumlu sonuç verebilir.',
      'Yarın toparlanma sinyalini yeniden oku.',
      'Yarın fırsat penceresini kısa bir notla izle.',
    ],
  },
  neglect_risk: {
    map_signal: [
      'Bu bölge uzun süre beklerse baskı birikebilir.',
      'Erteleme yarına daha pahalı dönebilir.',
      'Küçük takip hamlesi ilerideki baskıyı azaltabilir.',
      'Yarın ilk kontrol adaylarından biri.',
      'İhmal birikimi bu mahallede hızlanabilir.',
    ],
    decision_line: [
      'Bugün ertelemek yarına daha pahalı dönebilir.',
      'Küçük takip hamlesi birikmeyi yavaşlatabilir.',
      'Önceliği bu bölgede erken vermek faydalı olabilir.',
      'Bekleme maliyetini plan seçimiyle tart.',
      'Erken müdahale ilerideki baskıyı azaltabilir.',
    ],
    district_line: [
      'Bugün ertelemek yarına daha pahalı dönebilir.',
      'İhmal riski bu mahallede birikebilir.',
      'Ece: Küçük takip hamlesi baskıyı yavaşlatır.',
    ],
    next_action_line: [
      'Yarın ilk kontrol edilecek adaylardan biri.',
      'Yarın ihmal birikimini kısa bir notla izle.',
      'Yarın öncelik listesinde bu bölgeyi tut.',
    ],
  },
  maintenance_exposure: {
    map_signal: [
      'Araç ve bakım kararı burada daha belirleyici.',
      'Bu bölgede aracı zorlamak sonraki rotayı etkileyebilir.',
      'Dengeli yönlendirme bakım riskini yumuşatabilir.',
      'Sahaya çıkmadan araç uygunluğunu kontrol et.',
      'Bakım baskısı bu hatta atamayı etkileyebilir.',
    ],
    decision_line: [
      'Aracı zorlamadan önce bakım riskini oku.',
      'Dengeli yönlendirme bakım yükünü azaltabilir.',
      'Araç seçimini rota baskısıyla birlikte tart.',
      'Sonraki görevi etkilemeden kapasite kullan.',
      'Bakım penceresini sevk kararıyla hizala.',
    ],
    district_line: [
      'Aracı zorlamak sonraki rotayı etkileyebilir.',
      'Bakım etkisi bu mahallede belirgin.',
      'Ece: Sahaya çıkmadan araç uygunluğunu kontrol et.',
    ],
    next_action_line: [
      'Yarın araç ve ekip yorgunluğunu tekrar kontrol etmek iyi olur.',
      'Yarın bakım penceresini kısa bir notla izle.',
      'Yarın filo baskısını bu hatta yeniden oku.',
    ],
  },
  operation_history_weight: {
    map_signal: [
      'Geçmiş kararlar bu bölgede daha görünür iz bırakır.',
      'Bu mahalle şehir hafızasında daha kolay takip edilir.',
      'Sonraki raporda bu bölge tekrar karşına çıkabilir.',
      'Buradaki kararlar yarına iz taşıyabilir.',
      'Operasyon hafızası bu mahallede belirgin.',
    ],
    decision_line: [
      'Geçmiş müdahaleyi bölge hafızasıyla eşleştir.',
      'Karar izini sonraki planla birlikte oku.',
      'Tekrarlayan baskıyı geçmiş kararlarla karşılaştır.',
      'Bu bölgede verilen kararlar daha kolay hatırlanır.',
      'Hafıza izini rapor notuyla destekle.',
    ],
    district_line: [
      'Burada verilen kararlar sonraki günlerde daha kolay hatırlanır.',
      'Şehir hafızası bu mahallede belirgin.',
      'Ece: Geçmiş karar izi burada okunabilir.',
    ],
    next_action_line: [
      'Yarın önceki karar izini yeniden okumak iyi olur.',
      'Yarın operasyon hafızasını kısa bir notla izle.',
      'Yarın bu bölgeyi hafıza listesinde tut.',
    ],
  },
  public_visibility: {
    map_signal: [
      'Bu bölgedeki operasyon daha görünür algılanabilir.',
      'Kararın kamu etkisi burada daha hızlı okunur.',
      'Sakin ve açık yaklaşım bu bölgede değerli.',
      'Bu mahallede görünür hizmet güveni güçlendirebilir.',
      'Görünürlük bu bölgede plan tonunu etkiler.',
    ],
    decision_line: [
      'Plan seçimi kamu algısına daha hızlı yansıyabilir.',
      'Görünür hizmet burada oyuncuya daha net geri döner.',
      'Sakin ve açık yaklaşım güven etkisini korur.',
      'Kamu algısını kaynak baskısıyla birlikte tart.',
      'Görünür sonucu harita bağlamıyla oku.',
    ],
    district_line: [
      'Görünür hizmet burada oyuncuya daha net geri döner.',
      'Kamu algısı bu mahallede hızlı okunur.',
      'Ece: Sakin ton burada görünür etkiyi dengeler.',
    ],
    next_action_line: [
      'Yarın görünür etkiyi kısa bir notla izlemek iyi olur.',
      'Yarın kamu algısını yeniden oku.',
      'Yarın görünürlük sinyalini takip et.',
    ],
  },
  resource_dependency: {
    map_signal: [
      'Bu operasyon burada daha fazla kapasite isteyebilir.',
      'Kaynak seçimi bu bölgede sonucu daha fazla etkiler.',
      'Ekip ve araç baskısını birlikte düşün.',
      'Kaynağı bugün harcarsan yarınki plan daralabilir.',
      'Kaynak ihtiyacı bu mahallede belirgin.',
    ],
    decision_line: [
      'Dengeli kaynak planı sonraki baskıyı azaltabilir.',
      'Kapasiteyi bugün harcamadan önce önceliği tart.',
      'Ekip, araç ve konteyner baskısını birlikte oku.',
      'Kaynak tercihini yarın etkisiyle birlikte değerlendir.',
      'Kapasite kullanımını plan stratejisiyle hizala.',
    ],
    district_line: [
      'Ekip, araç ve kapasiteyi birlikte düşünmek gerekebilir.',
      'Kaynak ihtiyacı bu mahallede yüksek.',
      'Ece: Kapasite seçimi burada sonucu belirler.',
    ],
    next_action_line: [
      'Yarın kaynak yükünü tekrar kontrol etmek iyi olur.',
      'Yarın kapasite baskısını kısa bir notla izle.',
      'Yarın kaynak planını yeniden hizala.',
    ],
  },
};

function buildDistrictTemplates(): MapSignalCopyTemplate[] {
  const out: MapSignalCopyTemplate[] = [];
  for (const criterionId of DISTRICT_CRITERION_IDS) {
    const copy = DISTRICT_CRITERION_COPY[criterionId];
    copy.map_signal.forEach((text, index) => {
      out.push(
        tpl(`district_${criterionId}_map_${index + 1}`, 'district_personality', 'map_line', text, {
          districtCriterionId: criterionId,
          sourceGuards: ['requires_district_source'],
          dayPolicy: index === 0 ? 'day_2_7' : index >= 3 ? 'day_8_plus' : 'any',
          priority: 60 - index,
          tags: [`criterion:${criterionId}`],
        }),
      );
    });
    copy.decision_line.forEach((text, index) => {
      out.push(
        tpl(`district_${criterionId}_decision_${index + 1}`, 'district_personality', 'decision_line', text, {
          districtCriterionId: criterionId,
          sourceGuards: ['requires_district_source'],
          priority: 58 - index,
          tags: [`criterion:${criterionId}`],
        }),
      );
    });
    copy.district_line.forEach((text, index) => {
      out.push(
        tpl(`district_${criterionId}_ece_${index + 1}`, 'district_personality', 'district_line', text, {
          districtCriterionId: criterionId,
          sourceGuards: ['requires_district_source'],
          priority: 52 - index,
          tags: [`criterion:${criterionId}`, 'ece'],
        }),
      );
    });
    copy.next_action_line.forEach((text, index) => {
      out.push(
        tpl(`district_${criterionId}_next_${index + 1}`, 'district_personality', 'next_action_line', text, {
          districtCriterionId: criterionId,
          sourceGuards: ['requires_district_source'],
          dayPolicy: 'day_8_plus',
          priority: 48 - index,
          tags: [`criterion:${criterionId}`, 'retention'],
        }),
      );
    });
  }
  return out;
}

function contextPool(
  context: MapSignalCopyContext,
  kind: MapSignalCopyLineKind,
  lines: string[],
  guards: MapSignalCopySourceGuard[],
  dayPolicy: MapSignalCopyDayPolicy = 'any',
): MapSignalCopyTemplate[] {
  return lines.map((text, index) =>
    tpl(`${context}_${kind}_${index + 1}`, context, kind, text, {
      sourceGuards: guards,
      dayPolicy: index === lines.length - 1 ? 'day_8_plus' : dayPolicy,
      priority: 55 - index,
      tags: [context],
    }),
  );
}

const CONTEXT_POOL_TEMPLATES: MapSignalCopyTemplate[] = [
  ...contextPool(
    'route_support',
    'route_line',
    [
      'Rota hattı bu operasyon için izleniyor.',
      'Bu hatta ekip geçişi kararı etkileyebilir.',
      'Araç uygunluğu rota baskısını azaltabilir.',
      'Yönlendirme kararını rota sinyaliyle birlikte oku.',
    ],
    ['requires_route_source'],
  ),
  ...contextPool(
    'resource_pressure',
    'pressure_line',
    [
      'Kaynak baskısı seçilecek stratejiyi zorlayabilir.',
      'Bu operasyon kapasite kullanımını etkileyebilir.',
      'Bugünkü kaynak tercihi yarınki alanı daraltabilir.',
      'Kapasiteyi bu bölgede harcamadan önce önceliği tart.',
    ],
    ['requires_live_pressure'],
  ),
  ...contextPool(
    'social_sensitivity',
    'pressure_line',
    [
      'Sosyal hassasiyet karar tonunu önemli kılıyor.',
      'Görünür müdahale kısa vadede tepkiyi azaltabilir.',
      'Sakin ilerlemek güven etkisini koruyabilir.',
      'Bu bölgede iletişim dili sonucu etkileyebilir.',
    ],
    ['requires_live_pressure', 'requires_district_source'],
  ),
  ...contextPool(
    'trust_fragility',
    'district_line',
    [
      'Güven etkisi bu bölgede dikkatle okunmalı.',
      'Sert karar güven izini büyütebilir.',
      'Dengeli plan güveni daha kontrollü taşır.',
      'Bu mahallede kararın tonu önemli.',
    ],
    ['requires_district_source'],
  ),
  ...contextPool(
    'container_network',
    'pressure_line',
    [
      'Konteyner ağı tek nokta yerine hat etkisi yaratabilir.',
      'Bu bölgede çevre baskısı hızlı birikebilir.',
      'Kalıcı ağ çözümü ileride rahatlatır.',
      'Toplama önceliğini ağ yoğunluğuna göre seç.',
    ],
    ['requires_container_source'],
  ),
  ...contextPool(
    'vehicle_maintenance',
    'pressure_line',
    [
      'Araç baskısı bu hatta atamayı etkileyebilir.',
      'Bakım penceresi sevk kararıyla hizalanmalı.',
      'Aracı zorlamadan önce bakım riskini oku.',
      'Dengeli yönlendirme bakım yükünü azaltabilir.',
    ],
    ['requires_vehicle_source'],
  ),
  ...contextPool(
    'team_fatigue',
    'pressure_line',
    [
      'Ekip yorgunluğu bu atamada risk sinyali verebilir.',
      'Personel baskısı rota kararını zorlayabilir.',
      'Yorulmuş ekip sonraki görevi etkileyebilir.',
      'Kapasiteyi ekip durumuyla birlikte tart.',
    ],
    ['requires_team_source'],
  ),
  ...contextPool(
    'district_memory',
    'map_line',
    [
      'Dünkü karar burada iz bırakmış olabilir.',
      'Bu bölge şehir hafızasında takip ediliyor.',
      'Sonraki gün bu mahalle tekrar önem kazanabilir.',
      'Geçmiş müdahale bu noktada okunabilir.',
    ],
    ['requires_memory_source'],
  ),
  ...contextPool(
    'result_trace',
    'map_line',
    [
      'Karar sonucu bu bölgede haritada görülebilir.',
      'Sonuç izi şehir hafızasına bağlanabilir.',
      'Önceki müdahale etkisi bu noktada okunur.',
      'Sonuç hattını harita bağlamıyla takip et.',
    ],
    ['requires_result_source'],
  ),
  ...contextPool(
    'tomorrow_risk',
    'decision_line',
    [
      'Bu tercih yarın rota baskısına dönebilir.',
      'Bugünkü hız yarın kaynak alanını daraltabilir.',
      'Seçim yarın sosyal baskıyı değiştirebilir.',
      'Yarın etkisini plan seçimiyle birlikte oku.',
    ],
    ['requires_live_pressure'],
    'day_8_plus',
  ),
  ...contextPool(
    'authority_layer',
    'locked_teaser',
    [
      'Bu katman yeni yetkinle daha anlamlı okunur.',
      'Yetkin arttıkça bu sinyal karar desteğine dönüşür.',
      'Detaylı görünüm öncelikli bölgeleri netleştirir.',
      'Bu bilgi artık sadece uyarı değil, plan desteği sağlar.',
    ],
    ['requires_authority_permission'],
    'day_10_plus',
  ),
  ...contextPool(
    'fallback',
    'map_line',
    [
      'Harita aktif operasyonu izliyor.',
      'Bu bölge operasyon bağlamında takip ediliyor.',
      'Detayı açarak bir sonraki adımı gör.',
      'Şehir sinyali şu an sakin görünüyor.',
    ],
    ['safe_baseline'],
  ),
];

export const MAP_SIGNAL_COPY_TEMPLATES: MapSignalCopyTemplate[] = [
  ...ACTIVE_OPERATION_TEMPLATES,
  ...buildDistrictTemplates(),
  ...CONTEXT_POOL_TEMPLATES,
];

export function getMapSignalCopyTemplates(): readonly MapSignalCopyTemplate[] {
  return MAP_SIGNAL_COPY_TEMPLATES;
}

export function getDistrictPersonalityCopyFromPool(
  criterionId: (typeof DISTRICT_CRITERION_IDS)[number],
  kind: 'map_signal' | 'decision_line' | 'district_line' | 'next_action_line',
  index = 0,
): string | undefined {
  const kindMap: Record<string, MapSignalCopyLineKind> = {
    map_signal: 'map_line',
    decision_line: 'decision_line',
    district_line: 'district_line',
    next_action_line: 'next_action_line',
  };
  const mappedKind = kindMap[kind];
  const matches = MAP_SIGNAL_COPY_TEMPLATES.filter(
    (template) =>
      template.context === 'district_personality' &&
      template.districtCriterionId === criterionId &&
      template.kind === mappedKind,
  );
  return matches[index]?.text ?? matches[0]?.text;
}
