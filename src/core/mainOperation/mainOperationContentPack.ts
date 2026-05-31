import type { EventCard, EventDecisionEffect } from '@/core/models/EventCard';
import type { PostPilotEventScopeContext } from '@/core/postPilot/postPilotEventTypes';
import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

import {
  CRISIS_ADJACENT_CONTEXT_TAG,
  MAIN_OPERATION_CONTEXT_TAG,
  type ContentPackEventDef,
  type ContentPackEventKind,
  buildEventFromDef,
  categoryFromDef,
  mainEffects,
} from './mainOperationContentPackHelpers';

type DecisionBlock = ContentPackEventDef['decisions'];

function choices(
  a: {
    title: string;
    description: string;
    effects: Partial<EventDecisionEffect>;
    decisionStyle?: ContentPackEventDef['decisions'][number]['decisionStyle'];
  },
  b: {
    title: string;
    description: string;
    effects: Partial<EventDecisionEffect>;
    decisionStyle?: ContentPackEventDef['decisions'][number]['decisionStyle'];
  },
  c: {
    title: string;
    description: string;
    effects: Partial<EventDecisionEffect>;
    decisionStyle?: ContentPackEventDef['decisions'][number]['decisionStyle'];
  },
): DecisionBlock {
  return [
    {
      suffix: 'a',
      title: a.title,
      description: a.description,
      style: 'bold',
      decisionStyle: a.decisionStyle ?? 'fast',
      recommended: true,
      effects: a.effects,
    },
    {
      suffix: 'b',
      title: b.title,
      description: b.description,
      style: 'balanced',
      decisionStyle: b.decisionStyle ?? 'planned',
      effects: b.effects,
    },
    {
      suffix: 'c',
      title: c.title,
      description: c.description,
      style: 'cautious',
      decisionStyle: c.decisionStyle ?? 'partial',
      effects: c.effects,
    },
  ];
}

