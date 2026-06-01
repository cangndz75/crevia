import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  AdvisorEchoTemplate,
  EventEchoDomain,
  EventEchoOutcomeBand,
  EventEchoTone,
  ReportEchoTemplate,
  SocialEchoTemplate,
  TomorrowHintEchoTemplate,
} from './eventEchoTypes';

const ALL_OUTCOME_BANDS: EventEchoOutcomeBand[] = [
  'strong_success',
  'partial_success',
  'strained_success',
  'mixed',
  'weak',
  'unresolved',
];

const MIXED_OUTCOMES: EventEchoOutcomeBand[] = [
  'partial_success',
  'strained_success',
  'mixed',
  'strong_success',
];

type SeedRow = {
  domain: EventEchoDomain;
  tone: EventEchoTone;
  texts: string[];
  districtIds?: MapDistrictId[];
  forbiddenInDay1?: boolean;
  allowInPilotFinal?: boolean;
};

function advisorSeeds(): SeedRow[] {
  return [
    {
      domain: 'container',
      tone: 'mixed',
      texts: [
        'Bugünkü müdahale konteyner çevresini rahatlatır; fakat araç yükü artıyorsa yarına rota baskısı bırakabilir.',
        'Hızlı toplama bugün görünür baskıyı düşürür; sık hat kullanımı ise bakım riskini büyütebilir.',
        'Konteyner hattında tempo önemli; aynı aracı tekrar yüklemek yarın sabahı zorlaştırabilir.',
        'Saha sonucu bugün iyi görünür; önleyici sıklık seçilmezse aynı nokta yarın tekrar şikayet üretebilir.',
        'Dar sokakta hızlı müdahale şikayeti keser; rota paylaşımı ise gün sonu yükünü dengeler.',
        'Gece bırakımı için erken ekip bugünü toparlar; maliyet ve tempo yarın izlenmeli.',
        'Yanlış atık ayrımında iletişim kadar saha hızı da etkilidir.',
        'Apartman hattında hızlı sonuç güven verir; ekip rotasyonu yarına dayanıklılık bırakır.',
      ],
      districtIds: ['cumhuriyet'],
    },
    {
      domain: 'vehicle',
      tone: 'warning',
      texts: [
        'Araç uygun görünüyor, ancak aynı hattı tekrar yüklemek bakım riskini büyütebilir. Daha yavaş rota yarını korur.',
        'Kapasite seçimi bugün sonucu belirler; yoğun kullanım yarına yorgunluk taşıyabilir.',
        'Büyük araç hızlı sonuç verir; bölünmüş kapasite ise aracı korur ama tempo düşer.',
        'Bakım uyarısı yaklaşıyorsa kısa pencere yarını güvenli tutar; sahada kalma bugünü hızlandırır.',
        'Ağır hat için doğru araç kritik; yanlış seçim gecikme ve şikayet üretir.',
        'Gün sonu yükü şişerse akşam görünürlük baskısı artar; dağıtım planı değerli.',
      ],
      districtIds: ['sanayi'],
    },
    {
      domain: 'route',
      tone: 'strategic',
      texts: [
        'Tek hat hızlı görünür sonuç verir; bölünmüş rota yavaş başlar ama yarınki yorgunluğu düşürür.',
        'Akşam rota çakışmasında öncelik seçimi bugün gecikmeyi belirler; araç dayanıklılığı yarın izlenmeli.',
        'Dar geçişte araç boyutu kadar sıra planı da önemli; güvenli seçim tempo kaybettirebilir.',
        'Durak hattında sabah gecikmesi akşam dalgasına taşınabilir; öncelik net olmalı.',
        'Merkez görünürlüğünde rota sırası algıyı etkiler; dengeli dağıtım uzun vadede hız getirir.',
        'İstasyon geçişinde hız kadar rota sürdürülebilirliği de kritik.',
      ],
      districtIds: ['istasyon'],
    },
    {
      domain: 'personnel',
      tone: 'strategic',
      texts: [
        'Aynı ekip bölgeyi tanıdığı için hızlı çalışır; rotasyon ise bugünkü hızı azaltıp yarınki saha dayanıklılığını korur.',
        'Üst üste tempo bugün sonuç verir; moral düşüşü yarın yavaşlamaya yol açabilir.',
        'Deneyimli ekip güven verir; diğer hatların beklemesi kaynak baskısı yaratır.',
        'Teknik-saha sırası Sanayi hattında tekrar maliyetini düşürür.',
        'Akşam ekibinde saha ve iletişim yükünü ayırmak tempo korur.',
        'Kısa dinlenme yarın temposunu güçlendirir; bugünkü hız ise görünür rahatlama sağlar.',
      ],
      districtIds: ['cumhuriyet'],
    },
    {
      domain: 'social',
      tone: 'calm',
      texts: [
        'Sorun fiziksel olarak küçük, görünürlüğü yüksek. Kısa bilgilendirme sosyal nabzı daha hızlı sakinleştirebilir.',
        'Takdir ve yeni şikayet aynı saate denk gelirse öncelik net olmalı.',
        'Mahalle kıyası adalet beklentisi doğurur; planlı sıra yavaş görünse de güven verir.',
        'Sessiz müdahale hızlıdır; kısa duyuru algıyı dengeler.',
        'Apartman zincirinde gecikme paylaşımı hızla büyür; iletişim tonu önemli.',
        'Yeşilvadi’de küçük düzensizlik algı etkisi yüksek; sessiz tempo değerli.',
      ],
      districtIds: ['merkez'],
    },
    {
      domain: 'crisis_adjacent',
      tone: 'warning',
      texts: [
        'Henüz kriz yok; ama sosyal tepki ve kaynak yükü aynı bölgede birleşiyor. Bugün önleyici karar daha değerli.',
        'Birleşen sinyaller panik değil; önleyici kaynak seçimi riski dağıtır.',
        'Yoğun müdahale bugün sinyali keser; izleme kaynakları korur ama eşiği yarın yükseltebilir.',
        'Sanayi’de üç sinyal aynı sabaha sıkıştı; hız kadar sürdürülebilirlik de önemli.',
        'Merkez görünürlük ve rota yükü birleşince öncelik netleşmeli.',
        'Hassas mahallede küçük birleşim bile algıyı düşürebilir; erken denge gerekir.',
      ],
      forbiddenInDay1: true,
    },
    {
      domain: 'district_balance',
      tone: 'strategic',
      texts: [
        'Bir mahalleyi hızlı toparlamak iyi, fakat diğer bölgelerde bekleme algısı oluşuyorsa dengeyi korumak gerekir.',
        'Dengeli paylaşım her hattı orta seviyede tutar; tek öncelik bir tarafı zorlar.',
        'Komşu mahalle kıyası adil dağılım ister; hızlı tek hat çözümü kısa vadeli rahatlatır.',
        'Merkez önceliği görünür sonuç verir; Sanayi beklemesi yarın baskı üretebilir.',
        'Planlı sıra yavaş görünür ama zincir şikayetini azaltır.',
      ],
      districtIds: ['merkez'],
    },
    {
      domain: 'pilot_learning',
      tone: 'calm',
      texts: [
        'İlk günlerde tempo öğrenilir; küçük kararlar ilerleyen günlerde tekrar yankılanabilir.',
        'Bugünkü tercih basit görünse de yarınki hat seçimini etkileyebilir.',
        'Öğrenme gününde görünür sonuç kadar sürdürülebilir tempo da değerli.',
      ],
      forbiddenInDay1: false,
      allowInPilotFinal: false,
    },
    {
      domain: 'pilot_final',
      tone: 'recovery',
      texts: [
        'Pilot haftanın sonunda denge özeti önemli; bugünkü kararlar ana operasyon tonunu işaret eder.',
        'Gün sonu değerlendirmesinde kaynak ve algı birlikte okunmalı.',
        'Final gününde hız kadar yarın bırakılan izlenim de kritik.',
      ],
      allowInPilotFinal: true,
    },
    {
      domain: 'generic_operation',
      tone: 'mixed',
      texts: [
        'Bugünkü müdahale görünür sonucu toparlar; bedel genelde yarınki tempo veya kaynak yükünde görünür.',
        'Orta tempo çoğu hat için kabul edilebilir; tam çözüm her zaman aynı gün görünmez.',
        'Karar sonrası saha ve sosyal nabız birlikte izlenmeli.',
        'Kaynak baskısı düşükse hızlı seçenek değerli; baskı yüksekse denge öne çıkar.',
        'Sonuç iyi görünse bile carry-over sinyali varsa yarın planı güncellenmeli.',
      ],
    },
  ];
}

function socialSeeds(): SeedRow[] {
  return [
    {
      domain: 'container',
      tone: 'positive',
      texts: [
        'Cumhuriyet’te sabah yolun açıldığını fark ettik, ekip hızlı geldi.',
        'Konteyner çevresi toparlandı ama aynı araç yine bu hatta çalışıyor gibi.',
        'Apartman grubu müdahaleyi olumlu paylaştı, koku azaldı.',
        'Merkez çarşı girişi bugün daha düzenli görünüyor.',
        'Sanayi servis yolu açıldı; sürücü notları olumlu.',
        'Yeşilvadi site hattı sabah toparlandı.',
      ],
    },
    {
      domain: 'vehicle',
      tone: 'mixed',
      texts: [
        'İstasyon’da geçiş açıldı, fakat araçların aynı hatta sıkışması dikkat çekiyor.',
        'Büyük araç hızlı temizledi; bakım gecikmesi konuşuluyor.',
        'Aynı kamyon üçüncü turda; yorgunluk hissediliyor.',
        'Küçük araç park çevresinde sessiz çalıştı, iyi.',
        'Rota gecikmesi azaldı ama ekip temposu düşük görünüyor.',
      ],
    },
    {
      domain: 'route',
      tone: 'warning',
      texts: [
        'Akşam hattında gecikme kısaldı; yine de rota yoğun.',
        'Durak önü düzeldi; yolcu notları karışık.',
        'Dar sokak açıldı; manevra riski konuşuldu.',
        'Gün sonu seferi yetişti gibi, yarın izlenecek.',
      ],
    },
    {
      domain: 'personnel',
      tone: 'mixed',
      texts: [
        'Ekip hızlıydı ama son günlerde aynı bölgede çok yoruldukları belli oluyor.',
        'Rotasyon sonrası tempo düştü ama dikkat arttı.',
        'Atölye temsilcileri ekip sürekliliğini olumlu gördü.',
        'Saha ekibi tanıdık bölgede hızlı; moral notları karışık.',
      ],
    },
    {
      domain: 'social',
      tone: 'positive',
      texts: [
        'Merkez’de sorun küçükken fark edilip açıklama yapılması güven verdi.',
        'Vatandaşlar takip edildiğini yazıyor; şikayet tonu yumuşadı.',
        'Mahalle kıyası bugün sakinleşti gibi.',
        'Görünürlük yüksek noktada hızlı bilgilendirme olumlu.',
      ],
    },
    {
      domain: 'crisis_adjacent',
      tone: 'warning',
      texts: [
        'Sanayi’de işler büyümeden izleniyor gibi, ama gecikme olursa tekrar konuşulur.',
        'Sinyaller birleşti ama henüz kriz yok; takip sürüyor.',
        'Önleyici müdahale fark edildi; tempo eleştirisi azaldı.',
        'Risk dağıtıldı; yarın aynı hat izlenmeli.',
      ],
      forbiddenInDay1: true,
    },
    {
      domain: 'district_balance',
      tone: 'mixed',
      texts: [
        'Merkez toparlandı ama Sanayi tarafı hâlâ bekliyor gibi hissediliyor.',
        'Bir mahalle hızlandı; diğerinde bekleme notları var.',
        'Adil dağılım bekleniyor; planlı sıra olumlu görüldü.',
      ],
    },
    {
      domain: 'pilot_learning',
      tone: 'calm',
      texts: [
        'İlk günlerde operasyon takip ediliyor; net yorum az.',
        'Küçük düzenleme fark edildi, teşekkür var.',
      ],
    },
    {
      domain: 'pilot_final',
      tone: 'positive',
      texts: [
        'Pilot hafta sonunda genel tablo konuşuluyor; beklenti ana operasyon.',
        'Son gün müdahaleleri özetlendi; ton dengeli.',
      ],
      allowInPilotFinal: true,
    },
    {
      domain: 'generic_operation',
      tone: 'calm',
      texts: [
        'Saha düzeni bugün iyileşti; detay yarın izlenecek.',
        'Kısa notlar olumlu; tam çözüm bekleniyor.',
        'Mahalle grubu müdahaleyi gördü, devamı isteniyor.',
      ],
    },
  ];
}