const ANCHOR_DEFS: ContentPackEventDef[] = [
  {
    templateKey: 'district_pressure',
    kind: 'anchor',
    title: 'Çoklu Mahalle Operasyon Baskısı',
    category: 'Operasyon / Mahalle',
    description:
      'Aktif mahalle hatlarında eşzamanlı baskı sinyali var; sezon dengesini korumak için öncelik sırası netleştirilmeli.',
    tags: ['district', 'planning', 'assignment'],
    decisions: choices(
      {
        title: 'Mahalle önceliği belirle',
        description: 'En yoğun hattı sabah turuna al; gecikme riskini düşürür, diğer hat kısa süre geri planda kalır.',
        effects: { risk: -4, publicSatisfaction: 2 },
      },
      {
        title: 'Ekip dağılımını güçlendir',
        description: 'İki mahalle arasında denge kur; maliyet artar ama tek hatta yığılma azalır.',
        effects: { staffMorale: 2, risk: -2, budget: -2 },
      },
      {
        title: 'İzleme modunda tut',
        description: 'Veri topla, akşam değerlendir; bugün müdahale etmezsen risk yavaş yükselir.',
        effects: { risk: 1, staffMorale: 1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'route_capacity',
    kind: 'anchor',
    title: 'Şehir Rotasında Kapasite Dengesi',
    category: 'Operasyon / Rota',
    description:
      'Genişleyen şehir kapsamında rota kapasitesi sıkışıyor; filo ve saha hızını birlikte ayarlamak gerekiyor.',
    tags: ['route', 'vehicle', 'planning'],
    decisions: choices(
      {
        title: 'Rota sıkıştır',
        description: 'Boş araçları kritik hatta topla; hız kazanır, yedek kapasite azalır.',
        effects: { risk: -3, budget: -2 },
      },
      {
        title: 'Geç toplama penceresi',
        description: 'Yoğun saatleri kaydır; vatandaş memnuniyeti kısa süre dalgalanabilir.',
        effects: { publicSatisfaction: -1, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Saha koordinasyonu',
        description: 'Ekipler arası kısa brifing yap; risk düşer, gün içi süre uzar.',
        effects: { staffMorale: 3, risk: -1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'container_balance',
    kind: 'anchor',
    title: 'Konteyner Ağı Sezon Baskısı',
    category: 'Konteyner / Operasyon',
    description:
      'Sezon kapsamındaki konteyner hatlarında doluluk yükseliyor; şehir genelinde denge kurulmalı.',
    tags: ['container', 'district', 'season_goal'],
    decisions: choices(
      {
        title: 'Boşaltma turu aç',
        description: 'Kritik noktalarda ek tur planla; bütçe baskısı artar, taşma riski düşer.',
        effects: { risk: -4, budget: -3 },
      },
      {
        title: 'Yönlendirme uygula',
        description: 'Alternatif toplama noktasına kaydır; memnuniyet artabilir, rota uzar.',
        effects: { publicSatisfaction: 2, risk: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Haftalık plana yaz',
        description: 'Bugün hafif müdahale ile izle; maliyet düşük, risk kademeli artar.',
        effects: { risk: 2 },
        decisionStyle: 'permanent',
      },
    ),
  },
  {
    templateKey: 'city_service_window',
    kind: 'anchor',
    title: 'Şehir Geneli Hizmet Penceresi',
    category: 'Operasyon / Şehir',
    description:
      'Belediye genelinde sabah–öğle hizmet penceresi daralıyor; merkez ve çevre hatları aynı anda talep görüyor.',
    tags: ['route', 'planning', 'public_response'],
    decisions: choices(
      {
        title: 'Merkez hattını öne al',
        description: 'Görünür hatları önce tamamla; çevre mahallelerde gecikme riski artar.',
        effects: { publicSatisfaction: 3, risk: 1 },
      },
      {
        title: 'Döngüsel denge',
        description: 'Her iki bölgeye eşit tur payla; tempo yavaşlar, şikâyet dağılır.',
        effects: { risk: -2, staffMorale: 1, budget: -1 },
      },
      {
        title: 'Akşam tamamlama',
        description: 'Gündüz izle, akşam ek tur; personel yorgunluğu artar.',
        effects: { risk: -1, staffMorale: -2 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'cross_district_coordination',
    kind: 'anchor',
    title: 'Mahalleler Arası Koordinasyon Hattı',
    category: 'Operasyon / Koordinasyon',
    description:
      'İki aktif mahalle aynı filo kaynağını paylaşıyor; ortak brifing olmadan çakışma büyüyebilir.',
    tags: ['district', 'assignment', 'planning'],
    decisions: choices(
      {
        title: 'Ortak brifing',
        description: 'Tek saatlik koordinasyon; çakışma azalır, planlama süresi uzar.',
        effects: { risk: -3, staffMorale: 2 },
        decisionStyle: 'communication',
      },
      {
        title: 'Kaynak ayır',
        description: 'Mahalle başına ayrı ekip; maliyet artar, bağımsızlık güçlenir.',
        effects: { budget: -3, risk: -2 },
      },
      {
        title: 'Sıralı müdahale',
        description: 'Önce bir mahalleyi kapat, sonra diğerine geç; ikinci hat bekler.',
        effects: { publicSatisfaction: -1, risk: -1 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'municipal_communication_line',
    kind: 'anchor',
    title: 'Belediye İletişim Hattı Yoğunluğu',
    category: 'Vatandaş / İletişim',
    description:
      'Şehir genelinde aynı gün çok sayıda geri bildirim geldi; kamu yanıt hızı operasyon algısını etkiliyor.',
    tags: ['social', 'public_response', 'communication'],
    decisions: choices(
      {
        title: 'Aynı gün yanıt',
        description: 'Kısa bilgilendirme yayınla; güven artar, saha süresi kısalır.',
        effects: { publicSatisfaction: 4, staffMorale: -1 },
        decisionStyle: 'communication',
      },
      {
        title: 'Mahalle bazlı not',
        description: 'Her temsilciye özel not; iş yükü artar, isabet yükselir.',
        effects: { publicSatisfaction: 2, risk: -1 },
      },
      {
        title: 'Haftalık özet',
        description: 'Bugün kayda al; hızlı ama algı zayıf kalabilir.',
        effects: { risk: 2 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'seasonal_container_surge',
    kind: 'anchor',
    title: 'Sezonluk Konteyner Dalgalanması',
    category: 'Konteyner / Sezon',
    description:
      'Sezon hedefi kapsamında birden fazla mahallede doluluk eşiği aşıldı; merkezi yönlendirme gerekiyor.',
    tags: ['container', 'season_goal', 'district'],
    decisions: choices(
      {
        title: 'Merkezi boşaltma',
        description: 'Depo hattına ek tur; bütçe ve risk dengelenir.',
        effects: { risk: -3, budget: -2 },
      },
      {
        title: 'Mahalle içi kaydırma',
        description: 'Doluluk düşük noktalara yönlendir; rota karmaşıklaşır.',
        effects: { publicSatisfaction: 1, risk: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Sezon planını güncelle',
        description: 'Kalıcı frekans artışı öner; bugünkü yük hafifler.',
        effects: { risk: 1 },
        decisionStyle: 'permanent',
      },
    ),
  },
  {
    templateKey: 'fleet_dispatch_balance',
    kind: 'anchor',
    title: 'Filo Sevkiyat Dengesi',
    category: 'Araç / Operasyon',
    description:
      'Şehir çapında araç dağılımı dengesiz; kritik hat beklerken başka bölgelerde boş kapasite var.',
    tags: ['vehicle', 'route', 'assignment'],
    decisions: choices(
      {
        title: 'Araç kaydır',
        description: 'Boş aracı yoğun hatta çek; ikinci bölge kısa süre zayıflar.',
        effects: { risk: -3, publicSatisfaction: -1 },
      },
      {
        title: 'Çift tur planı',
        description: 'Aynı araçla iki tur; personel yorgunluğu artar.',
        effects: { risk: -2, staffMorale: -2, budget: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Bakım penceresi ertele',
        description: 'Kritik aracı sahada tut; arıza riski artar.',
        effects: { risk: 2, budget: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'public_channel_load',
    kind: 'anchor',
    title: 'Kamu Kanalı Bildirim Yükü',
    category: 'Vatandaş / Kamu Yanıtı',
    description:
      'Basın ve mahalle kanallarından eşzamanlı talep var; görünür hizmet hattı öncelik kazanıyor.',
    tags: ['public_response', 'social', 'district'],
    decisions: choices(
      {
        title: 'Görünür hat önceliği',
        description: 'Merkez ve ana caddeleri öne al; iç hat gecikmesi riski.',
        effects: { publicSatisfaction: 3, risk: 1 },
      },
      {
        title: 'Ortak açıklama',
        description: 'Tek metinle bilgilendir; algı dengelenir, saha zamanı azalır.',
        effects: { publicSatisfaction: 2, risk: -1 },
        decisionStyle: 'communication',
      },
      {
        title: 'Saha önceliği',
        description: 'İletişimi ertele, operasyonu sürdür; kısa vadede risk artar.',
        effects: { risk: 3, staffMorale: 1 },
      },
    ),
  },
  {
    templateKey: 'transfer_hub_pressure',
    kind: 'anchor',
    title: 'Aktarma Merkezi Baskısı',
    category: 'Operasyon / Aktarma',
    description:
      'İstasyon hattına bağlı aktarma noktasında birikim var; sabah ve öğle geçişleri birbirine bağlı.',
    tags: ['route', 'container', 'planning'],
    decisions: choices(
      {
        title: 'Aktarma önceliği',
        description: 'Merkezi önce boşalt; çevre hatlar kısa süre bekler.',
        effects: { risk: -3, publicSatisfaction: -1 },
      },
      {
        title: 'Geçici hat aç',
        description: 'Alternatif güzergâh; maliyet artar, tıkanıklık azalır.',
        effects: { budget: -3, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Ekip takviyesi',
        description: 'İkinci vardiya parçası gönder; personel yükü artar.',
        effects: { staffMorale: -1, risk: -2, budget: -2 },
      },
    ),
  },
  {
    templateKey: 'multi_neighborhood_brief',
    kind: 'anchor',
    title: 'Çok Mahalleli Sabah Brifing',
    category: 'Operasyon / Planlama',
    description:
      'Günün ilk saatinde beş mahalle için çelişen öncelik listesi geldi; tek gündem kartıyla hizalamak gerekiyor.',
    tags: ['planning', 'district', 'assignment'],
    decisions: choices(
      {
        title: 'Tek öncelik listesi',
        description: 'Tüm ekiplere aynı sırayı ver; netlik artar, esneklik azalır.',
        effects: { risk: -2, staffMorale: 2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Mahalle lideri eşleştir',
        description: 'Her hatta sorumlu atama; koordinasyon yükü artar.',
        effects: { risk: -1, budget: -1 },
      },
      {
        title: 'Pilot bölgeye odaklan',
        description: 'Eski pilot hattını koru; yeni mahalleler bekler.',
        effects: { publicSatisfaction: -2, risk: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
];

const SIDE_DEFS: ContentPackEventDef[] = [
  {
    templateKey: 'social_coordination',
    kind: 'side',
    title: 'Mahalle Temsilcilerinden Günlük Geri Bildirim',
    category: 'Vatandaş / İletişim',
    description:
      'Aktif mahallelerden kısa geri bildirim paketi geldi; sezon iletişim hattını güncellemek gerekiyor.',
    tags: ['social', 'public_response'],
    riskLevel: 'low',
    urgencyHours: 8,
    decisions: choices(
      {
        title: 'Aynı gün yanıt',
        description: 'Temsilcilere kısa saha notu gönder; güven artar.',
        effects: { publicSatisfaction: 4 },
        decisionStyle: 'communication',
      },
      {
        title: 'Kayda al',
        description: 'Haftalık değerlendirmeye ekle; düşük maliyet.',
        effects: { publicSatisfaction: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Ekip notu',
        description: 'Saha ekibine izleme talimatı ver; operasyon odaklı.',
        effects: { risk: -1 },
      },
    ),
  },
  {
    templateKey: 'assignment_review',
    kind: 'side',
    title: 'Saha Ataması Uyum Kontrolü',
    category: 'Operasyon / Atama',
    description:
      'Gün içi atamalarda uyum skorları değişti; sezon hedefi için ekip-araç eşleşmesini gözden geçir.',
    tags: ['assignment', 'personnel', 'season_goal'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Uyumu güçlendir',
        description: 'Zayıf eşleşmeleri yeniden dağıt; moral artar.',
        effects: { staffMorale: 2, risk: -2 },
      },
      {
        title: 'Planı koru',
        description: 'Mevcut atamayla devam et; risk sabit kalır.',
        effects: { risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Danışman notu',
        description: 'Kısa değerlendirme yap; hafif memnuniyet kazancı.',
        effects: { publicSatisfaction: 1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'vehicle_strain',
    kind: 'side',
    title: 'Filo Kullanım Dengesi',
    category: 'Araç / Operasyon',
    description:
      'Şehir kapsamındaki araç kullanımı dengesiz; filo baskısını artırmadan akışı düzeltmek gerekiyor.',
    tags: ['vehicle', 'maintenance'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Araç rotasyonu',
        description: 'Yoğun hattan boş aracı çek; risk düşer.',
        effects: { risk: -2 },
      },
      {
        title: 'Bakım penceresi',
        description: 'Kritik olmayan aracı kısa bakıma al; bütçe harcanır.',
        effects: { budget: -2, risk: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'İzle',
        description: 'Veri topla, yarın karar ver; bugün risk artabilir.',
        effects: { staffMorale: 1, risk: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'planning_calendar_sync',
    kind: 'side',
    title: 'Haftalık Plan Takvimi Uyumu',
    category: 'Operasyon / Planlama',
    description: 'Sezon takvimi ile günlük saha planı arasında küçük sapmalar görülüyor.',
    tags: ['planning', 'season_goal'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Takvimi güncelle',
        description: 'Bugünkü planı sezon hedefine hizala.',
        effects: { risk: -2, staffMorale: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Saha notu bırak',
        description: 'Sapmayı kaydet, müdahale etme.',
        effects: { risk: 1 },
      },
      {
        title: 'Ertesi güne kaydır',
        description: 'Yoğun işi yarına taşı; bugün rahatlar.',
        effects: { staffMorale: 2, publicSatisfaction: -1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'assignment_swap_review',
    kind: 'side',
    title: 'Vardiya Değişim Talebi',
    category: 'Operasyon / Atama',
    description: 'İki ekip gün içi hat değişimi istiyor; sezon atama kurallarına uygunluk kontrol edilmeli.',
    tags: ['assignment', 'personnel'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Değişimi onayla',
        description: 'Esneklik artar, brifing süresi uzar.',
        effects: { staffMorale: 2, risk: -1 },
      },
      {
        title: 'Kısmi değişim',
        description: 'Sadece öğleden sonrayı değiştir.',
        effects: { risk: -1 },
        decisionStyle: 'partial',
      },
      {
        title: 'Planı koru',
        description: 'Mevcut atama ile devam et.',
        effects: { staffMorale: -1, risk: 1 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'vehicle_rotation_note',
    kind: 'side',
    title: 'Araç Rotasyon Notu',
    category: 'Araç / Operasyon',
    description: 'Filo kayıtlarında aynı hatta üç gündür aynı araç görünüyor; rotasyon önerildi.',
    tags: ['vehicle', 'maintenance'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Rotasyon uygula',
        description: 'Arıza riski düşer, alışkanlık bozulur.',
        effects: { risk: -2, staffMorale: -1 },
      },
      {
        title: 'Yarın rotasyon',
        description: 'Bugün mevcut araçla devam.',
        effects: { risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Kısa bakım',
        description: 'Araç servise alınır, yedek araç gerekir.',
        effects: { budget: -2, risk: -1 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'maintenance_window_alert',
    kind: 'side',
    title: 'Bakım Penceresi Uyarısı',
    category: 'Bakım / Operasyon',
    description: 'Planlı bakım ile sabah turu çakışıyor; hangi hattın erteleneceği netleşmeli.',
    tags: ['maintenance', 'vehicle', 'route'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Bakımı öne al',
        description: 'Araç sahada kalır, arıza riski düşer; tur gecikir.',
        effects: { risk: -2, publicSatisfaction: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Turu kaydır',
        description: 'Bakım ertelenir, kısa vadeli risk artar.',
        effects: { risk: 2, budget: 1 },
      },
      {
        title: 'Yedek araç',
        description: 'Maliyet artar, program korunur.',
        effects: { budget: -3, risk: -1 },
      },
    ),
  },
  {
    templateKey: 'route_overlap_check',
    kind: 'side',
    title: 'Rota Çakışma Kontrolü',
    category: 'Operasyon / Rota',
    description: 'İki ekip aynı sokakta üst üste planlanmış; çakışma şikâyet riski var.',
    tags: ['route', 'planning'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Rotayı ayır',
        description: 'Çakışma kalkar, toplam mesafe artar.',
        effects: { risk: -2, budget: -1 },
      },
      {
        title: 'Sıralı geçiş',
        description: 'Aynı hat, farklı saat; bekleme süresi uzar.',
        effects: { publicSatisfaction: -1, risk: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Bir turu iptal',
        description: 'Maliyet düşer, hizmet seyrekleşir.',
        effects: { budget: 2, risk: 2 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'personnel_shift_gap',
    kind: 'side',
    title: 'Vardiya Boşluğu',
    category: 'Personel / Operasyon',
    description: 'Sabah vardiyasında iki kişilik açık var; sezon personel hedefi etkilenebilir.',
    tags: ['personnel', 'assignment'],
    riskLevel: 'medium',
    decisions: choices(
      {
        title: 'İç rotasyon',
        description: 'Öğleden vardiyadan destek al; yorgunluk artar.',
        effects: { staffMorale: -1, risk: -2 },
      },
      {
        title: 'Hat daralt',
        description: 'Daha az nokta, mevcut kadro ile yetin.',
        effects: { publicSatisfaction: -2, risk: -1 },
        decisionStyle: 'partial',
      },
      {
        title: 'Geçici görevlendirme',
        description: 'Bütçe harcanır, kapasite korunur.',
        effects: { budget: -2, risk: -2 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'district_rep_callback',
    kind: 'side',
    title: 'Mahalle Temsilcisi Geri Arama',
    category: 'Vatandaş / İletişim',
    description: 'Dünkü operasyon için temsilci geri arama talep etti; kısa yanıt bekleniyor.',
    tags: ['social', 'district', 'public_response'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Aynı gün ara',
        description: 'Güven artar, planlama süresi kısalır.',
        effects: { publicSatisfaction: 3 },
        decisionStyle: 'communication',
      },
      {
        title: 'Yazılı özet gönder',
        description: 'Hızlı ama kişisel temas zayıf.',
        effects: { publicSatisfaction: 1, risk: -1 },
      },
      {
        title: 'Haftalık toplantıya bırak',
        description: 'Operasyon odaklı; algı riski artar.',
        effects: { risk: 2 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'container_overflow_hint',
    kind: 'side',
    title: 'Konteyner Taşma İpucu',
    category: 'Konteyner / Operasyon',
    description: 'Sensör verisi henüz alarm vermedi ama doluluk eğilimi yükseliyor.',
    tags: ['container', 'route'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Önleyici tur',
        description: 'Maliyet artar, taşma önlenir.',
        effects: { budget: -2, risk: -3 },
      },
      {
        title: 'İzleme listesine al',
        description: 'Veri topla, müdahale ertelenir.',
        effects: { risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Yönlendirme levhası',
        description: 'Vatandaşı alternatif noktaya yönlendir.',
        effects: { publicSatisfaction: 1, risk: -1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'public_message_draft',
    kind: 'side',
    title: 'Kamu Mesajı Taslağı',
    category: 'Vatandaş / İletişim',
    description: 'Belediye kanalı için günlük operasyon özeti taslağı hazır; yayın zamanı seçilmeli.',
    tags: ['public_response', 'social'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Sabah yayınla',
        description: 'Şeffaflık artar, hata düzeltme süresi kısalır.',
        effects: { publicSatisfaction: 2 },
        decisionStyle: 'communication',
      },
      {
        title: 'Akşam özeti',
        description: 'Veri daha doğru, gün içi spekülasyon artabilir.',
        effects: { publicSatisfaction: 1, risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Yayınlama',
        description: 'Sadece iç kayıt; dış algı değişmez.',
        effects: { risk: 1 },
      },
    ),
  },
  {
    templateKey: 'season_goal_checkpoint',
    kind: 'side',
    title: 'Sezon Hedefi Kontrol Noktası',
    category: 'Operasyon / Sezon',
    description: 'Sezon hedefi ilerleme tablosu güncellendi; iki gösterge geride.',
    tags: ['season_goal', 'planning'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Önceliği yükselt',
        description: 'Geride kalan göstergelere ek tur.',
        effects: { budget: -2, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Hedefi daralt',
        description: 'Gerçekçi ara hedef belirle.',
        effects: { staffMorale: 2, risk: 1 },
      },
      {
        title: 'Mevcut tempoda devam',
        description: 'Değişiklik yok; sezon sonu baskısı artar.',
        effects: { risk: 2 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'field_team_morale_ping',
    kind: 'side',
    title: 'Saha Ekibi Moral Sinyali',
    category: 'Personel / Operasyon',
    description: 'Üç ekipten kısa yorgunluk bildirimi geldi; tempo sürdürülebilirliği sorgulanıyor.',
    tags: ['personnel', 'assignment'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Mola penceresi',
        description: 'Kısa dinlenme; gün süresi uzar.',
        effects: { staffMorale: 3, risk: 1 },
      },
      {
        title: 'Hat hafiflet',
        description: 'Daha az nokta, aynı kadro.',
        effects: { staffMorale: 2, publicSatisfaction: -1 },
        decisionStyle: 'partial',
      },
      {
        title: 'Teşvik notu',
        description: 'Maliyetsiz moral desteği; fiziksel yük devam eder.',
        effects: { staffMorale: 1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'communication_briefing',
    kind: 'side',
    title: 'İletişim Brifingi',
    category: 'Vatandaş / İletişim',
    description: 'Mahalle temsilcileri için standart yanıt metni güncellenmeli.',
    tags: ['social', 'public_response'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Metni yayınla',
        description: 'Tutarlı yanıt, hazırlık süresi.',
        effects: { publicSatisfaction: 2, risk: -1 },
        decisionStyle: 'communication',
      },
      {
        title: 'Örnek olay ekle',
        description: 'Daha isabetli ama uzun metin.',
        effects: { publicSatisfaction: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Ertesi haftaya bırak',
        description: 'Bugünkü geri bildirimler dağınık kalır.',
        effects: { risk: 2 },
      },
    ),
  },
  {
    templateKey: 'operational_log_review',
    kind: 'side',
    title: 'Operasyon Günlüğü İncelemesi',
    category: 'Operasyon / Kayıt',
    description: 'Dünkü kararların günlük kaydı eksik satır içeriyor; sezon raporu için tamamlanmalı.',
    tags: ['planning', 'assignment'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Kaydı tamamla',
        description: 'Raporlama güvenilirliği artar.',
        effects: { risk: -1, staffMorale: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Özet satır ekle',
        description: 'Hızlı kapanış, detay kaybı.',
        effects: { risk: 1 },
        decisionStyle: 'partial',
      },
      {
        title: 'Danışmanla gözden geçir',
        description: 'Kalite artar, zaman harcanır.',
        effects: { risk: -2, budget: -1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'evening_handoff_note',
    kind: 'side',
    title: 'Akşam Devir Notu',
    category: 'Operasyon / Planlama',
    description: 'Akşam vardiyası için devir notu hazırlanmadı; kritik hat riski var.',
    tags: ['planning', 'personnel'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Detaylı devir',
        description: 'Gece riski düşer, gün uzar.',
        effects: { risk: -2, staffMorale: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Kısa devir',
        description: 'Hızlı geçiş, eksik bilgi riski.',
        effects: { risk: 1, staffMorale: 1 },
        decisionStyle: 'fast',
      },
      {
        title: 'Sabah brifingine bırak',
        description: 'Gece ekibi kısıtlı bilgiyle çalışır.',
        effects: { risk: 3 },
        decisionStyle: 'partial',
      },
    ),
  },
];

const DISTRICT_DEFS: ContentPackEventDef[] = [
  {
    templateKey: 'visible_service_line',
    kind: 'district',
    districtId: 'merkez',
    title: 'Merkez: Görünür Hizmet Hattı',
    category: 'Merkez / Hizmet',
    description:
      'Ana caddelerde hizmet görünürlüğü düşük algılanıyor; merkez hattında öncelik netleştirilmeli.',
    tags: ['district', 'public_response', 'route'],
    decisions: choices(
      {
        title: 'Caddeleri öne al',
        description: 'Görünür hat önce tamamlanır; ara sokaklar bekler.',
        effects: { publicSatisfaction: 4, risk: 1 },
      },
      {
        title: 'İkili tur',
        description: 'Cadde ve ara sokak aynı gün; maliyet artar.',
        effects: { budget: -2, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Akşam tamamlama',
        description: 'Gündüz izle, akşam görünürlük turu.',
        effects: { risk: -1, staffMorale: -2 },
      },
    ),
  },
  {
    templateKey: 'press_visibility_spike',
    kind: 'district',
    districtId: 'merkez',
    title: 'Merkez: Basın İlgi Artışı',
    category: 'Merkez / Kamu Yanıtı',
    description: 'Yerel basın merkez operasyonunu izlemeye aldı; hata payı düşük tutulmalı.',
    tags: ['district', 'public_response', 'social'],
    decisions: choices(
      {
        title: 'Şeffaf bilgilendirme',
        description: 'Kısa basın notu; güven artar, süre alır.',
        effects: { publicSatisfaction: 3, staffMorale: -1 },
        decisionStyle: 'communication',
      },
      {
        title: 'Saha önceliği',
        description: 'İletişimi minimumda tut, operasyonu hızlandır.',
        effects: { risk: 2 },
        decisionStyle: 'fast',
      },
      {
        title: 'Ortak brifing',
        description: 'Basın ve temsilci birlikte bilgilendirilir.',
        effects: { publicSatisfaction: 2, risk: -1 },
        decisionStyle: 'planned',
      },
    ),
  },
  {
    templateKey: 'public_response_tracking',
    kind: 'district',
    districtId: 'merkez',
    title: 'Merkez: Kamu Yanıt Takibi',
    category: 'Merkez / İletişim',
    description: 'Son üç günün kamu yanıt skorları merkezde dalgalı; takip hattı açılmalı.',
    tags: ['district', 'public_response', 'planning'],
    riskLevel: 'low',
    decisions: choices(
      {
        title: 'Günlük ölçüm',
        description: 'Veri topla, hızlı müdahale imkânı.',
        effects: { risk: -2, budget: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Temsilci görüşmesi',
        description: 'Doğrudan geri bildirim; güven artar.',
        effects: { publicSatisfaction: 3 },
        decisionStyle: 'communication',
      },
      {
        title: 'Haftalık rapor',
        description: 'Bugün müdahale etme; trend izlenir.',
        effects: { risk: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'night_complaint_cluster',
    kind: 'district',
    districtId: 'cumhuriyet',
    title: 'Cumhuriyet: Gece Şikâyet Kümesi',
    category: 'Cumhuriyet / Vatandaş',
    description: 'Gece toplama saatinden şikâyetler birikti; pilot bölgesinde güven sorgulanıyor.',
    tags: ['district', 'social', 'route'],
    decisions: choices(
      {
        title: 'Saat kaydır',
        description: 'Gece gürültüsü azalır, sabah yoğunluğu artar.',
        effects: { publicSatisfaction: 3, risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Sessiz ekipman',
        description: 'Bütçe harcanır, şikâyet düşer.',
        effects: { budget: -2, publicSatisfaction: 2 },
      },
      {
        title: 'Bilgilendirme',
        description: 'Vatandaşa program açıklanır; fiziksel değişiklik yok.',
        effects: { publicSatisfaction: 1, risk: 2 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'container_repeat_signal',
    kind: 'district',
    districtId: 'cumhuriyet',
    title: 'Cumhuriyet: Tekrarlayan Konteyner',
    category: 'Cumhuriyet / Konteyner',
    description: 'Aynı noktada üç gündür doluluk uyarısı var; tekrar eden hat olarak işaretlendi.',
    tags: ['district', 'container'],
    decisions: choices(
      {
        title: 'Frekans artır',
        description: 'Kalıcı çözüm eğilimi; maliyet artar.',
        effects: { risk: -3, budget: -2 },
        decisionStyle: 'permanent',
      },
      {
        title: 'Ek kap',
        description: 'Geçici kapasite; görünüm karmaşıklaşır.',
        effects: { publicSatisfaction: -1, risk: -2 },
        decisionStyle: 'fast',
      },
      {
        title: 'İzleme modu',
        description: 'Veri topla, müdahale ertelenir.',
        effects: { risk: 2 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'neighborhood_rep_warning',
    kind: 'district',
    districtId: 'cumhuriyet',
    title: 'Cumhuriyet: Temsilci Uyarısı',
    category: 'Cumhuriyet / İletişim',
    description: 'Mahalle temsilcisi gecikme konusunda resmi uyarı niteliğinde not gönderdi.',
    tags: ['district', 'social', 'public_response'],
    decisions: choices(
      {
        title: 'Aynı gün düzelt',
        description: 'Güven onarılır, plan sıkışır.',
        effects: { publicSatisfaction: 4, risk: -1, staffMorale: -1 },
        decisionStyle: 'fast',
      },
      {
        title: 'Orta vadeli plan',
        description: 'Haftalık iyileştirme taahhüdü.',
        effects: { publicSatisfaction: 2, risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Veri paylaş',
        description: 'Şeffaflık artar, fiziksel değişiklik yok.',
        effects: { publicSatisfaction: 1, risk: 2 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'high_volume_shift',
    kind: 'district',
    districtId: 'sanayi',
    title: 'Sanayi: Yüksek Hacim Vardiyası',
    category: 'Sanayi / Operasyon',
    description: 'Sanayi bölgesinde üretim artışıyla atık hacmi yükseldi; sabah turu yetmiyor.',
    tags: ['district', 'container', 'route'],
    decisions: choices(
      {
        title: 'Ek tur',
        description: 'Hacim karşılanır, maliyet artar.',
        effects: { budget: -3, risk: -3 },
        decisionStyle: 'fast',
      },
      {
        title: 'Öğleden sonra tur',
        description: 'Sabah sıkışıklığı azalır, işletme beklentisi değişir.',
        effects: { publicSatisfaction: -1, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Geçici sıkıştırma',
        description: 'Daha az nokta, yoğun noktalar öncelikli.',
        effects: { risk: 1, budget: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'maintenance_route_block',
    kind: 'district',
    districtId: 'sanayi',
    title: 'Sanayi: Bakım Rotası Engeli',
    category: 'Sanayi / Bakım',
    description: 'Yol bakımı sanayi girişinde sabah rotasını kesiyor; alternatif güzergâh şart.',
    tags: ['district', 'maintenance', 'route'],
    decisions: choices(
      {
        title: 'Alternatif rota',
        description: 'Mesafe artar, gecikme azalır.',
        effects: { risk: -2, budget: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Bakım koordinasyonu',
        description: 'Belediye yol ekibiyle saat penceresi iste.',
        effects: { publicSatisfaction: 1, risk: -1 },
        decisionStyle: 'communication',
      },
      {
        title: 'Akşam turu',
        description: 'İşletmeler kapanınca topla; görünürlük düşer.',
        effects: { risk: -1, publicSatisfaction: -2 },
      },
    ),
  },
  {
    templateKey: 'container_capacity_alert',
    kind: 'district',
    districtId: 'sanayi',
    title: 'Sanayi: Konteyner Kapasite Uyarısı',
    category: 'Sanayi / Konteyner',
    description: 'Sanayi konteyner alanında kapasite eşiğine yaklaşıldı; boşaltma sıklığı artırılmalı.',
    tags: ['district', 'container', 'vehicle'],
    decisions: choices(
      {
        title: 'Boşaltma sıklaştır',
        description: 'Taşma önlenir, araç yükü artar.',
        effects: { risk: -3, budget: -2 },
      },
      {
        title: 'Geçici alan',
        description: 'İkinci toplama noktası; düzen karmaşıklaşır.',
        effects: { publicSatisfaction: -1, risk: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'İşletme bilgilendir',
        description: 'Kaynak azaltma talebi; uzun vadeli etki.',
        effects: { publicSatisfaction: 1, risk: 1 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'transfer_delay_chain',
    kind: 'district',
    districtId: 'istasyon',
    title: 'İstasyon: Aktarma Gecikme Zinciri',
    category: 'İstasyon / Aktarma',
    description: 'Aktarma noktasında birikim gecikmeyi tetikledi; bağlantılı hatlar etkileniyor.',
    tags: ['district', 'route', 'container'],
    decisions: choices(
      {
        title: 'Aktarmayı öne al',
        description: 'Zincir kırılır, çevre hat bekler.',
        effects: { risk: -3, publicSatisfaction: -1 },
        decisionStyle: 'fast',
      },
      {
        title: 'Paralel ekip',
        description: 'İkinci ekip gönder; maliyet artar.',
        effects: { budget: -3, risk: -2 },
      },
      {
        title: 'Yarın tamamlama',
        description: 'Bugünkü risk yüksek kalır.',
        effects: { risk: 3 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'morning_route_clash',
    kind: 'district',
    districtId: 'istasyon',
    title: 'İstasyon: Sabah Rota Çakışması',
    category: 'İstasyon / Rota',
    description: 'İstasyon çıkışında iki rota aynı dar sokakta planlanmış; çakışma şikâyeti riski var.',
    tags: ['district', 'route', 'assignment'],
    decisions: choices(
      {
        title: 'Saat ayır',
        description: 'Sıralı geçiş; toplam süre uzar.',
        effects: { risk: -2, publicSatisfaction: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Güzergâh değiştir',
        description: 'Mesafe artar, çakışma biter.',
        effects: { budget: -1, risk: -2 },
      },
      {
        title: 'Bir turu ertele',
        description: 'Maliyet düşük, hizmet seyrek.',
        effects: { risk: 2, publicSatisfaction: -2 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'coordination_risk_spike',
    kind: 'district',
    districtId: 'istasyon',
    title: 'İstasyon: Koordinasyon Riski',
    category: 'İstasyon / Koordinasyon',
    description: 'Yeni açılan istasyon hattında ekipler arası koordinasyon zayıf; hata payı yükseliyor.',
    tags: ['district', 'assignment', 'planning'],
    decisions: choices(
      {
        title: 'Ortak brifing',
        description: 'Koordinasyon güçlenir, zaman harcanır.',
        effects: { risk: -3, staffMorale: 2 },
        decisionStyle: 'communication',
      },
      {
        title: 'Tek sorumlu atama',
        description: 'Netlik artar, yük tek kişide.',
        effects: { risk: -2, staffMorale: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Pilot hattına dön',
        description: 'Yeni hat bekler, güvenli alan korunur.',
        effects: { publicSatisfaction: -2, risk: 1 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'environment_sensitivity_alert',
    kind: 'district',
    districtId: 'yesilvadi',
    title: 'Yeşilvadi: Çevre Hassasiyeti',
    category: 'Yeşilvadi / Çevre',
    description: 'Yeşil alan yakınında operasyon hassasiyeti arttı; gürültü ve zaman penceresi kritik.',
    tags: ['district', 'public_response', 'route'],
    decisions: choices(
      {
        title: 'Sessiz saat',
        description: 'Gürültü azalır, tur süresi uzar.',
        effects: { publicSatisfaction: 3, risk: 1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Hafif ekipman',
        description: 'Maliyet artar, çevre etkisi düşer.',
        effects: { budget: -2, publicSatisfaction: 2 },
      },
      {
        title: 'Standart tempo',
        description: 'Hız korunur, şikâyet riski artar.',
        effects: { risk: 3 },
        decisionStyle: 'fast',
      },
    ),
  },
  {
    templateKey: 'park_odor_report',
    kind: 'district',
    districtId: 'yesilvadi',
    title: 'Yeşilvadi: Park Koku Bildirimi',
    category: 'Yeşilvadi / Kamu Yanıtı',
    description: 'Park kenarı konteynerden koku şikâyeti geldi; hızlı müdahale kamu algısını etkiler.',
    tags: ['district', 'container', 'public_response'],
    decisions: choices(
      {
        title: 'Acil boşaltma',
        description: 'Koku azalır, maliyet artar.',
        effects: { publicSatisfaction: 4, budget: -2 },
        decisionStyle: 'fast',
      },
      {
        title: 'Kapak ve temizlik',
        description: 'Orta müdahale, risk orta.',
        effects: { publicSatisfaction: 2, risk: -1 },
      },
      {
        title: 'Konum değerlendir',
        description: 'Kalıcı taşıma önerisi; bugün etkisiz.',
        effects: { risk: 1 },
        decisionStyle: 'permanent',
      },
    ),
  },
  {
    templateKey: 'recycling_pressure_wave',
    kind: 'district',
    districtId: 'yesilvadi',
    title: 'Yeşilvadi: Geri Dönüşüm Baskısı',
    category: 'Yeşilvadi / Geri Dönüşüm',
    description: 'Geri dönüşüm hatlarında hacim dalgası var; ayrıştırma kapasitesi zorlanıyor.',
    tags: ['district', 'container', 'season_goal'],
    decisions: choices(
      {
        title: 'Ayrı tur',
        description: 'Ayrıştırma kalitesi artar, rota uzar.',
        effects: { risk: -2, budget: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Birleşik toplama',
        description: 'Maliyet düşük, kalite riski.',
        effects: { budget: 1, risk: 2 },
        decisionStyle: 'partial',
      },
      {
        title: 'Vatandaş bilgilendir',
        description: 'Kaynak azaltma mesajı; uzun vadeli etki.',
        effects: { publicSatisfaction: 2, risk: 1 },
        decisionStyle: 'communication',
      },
    ),
  },
];

const CRISIS_ADJACENT_DEFS: ContentPackEventDef[] = [
  {
    templateKey: 'crisis_table_route_alert',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: Rota Alarmı',
    category: 'Kriz / Rota',
    description:
      'Kriz Masası şehir genelinde rota gecikme zinciri riski bildirdi; önleyici öncelik gerekli.',
    tags: ['crisis', 'route', 'planning'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'high',
    urgencyHours: 4,
    decisions: choices(
      {
        title: 'Kritik hat kilidi',
        description: 'Tüm kaynakları tek hatta topla; diğer bölgeler bekler.',
        effects: { risk: -4, publicSatisfaction: -2 },
        decisionStyle: 'fast',
      },
      {
        title: 'Kademeli müdahale',
        description: 'Üç hat için sıralı plan; dengeli ama yavaş.',
        effects: { risk: -2, budget: -2 },
        decisionStyle: 'planned',
      },
      {
        title: 'Masaya rapor',
        description: 'Veri topla, müdahale ertelenir; risk yüksek kalır.',
        effects: { risk: 3 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'crisis_table_container_chain',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: Konteyner Zinciri',
    category: 'Kriz / Konteyner',
    description:
      'Birden fazla mahallede konteyner taşma zinciri ihtimali Masaya yansıdı; merkezi yönlendirme şart.',
    tags: ['crisis', 'container', 'district'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'high',
    decisions: choices(
      {
        title: 'Acil boşaltma hattı',
        description: 'Taşma durur, bütçe ve ekip yükü artar.',
        effects: { risk: -4, budget: -4 },
        decisionStyle: 'fast',
      },
      {
        title: 'Mahalle önceliği',
        description: 'En riskli üç nokta önce; diğerleri bekler.',
        effects: { risk: -2, publicSatisfaction: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'İzleme modu',
        description: 'Alarm eşiğine kadar bekle; risk artar.',
        effects: { risk: 4 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'crisis_table_public_channel',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: Kamu Kanalı',
    category: 'Kriz / İletişim',
    description:
      'Kamu kanallarında operasyon hakkında yoğun talep var; Masadan hızlı yanıt hattı açılması istendi.',
    tags: ['crisis', 'public_response', 'social'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'medium',
    decisions: choices(
      {
        title: 'Resmi açıklama',
        description: 'Güven artar, saha süresi kısalır.',
        effects: { publicSatisfaction: 3, risk: -2 },
        decisionStyle: 'communication',
      },
      {
        title: 'Mahalle bazlı not',
        description: 'İsabetli yanıt, iş yükü artar.',
        effects: { publicSatisfaction: 2, staffMorale: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Operasyon önceliği',
        description: 'İletişim ertelenir; algı riski artar.',
        effects: { risk: 3 },
        decisionStyle: 'fast',
      },
    ),
  },
  {
    templateKey: 'crisis_table_transfer_hub',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: Aktarma Merkezi',
    category: 'Kriz / Aktarma',
    description:
      'Aktarma merkezinde birikim kritik eşiğe yaklaştı; Masadan iki saat içinde plan talep edildi.',
    tags: ['crisis', 'route', 'container'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'high',
    urgencyHours: 3,
    decisions: choices(
      {
        title: 'Tam kapasite tur',
        description: 'Birikimi çözer, personel yorgunluğu artar.',
        effects: { risk: -4, staffMorale: -2, budget: -2 },
        decisionStyle: 'fast',
      },
      {
        title: 'Geçici hat',
        description: 'Alternatif güzergâh; maliyet ve karmaşıklık artar.',
        effects: { risk: -3, budget: -3 },
        decisionStyle: 'planned',
      },
      {
        title: 'Masaya erteleme öner',
        description: 'Risk yüksek kalır, sorumluluk paylaşılır.',
        effects: { risk: 2, publicSatisfaction: -2 },
        decisionStyle: 'communication',
      },
    ),
  },
  {
    templateKey: 'crisis_table_multi_district',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: Çok Mahalle Baskısı',
    category: 'Kriz / Mahalle',
    description:
      'Üç mahallede eşzamanlı baskı sinyali Masaya düştü; tek öncelik listesi olmadan risk büyür.',
    tags: ['crisis', 'district', 'assignment'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'critical',
    urgencyHours: 3,
    decisions: choices(
      {
        title: 'Şehir öncelik listesi',
        description: 'Net sıra; bekleyen mahalleler şikâyet edebilir.',
        effects: { risk: -3, publicSatisfaction: -1 },
        decisionStyle: 'planned',
      },
      {
        title: 'Kaynak takviyesi',
        description: 'Ek ekip; bütçe baskısı artar.',
        effects: { risk: -4, budget: -4 },
        decisionStyle: 'fast',
      },
      {
        title: 'Kademeli müdahale',
        description: 'Bugün bir mahalle; risk diğerlerinde kalır.',
        effects: { risk: 1, publicSatisfaction: -2 },
        decisionStyle: 'partial',
      },
    ),
  },
  {
    templateKey: 'crisis_table_communication_escalation',
    kind: 'crisis_adjacent',
    title: 'Kriz Masası: İletişim Tırmanması',
    category: 'Kriz / İletişim',
    description:
      'Mahalle temsilcileri ve basın aynı konuda Masaya yönlendirildi; tutarlı yanıt şart.',
    tags: ['crisis', 'social', 'public_response'],
    contextTag: CRISIS_ADJACENT_CONTEXT_TAG,
    filterTags: ['crisis'],
    riskLevel: 'high',
    decisions: choices(
      {
        title: 'Ortak masaj',
        description: 'Tüm kanallara aynı metin; tutarlılık artar.',
        effects: { publicSatisfaction: 3, risk: -2 },
        decisionStyle: 'communication',
      },
      {
        title: 'Saha önceliği',
        description: 'Önce operasyon, iletişim sonra; kısa vadeli risk.',
        effects: { risk: 2, staffMorale: 1 },
        decisionStyle: 'fast',
      },
      {
        title: 'Masaya delege',
        description: 'İletişimi üst birim yönetir; operasyon odaklı kalırsın.',
        effects: { risk: -1, publicSatisfaction: -1 },
        decisionStyle: 'planned',
      },
    ),
  },
];

export const ALL_CONTENT_PACK_DEFS: ContentPackEventDef[] = [
  ...ANCHOR_DEFS,
  ...SIDE_DEFS,
  ...DISTRICT_DEFS,
  ...CRISIS_ADJACENT_DEFS,
];

export const GLOBAL_ANCHOR_KEYS = [
  'district_pressure',
  'route_capacity',
  'container_balance',
  'city_service_window',
  'cross_district_coordination',
  'municipal_communication_line',
  'seasonal_container_surge',
  'fleet_dispatch_balance',
  'public_channel_load',
  'transfer_hub_pressure',
  'multi_neighborhood_brief',
] as const;

export const GLOBAL_SIDE_KEYS = [
  'social_coordination',
  'assignment_review',
  'vehicle_strain',
  'planning_calendar_sync',
  'assignment_swap_review',
  'vehicle_rotation_note',
  'maintenance_window_alert',
  'route_overlap_check',
  'personnel_shift_gap',
  'district_rep_callback',
  'container_overflow_hint',
  'public_message_draft',
  'season_goal_checkpoint',
  'field_team_morale_ping',
  'communication_briefing',
  'operational_log_review',
  'evening_handoff_note',
] as const;

export const DISTRICT_EVENT_KEYS: Record<MapDistrictId, string[]> = {
  merkez: [
    'visible_service_line',
    'press_visibility_spike',
    'public_response_tracking',
  ],
  cumhuriyet: [
    'night_complaint_cluster',
    'container_repeat_signal',
    'neighborhood_rep_warning',
  ],
  sanayi: [
    'high_volume_shift',
    'maintenance_route_block',
    'container_capacity_alert',
  ],
  istasyon: [
    'transfer_delay_chain',
    'morning_route_clash',
    'coordination_risk_spike',
  ],
  yesilvadi: [
    'environment_sensitivity_alert',
    'park_odor_report',
    'recycling_pressure_wave',
  ],
};

export const CRISIS_ADJACENT_KEYS = [
  'crisis_table_route_alert',
  'crisis_table_container_chain',
  'crisis_table_public_channel',
  'crisis_table_transfer_hub',
  'crisis_table_multi_district',
  'crisis_table_communication_escalation',
] as const;

export const CONTENT_PACK_BY_KEY: Map<string, ContentPackEventDef> = new Map(
  ALL_CONTENT_PACK_DEFS.map((def) => [def.templateKey, def]),
);

export function buildContentPackEventByKey(
  templateKey: string,
  day: number,
  scope: PostPilotEventScopeContext,
): EventCard {
  const def = CONTENT_PACK_BY_KEY.get(templateKey);
  if (!def) {
    throw new Error(`Unknown main operation content pack key: ${templateKey}`);
  }
  return buildEventFromDef(def, day, scope);
}

export function isContentPackTemplateKey(
  key: string,
  kind?: ContentPackEventKind,
): boolean {
  const def = CONTENT_PACK_BY_KEY.get(key);
  if (!def) {
    return false;
  }
  if (kind != null && def.kind !== kind) {
    return false;
  }
  return true;
}

export function getContentPackCategory(templateKey: string): string {
  const def = CONTENT_PACK_BY_KEY.get(templateKey);
  if (!def) {
    return '';
  }
  return categoryFromDef(def);
}

export function pickContentPackKey(
  pool: string[],
  day: number,
  usedKeys: Set<string>,
  usedCategories: Set<string>,
  categoryResolver: (key: string) => string,
): string | undefined {
  if (pool.length === 0) {
    return undefined;
  }

  const freshCategory = pool.filter(
    (key) =>
      !usedKeys.has(key) && !usedCategories.has(categoryResolver(key)),
  );
  if (freshCategory.length > 0) {
    return freshCategory[day % freshCategory.length];
  }

  const freshKey = pool.filter((key) => !usedKeys.has(key));
  if (freshKey.length > 0) {
    return freshKey[day % freshKey.length];
  }

  return pool[day % pool.length];
}

export function countDefsByKind(kind: ContentPackEventKind): number {
  return ALL_CONTENT_PACK_DEFS.filter((def) => def.kind === kind).length;
}

export function getAllTemplateKeys(): string[] {
  return ALL_CONTENT_PACK_DEFS.map((def) => def.templateKey);
}

export function getAllTitles(): string[] {
  return ALL_CONTENT_PACK_DEFS.map((def) => def.title);
}

export { MAIN_OPERATION_CONTEXT_TAG, CRISIS_ADJACENT_CONTEXT_TAG };

// Re-export for consumers that need effect builder alongside pack defs.
export { mainEffects };