function reportSeeds(): SeedRow[] {
  return [
    {
      domain: 'container',
      tone: 'recovery',
      texts: [
        'Cumhuriyet’te görünür konteyner baskısı azaldı; araç yükü yarın izlenmeli.',
        'Merkez çarşı hattı toparlandı; gün sonu rota yükü raporda not edildi.',
        'Apartman hattında doluluk düştü; sıklık planı yarın etkili olacak.',
        'Sanayi servis yolu güvenli; önleyici plan kayıtlı.',
        'Yeşilvadi park çevresi düzenli; kapak rutini planlandı.',
        'İstasyon görüntü baskısı azaldı; takip sürüyor.',
      ],
    },
    {
      domain: 'vehicle',
      tone: 'mixed',
      texts: [
        'İstasyon rotası bugün dengelendi; araç yorgunluğu ertesi gün planında dikkat istiyor.',
        'Ağır atık hattı kontrol altında; bakım riski izleniyor.',
        'Kapasite seçimi sonuç verdi; yedek araç ihtimali yarın değerlendirilecek.',
        'Bakım penceresi planlandı; sabah hattı sürdürüldü.',
      ],
    },
    {
      domain: 'route',
      tone: 'strategic',
      texts: [
        'Akşam rota baskısı kontrol edildi; araç yükü yarın izlenmeli.',
        'Dar sokak hattı açıldı; araç tipi yarın sabitlenecek.',
        'Gün sonu yükü dağıtıldı; sabah tempo raporda izleniyor.',
      ],
    },
    {
      domain: 'personnel',
      tone: 'mixed',
      texts: [
        'Saha ekibi hızlı sonuç verdi; rotasyon yapılmazsa yarın tempo düşebilir.',
        'Ekip morali korundu; üst üste tempo riski not edildi.',
        'Teknik-saha eşleşmesi başarılı; tekrar maliyeti düşük.',
        'Akşam ekibi görev paylaşımı güncellendi.',
      ],
    },
    {
      domain: 'social',
      tone: 'calm',
      texts: [
        'Merkez’de sosyal görünürlük baskısı sakinleşti; saha temposu yarın dengelenmeli.',
        'Apartman algısı toparlandı; iletişim planı sürecek.',
        'Mahalle kıyası yumuşadı; hat sırası güncellenecek.',
        'Sosyal nabız kısa süreli rahatlama gösterdi.',
      ],
    },
    {
      domain: 'crisis_adjacent',
      tone: 'preventive',
      texts: [
        'Sanayi’de kriz öncesi sinyal izlendi; kaynak yükü ve sosyal tepki birlikte değerlendirilmeli.',
        'Önleyici müdahale riski dağıttı; eşik yarın hassas başlayabilir.',
        'Birleşen sinyaller kontrol altında; izleme sürüyor.',
      ],
      forbiddenInDay1: true,
    },
    {
      domain: 'district_balance',
      tone: 'strategic',
      texts: [
        'Merkez’de hızlı sonuç alındı; diğer mahallelerde bekleme algısı için yarın denge önemli.',
        'Dengeli paylaşım uygulandı; tam çözüm yarın izlenecek.',
        'Mahalle dengesi raporda not edildi.',
      ],
    },
    {
      domain: 'pilot_learning',
      tone: 'calm',
      texts: [
        'Pilot öğrenme gününde temel düzen sağlandı; ilerleyen günler izlenecek.',
        'İlk müdahaleler kayda geçti; tempo ölçülüyor.',
      ],
    },
    {
      domain: 'pilot_final',
      tone: 'recovery',
      texts: [
        'Pilot hafta özeti tamamlandı; kaynak ve algı birlikte raporlandı.',
        'Final gün kararları ana operasyon geçişine işaret ediyor.',
      ],
      allowInPilotFinal: true,
    },
    {
      domain: 'generic_operation',
      tone: 'mixed',
      texts: [
        'Günlük operasyon hedefleri kısmen karşılandı; yarın plan güncellenecek.',
        'Saha ve sosyal sinyaller birlikte raporlandı.',
        'Sonuçlar karışık; carry-over notları eklendi.',
      ],
    },
  ];
}

function tomorrowSeeds(): SeedRow[] {
  return [
    {
      domain: 'container',
      tone: 'preventive',
      texts: [
        'Yarın rota planında konteyner hattı tekrar baskı üretmeden önleyici sıklık değerli olur.',
        'Ertesi gün aynı konteyner noktası için erken tur düşünülebilir.',
        'Konteyner çevresi bugün açıldı; yarın doluluk izlenmeli.',
      ],
    },
    {
      domain: 'vehicle',
      tone: 'warning',
      texts: [
        'Yarın rota planında araç yorgunluğu izlenmeli.',
        'Bakım penceresi yarın sabah önceliklendirilmeli.',
        'Aynı araç hattı tekrar yüklenmemeli.',
      ],
    },
    {
      domain: 'route',
      tone: 'strategic',
      texts: [
        'Ertesi gün İstasyon hattı bölünmüş rota ile daha dengeli başlayabilir.',
        'Gün sonu yükü yarın sabah planını etkileyebilir.',
        'Dar sokak planı yarın tekrar gözden geçirilmeli.',
      ],
    },
    {
      domain: 'personnel',
      tone: 'recovery',
      texts: [
        'Ekip temposu bugün korunduysa yarın daha dengeli atama yapılabilir.',
        'Rotasyon yarın Cumhuriyet ekibini taze başlatabilir.',
        'Üst üste tempo varsa yarın dinlenme aralığı değerli.',
      ],
    },
    {
      domain: 'social',
      tone: 'calm',
      texts: [
        'Sosyal tepki bugün sakinleşti; yarın saha sonucu görünür kalmalı.',
        'İletişim planı yarın algıyı desteklemeli.',
        'Görünürlük yüksek hat yarın erken izlenmeli.',
      ],
    },
    {
      domain: 'crisis_adjacent',
      tone: 'preventive',
      texts: [
        'Kriz sinyali düşse bile aynı mahallede iki risk birleşirse tekrar izlenmeli.',
        'Yarın eşik hassas başlayabilir; kaynak korunmalı.',
        'Önleyici plan yarın sabah öncelikli olmalı.',
      ],
      forbiddenInDay1: true,
    },
    {
      domain: 'district_balance',
      tone: 'strategic',
      texts: [
        'Yarın mahalle dengesi için bekleme algısı izlenmeli.',
        'Merkez hızı korunurken diğer hatlar planlanmalı.',
      ],
    },
    {
      domain: 'generic_operation',
      tone: 'mixed',
      texts: [
        'Yarın aynı noktada tekrar izleme gerekebilir.',
        'Carry-over sinyali varsa sabah planı güncellenmeli.',
        'Bugünkü sonuç yarın tempo seçimini etkiler.',
      ],
    },
  ];
}

const ADVISOR_FOCUS: Record<EventEchoDomain, AdvisorEchoTemplate['focus']> = {
  container: 'trade_off',
  vehicle: 'resource_warning',
  route: 'resource_warning',
  personnel: 'carry_over',
  social: 'social_read',
  crisis_adjacent: 'theme_context',
  district_balance: 'theme_context',
  pilot_learning: 'result_explanation',
  pilot_final: 'result_explanation',
  generic_operation: 'trade_off',
};

export function buildAdvisorEchoCatalog(): AdvisorEchoTemplate[] {
  const out: AdvisorEchoTemplate[] = [];
  let n = 0;
  for (const row of advisorSeeds()) {
    for (const text of row.texts) {
      n += 1;
      out.push({
        id: `echo-adv-${row.domain}-${String(n).padStart(3, '0')}`,
        surface: 'advisor',
        domain: row.domain,
        tone: row.tone,
        outcomeBand: row.domain === 'crisis_adjacent' ? MIXED_OUTCOMES : ALL_OUTCOME_BANDS,
        districtIds: row.districtIds,
        text,
        tags: [row.domain, 'ece', row.tone],
        maxLines: 2,
        forbiddenInDay1: row.forbiddenInDay1,
        allowInPilotFinal: row.allowInPilotFinal ?? true,
        advisorRole: 'ece',
        focus: ADVISOR_FOCUS[row.domain],
      });
    }
  }
  return out;
}

const SOCIAL_SENTIMENT: Record<string, SocialEchoTemplate['sentiment']> = {
  positive: 'positive',
  mixed: 'mixed',
  calm: 'neutral',
  warning: 'concerned',
  strategic: 'neutral',
  recovery: 'positive',
  preventive: 'neutral',
  concerned: 'concerned',
  neutral: 'neutral',
};

export function buildSocialEchoCatalog(): SocialEchoTemplate[] {
  const out: SocialEchoTemplate[] = [];
  let n = 0;
  for (const row of socialSeeds()) {
    const sentiment = SOCIAL_SENTIMENT[row.tone] ?? 'mixed';
    for (const text of row.texts) {
      n += 1;
      out.push({
        id: `echo-soc-${row.domain}-${String(n).padStart(3, '0')}`,
        surface: 'social',
        domain: row.domain,
        tone: row.tone,
        outcomeBand: ALL_OUTCOME_BANDS,
        districtIds: row.districtIds,
        text,
        tags: [row.domain, 'social', sentiment],
        maxLines: 2,
        forbiddenInDay1: row.forbiddenInDay1,
        allowInPilotFinal: row.allowInPilotFinal ?? true,
        sentiment,
        speakerType: row.domain === 'social' ? 'general_public' : 'neighborhood_group',
        mentionStyle: 'short',
      });
    }
  }
  return out;
}

const REPORT_SECTION: Record<EventEchoDomain, ReportEchoTemplate['reportSection']> = {
  container: 'main_result',
  vehicle: 'resource_effect',
  route: 'resource_effect',
  personnel: 'resource_effect',
  social: 'social_effect',
  crisis_adjacent: 'tomorrow_signal',
  district_balance: 'district_effect',
  pilot_learning: 'main_result',
  pilot_final: 'main_result',
  generic_operation: 'main_result',
};

export function buildReportEchoCatalog(): ReportEchoTemplate[] {
  const out: ReportEchoTemplate[] = [];
  let n = 0;
  for (const row of reportSeeds()) {
    for (const text of row.texts) {
      n += 1;
      out.push({
        id: `echo-rep-${row.domain}-${String(n).padStart(3, '0')}`,
        surface: 'report',
        domain: row.domain,
        tone: row.tone,
        outcomeBand: ALL_OUTCOME_BANDS,
        districtIds: row.districtIds,
        text,
        tags: [row.domain, 'report', row.tone],
        maxLines: 2,
        forbiddenInDay1: row.forbiddenInDay1,
        allowInPilotFinal: row.allowInPilotFinal ?? true,
        reportSection: REPORT_SECTION[row.domain],
      });
    }
  }
  return out;
}

const DISTRICT_LABELS: Record<MapDistrictId, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

export function buildDistrictEchoExtras(): {
  advisor: AdvisorEchoTemplate[];
  social: SocialEchoTemplate[];
  report: ReportEchoTemplate[];
} {
  const advisor: AdvisorEchoTemplate[] = [];
  const social: SocialEchoTemplate[] = [];
  const report: ReportEchoTemplate[] = [];
  const districts = Object.keys(DISTRICT_LABELS) as MapDistrictId[];

  for (const districtId of districts) {
    const label = DISTRICT_LABELS[districtId];
    advisor.push(
      {
        id: `echo-adv-dist-${districtId}-01`,
        surface: 'advisor',
        domain: 'district_balance',
        tone: 'strategic',
        outcomeBand: MIXED_OUTCOMES,
        districtIds: [districtId],
        text: `${label} hattında hızlı sonuç görünür; diğer mahallelerde bekleme algısı oluşmaması için denge korunmalı.`,
        tags: [districtId, 'district', 'ece'],
        maxLines: 2,
        advisorRole: 'ece',
        focus: 'theme_context',
      },
      {
        id: `echo-adv-dist-${districtId}-02`,
        surface: 'advisor',
        domain: 'generic_operation',
        tone: 'mixed',
        outcomeBand: ALL_OUTCOME_BANDS,
        districtIds: [districtId],
        text: `${label} için bugünkü karar yarınki tempo seçimini etkileyebilir; carry-over sinyalini izle.`,
        tags: [districtId, 'district', 'ece'],
        maxLines: 2,
        advisorRole: 'ece',
        focus: 'carry_over',
      },
    );
    for (let i = 0; i < 4; i += 1) {
      social.push({
        id: `echo-soc-dist-${districtId}-${i}`,
        surface: 'social',
        domain: i % 2 === 0 ? 'social' : 'container',
        tone: 'mixed',
        outcomeBand: ALL_OUTCOME_BANDS,
        districtIds: [districtId],
        text: `${label}’de müdahale fark edildi; ${i % 2 === 0 ? 'algı yumuşadı' : 'konteyner çevresi daha düzenli'}.`,
        tags: [districtId, 'district', 'social'],
        maxLines: 2,
        sentiment: 'mixed',
        speakerType: 'neighborhood_group',
        mentionStyle: 'short',
      });
      report.push({
        id: `echo-rep-dist-${districtId}-${i}`,
        surface: 'report',
        domain: i % 2 === 0 ? 'district_balance' : 'generic_operation',
        tone: 'mixed',
        outcomeBand: ALL_OUTCOME_BANDS,
        districtIds: [districtId],
        text: `${label} hattı bugün raporlandı; yarın ${i % 2 === 0 ? 'denge' : 'tempo'} izlenmeli.`,
        tags: [districtId, 'district', 'report'],
        maxLines: 2,
        reportSection: i % 2 === 0 ? 'district_effect' : 'main_result',
      });
    }
  }
  return { advisor, social, report };
}

export function buildTomorrowHintCatalog(): TomorrowHintEchoTemplate[] {
  const out: TomorrowHintEchoTemplate[] = [];
  let n = 0;
  for (const row of tomorrowSeeds()) {
    for (const text of row.texts) {
      n += 1;
      out.push({
        id: `echo-tmr-${row.domain}-${String(n).padStart(3, '0')}`,
        surface: 'tomorrow_hint',
        domain: row.domain,
        tone: row.tone,
        outcomeBand: ALL_OUTCOME_BANDS,
        text,
        tags: [row.domain, 'tomorrow', row.tone],
        maxLines: 2,
        forbiddenInDay1: row.forbiddenInDay1,
        allowInPilotFinal: row.allowInPilotFinal ?? true,
      });
    }
  }
  return out;
}
