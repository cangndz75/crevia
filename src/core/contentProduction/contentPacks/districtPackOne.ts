import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

import type {
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
} from '../contentProductionTypes';

export const DISTRICT_PACK_ONE_ID = 'district_pack_one';

export type DistrictPackOneDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type DistrictPackOneEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'result';

export type DistrictPackOneVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'resource_fatigue'
  | 'district_trust'
  | 'crisis_adjacent'
  | 'operation_era'
  | 'player_adaptive'
  | 'recovery';

export type DistrictPackOneDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'district_balance'
  | 'resource_recovery'
  | 'crisis_adjacent'
  | 'operation_era'
  | 'authority_milestone'
  | 'generic_operation';

export type DistrictPackOneVariantCopy = {
  kind: DistrictPackOneVariantKind;
  text: string;
};

export type DistrictPackOneFamily = {
  id: string;
  title: string;
  districtIds: DistrictPackOneDistrictId[];
  domains: DistrictPackOneDomain[];
  affectedActor: string;
  concreteScene: string;
  visibleOperationalProblem: string;
  decisionTradeoff: string;
  shortTermEffect: string;
  carryOverConsequence: string;
  districtOperationKind: string;
  recommendedVariantKinds: DistrictPackOneVariantKind[];
  mapLayerIds: CreviaMapLayerId[];
  trustIntent: string;
  memoryIntent: string;
  resourceIntent: string;
  crisisAdjacency?: string;
  variantCopies: DistrictPackOneVariantCopy[];
  echoes: Record<DistrictPackOneEchoSurface, string>;
};

export const DISTRICT_PACK_ONE_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] = [
  'advisor_echo',
  'report_echo',
  'social_echo',
  'map_hint',
  'tomorrow_preview',
  'operation_result',
] as const;

const DISTRICT_PACK_ONE_OPERATION_ERA_IDS = [
  'core_city_operations',
  'route_maintenance_era',
  'container_network_era',
  'district_trust_era',
  'crisis_recovery_era',
  'social_pulse_era',
  'city_growth_preview_era',
] as const;

function echoes(
  advisor: string,
  report: string,
  social: string,
  map: string,
  tomorrowPreview: string,
  result: string,
): Record<DistrictPackOneEchoSurface, string> {
  return {
    advisor,
    report,
    social,
    map,
    tomorrow_preview: tomorrowPreview,
    result,
  };
}

function variants(
  normal: string,
  second: DistrictPackOneVariantCopy,
  third: DistrictPackOneVariantCopy,
  fourth: DistrictPackOneVariantCopy,
): DistrictPackOneVariantCopy[] {
  return [{ kind: 'normal', text: normal }, second, third, fourth];
}

export const DISTRICT_PACK_ONE_FAMILIES: readonly DistrictPackOneFamily[] = [
  {
    id: 'merkez_meydan_kutu_hatti',
    title: 'Merkez Meydan Kutu Hatti',
    districtIds: ['merkez'],
    domains: ['container', 'social', 'district_balance'],
    affectedActor: 'meydan esnafi',
    concreteScene: 'Meydan girisindeki iki kutu ogle saatinde doluyor.',
    visibleOperationalProblem: 'Yaya gecisi daraliyor ve esnaf sikayet kaydi artiyor.',
    decisionTradeoff: 'Erken bosaltma rotayi uzatir, beklemek sosyal guveni dusurur.',
    shortTermEffect: 'Kutu baskisi ayni gun icinde azalir.',
    carryOverConsequence: 'Gecikirse ertesi sabah meydan rotasi daha yogun baslar.',
    districtOperationKind: 'visible_service_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['resource_pressure', 'district_trust', 'event_family_signal'],
    trustIntent: 'Merkezde gorunur hizmet algisini olcmek.',
    memoryIntent: 'Meydan kutu baskisini ertesi gun hatirlatmak.',
    resourceIntent: 'Kisa ekip penceresi ile arac zamanini dengelemek.',
    variantCopies: variants(
      'Meydan kutulari dolu; kisa ekip penceresi rota baskisini dengeler.',
      { kind: 'improved', text: 'Erken ekip meydan gecisini acik tutar ve esnaf notu yumusar.' },
      { kind: 'carry_over', text: 'Bekleyen kutu sabah vardiyasina ek durak olarak tasinir.' },
      { kind: 'district_trust', text: 'Gorunur temizlik Merkez guven notunu destekler.' },
    ),
    echoes: echoes(
      'Meydanda kisa ama gorunur bir dokunus gerekiyor.',
      'Merkez meydan kutu hatti bugun izleme listesinde.',
      'Esnaf, meydan gecisinin acik kalmasini bekliyor.',
      'Kaynak baskisi katmaninda meydan kutularini one al.',
      'Sabah ilk kontrol meydan girisindeki iki kutuda olsun.',
      'Merkez meydan hatti daha dengeli kapandi.',
    ),
  },
  {
    id: 'merkez_resmi_cadde_vardiya',
    title: 'Merkez Resmi Cadde Vardiya',
    districtIds: ['merkez'],
    domains: ['personnel', 'vehicle_route', 'authority_milestone'],
    affectedActor: 'resmi cadde vardiya ekibi',
    concreteScene: 'Kurum cikis saatinde iki ekip ayni dar caddeye denk geliyor.',
    visibleOperationalProblem: 'Arac beklemesi uzuyor ve saha ritmi aksiyor.',
    decisionTradeoff: 'Bir ekibi kaydirmak gorunurlugu azaltir, bekletmek vardiya yorgunlugu yaratir.',
    shortTermEffect: 'Cadde gecisi daha sakin planlanir.',
    carryOverConsequence: 'Denge kurulmazsa personel yorgunlugu yarina not duser.',
    districtOperationKind: 'shift_balance_merkez',
    recommendedVariantKinds: ['normal', 'worsened', 'resource_fatigue', 'comeback'],
    mapLayerIds: ['active_task_route', 'resource_fatigue', 'operation_era'],
    trustIntent: 'Merkezde hizmet ritminin korunmasini gostermek.',
    memoryIntent: 'Vardiya cakismasini sonraki planlamaya tasimak.',
    resourceIntent: 'Personel yorgunlugunu arac beklemesiyle birlikte tartmak.',
    variantCopies: variants(
      'Resmi caddede iki ekip cakisti; vardiya sirasi yeniden dengelenebilir.',
      { kind: 'worsened', text: 'Bekleme uzarsa ekip yorgunlugu rapora yansir.' },
      { kind: 'resource_fatigue', text: 'Ayni ekibe ikinci dar cadde verilirse saha temposu duser.' },
      { kind: 'comeback', text: 'Gecikme sonrasi kisa rota kaydirmasi hizmeti toparlar.' },
    ),
    echoes: echoes(
      'Caddeyi acmak kadar ekibi diri tutmak da onemli.',
      'Merkez resmi cadde vardiya cakismasi kayda alindi.',
      'Vatandas gecis gecikmesini fark ediyor, ekip notu dusuyor.',
      'Aktif rota katmaninda resmi cadde cakismasini isaretle.',
      'Yarin ayni saat icin ekip dagilimini ayri baslat.',
      'Merkez vardiya dengesi kismi toparlanma gosterdi.',
    ),
  },
  {
    id: 'merkez_ana_durak_gorunurluk',
    title: 'Merkez Ana Durak Gorunurluk',
    districtIds: ['merkez'],
    domains: ['operation_era', 'generic_operation'],
    affectedActor: 'ana durak yolculari',
    concreteScene: 'Ana durak cevresinde kuyruk uzarken temizlik gecisi gorunmuyor.',
    visibleOperationalProblem: 'Hizmet yapilsa bile algi zayif kaliyor.',
    decisionTradeoff: 'Gorunur ekip ayirmak baska sokagin temposunu azaltir.',
    shortTermEffect: 'Durak cevresi daha duzenli algilanir.',
    carryOverConsequence: 'Gorunurluk zayif kalirsa sosyal yorumlar ertesi gun sertlesir.',
    districtOperationKind: 'public_visibility_merkez',
    recommendedVariantKinds: ['normal', 'reward', 'district_trust', 'improved'],
    mapLayerIds: ['social_pulse', 'district_trust', 'operation_era'],
    trustIntent: 'Hizmetin gorunur oldugu anlari guvenle baglamak.',
    memoryIntent: 'Durak algisini sosyal yankiya tasimak.',
    resourceIntent: 'Kisa gorunurluk turu ile ekip sure maliyetini dengelemek.',
    variantCopies: variants(
      'Ana durak temiz ama gorunurluk zayif; kisa ekip turu algiyi dengeler.',
      { kind: 'reward', text: 'Net gorunurluk sosyal yorumlarda destekleyici bir iz birakir.' },
      { kind: 'district_trust', text: 'Durak cevresindeki sakin akis Merkez guvenini besler.' },
      { kind: 'improved', text: 'Ekip gecisi kuyruk saatinden once biterse rapor tonu yumusar.' },
    ),
    echoes: echoes(
      'Durak icin sonuc kadar gorunme zamani da belirleyici.',
      'Merkez ana durak gorunurluk turu rapora eklendi.',
      'Yolcular, ekibin kuyruk oncesi gelmesini olumlu okuyor.',
      'Sosyal nabiz katmaninda ana durak cevresini izle.',
      'Yarin durak temizligi kuyruk saatinden once kontrol edilsin.',
      'Ana durak gorunurlugu Merkez icin olumlu kapandi.',
    ),
  },
  {
    id: 'merkez_kurum_onu_rotasi',
    title: 'Merkez Kurum Onu Rotasi',
    districtIds: ['merkez'],
    domains: ['crisis_adjacent', 'resource_recovery'],
    affectedActor: 'kurum onu ziyaretcileri',
    concreteScene: 'Kurum onu rota daralmasi randevu saatine yaklasiyor.',
    visibleOperationalProblem: 'Arac gecisi gec kalirsa ziyaretci akisi sikisir.',
    decisionTradeoff: 'Rotayi one almak Sanayi baglantisini geciktirir.',
    shortTermEffect: 'Kurum onu gecisi daha kontrollu kalir.',
    carryOverConsequence: 'Ertelenirse sabah ilk rota daha yuklu baslar.',
    districtOperationKind: 'route_recovery_merkez',
    recommendedVariantKinds: ['normal', 'carry_over', 'resource_fatigue', 'worsened', 'crisis_adjacent'],
    mapLayerIds: ['active_task_route', 'crisis_watch', 'resource_pressure'],
    trustIntent: 'Yaklasan riskte sakin hizmet tercihlerini olcmek.',
    memoryIntent: 'Kurum onu rota daralmasini ertesi planlamaya baglamak.',
    resourceIntent: 'Kritik gecisi arac yorgunlugu ile dengelemek.',
    crisisAdjacency: 'Kontrollu yaklasim riski; sert korku tonu yok.',
    variantCopies: variants(
      'Kurum onu rota daraldi; sakin bir oncelik karari gerekiyor.',
      { kind: 'carry_over', text: 'Ertelenen gecis sabah ilk rota listesine ek yuk getirir.' },
      { kind: 'resource_fatigue', text: 'Ayni araci one cekmek Sanayi baglantisinda yorgunluk biriktirir.' },
      { kind: 'worsened', text: 'Gec kalinirsa ziyaretci akisi daha zor yonetilir.' },
    ),
    echoes: echoes(
      'Bu nokta icin hizli degil, sakin oncelik yeterli.',
      'Merkez kurum onu rotasi kontrollu risk notuyla izlendi.',
      'Ziyaretciler daralmayi fark ediyor ama net bilgi tonu koruyor.',
      'Rota katmaninda kurum onu gecisini kisa sure one al.',
      'Yarin kurum onu ilk kontrol listesinde yer alsin.',
      'Kurum onu gecisi Merkez raporunda izlenebilir kaldi.',
    ),
  },
  {
    id: 'cumhuriyet_gece_iri_atik',
    title: 'Cumhuriyet Gece Iri Atik',
    districtIds: ['cumhuriyet'],
    domains: ['container', 'resource_recovery'],
    affectedActor: 'apartman gorevlileri',
    concreteScene: 'Gece birakilan iri atik iki konteynerin onunu kapatiyor.',
    visibleOperationalProblem: 'Sabah bosaltma ekibi kutulara rahat erisemiyor.',
    decisionTradeoff: 'Ek toplama araci cagirmak yakit ve ekip saati kullanir.',
    shortTermEffect: 'Konteyner erisimi acilir.',
    carryOverConsequence: 'Kalinirsa ertesi gun Cumhuriyet kutu baskisi artar.',
    districtOperationKind: 'container_recovery_cumhuriyet',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['resource_pressure', 'district_memory', 'event_family_signal'],
    trustIntent: 'Cumhuriyet apartman cevresinde hizmet guvenini korumak.',
    memoryIntent: 'Iri atik tekrarini apartman aksina not etmek.',
    resourceIntent: 'Ek arac cagrisi ile sabah erisimi arasinda denge kurmak.',
    variantCopies: variants(
      'Iri atik konteyner onunu kapatti; ek arac karari kaynak ister.',
      { kind: 'improved', text: 'Erken kaldirma sabah bosaltmasini rahatlatir.' },
      { kind: 'carry_over', text: 'Kalinan iri atik ertesi gun kutu baskisini buyutur.' },
      { kind: 'district_trust', text: 'Apartman aksindaki net hizmet Cumhuriyet guvenini korur.' },
    ),
    echoes: echoes(
      'Cumhuriyet icin mesele kutudan once erisim.',
      'Gece iri atik kaydi sabah konteyner planina baglandi.',
      'Apartman gorevlileri erisimin acilmasini bekliyor.',
      'Kaynak baskisi katmaninda iri atik noktasini isaretle.',
      'Yarin ayni apartman aksinda erken gozlem yap.',
      'Cumhuriyet iri atik etkisi kontrollu azaltildi.',
    ),
  },
  {
    id: 'cumhuriyet_apartman_konteyner',
    title: 'Cumhuriyet Apartman Konteyner',
    districtIds: ['cumhuriyet'],
    domains: ['social', 'personnel'],
    affectedActor: 'site sakinleri',
    concreteScene: 'Apartman arasi konteynerde kapak acik kalmis ve koku notu var.',
    visibleOperationalProblem: 'Saha ekibi temizlik ile rota suresi arasinda sikisiyor.',
    decisionTradeoff: 'Temizlik eklemek rota bitisini geciktirir.',
    shortTermEffect: 'Koku sikayeti ayni gun yumusar.',
    carryOverConsequence: 'Temizlik kalirsa sosyal yankida guven puani dusar.',
    districtOperationKind: 'apartment_container_cumhuriyet',
    recommendedVariantKinds: ['normal', 'worsened', 'resource_fatigue', 'comeback'],
    mapLayerIds: ['social_pulse', 'resource_fatigue', 'district_trust'],
    trustIntent: 'Apartman aksinda kucuk sikayetin guven etkisini gostermek.',
    memoryIntent: 'Koku notunu tekrar eden konteyner hafizasina eklemek.',
    resourceIntent: 'Temizlik suresi ile rota bitisini tartmak.',
    variantCopies: variants(
      'Apartman konteynerinde koku notu var; temizlik eklemek rota saatini zorlar.',
      { kind: 'worsened', text: 'Temizlik gecikirse site yorumlari daha olumsuz olur.' },
      { kind: 'resource_fatigue', text: 'Ayni ekibe ek temizlik vermek vardiya temposunu yorar.' },
      { kind: 'comeback', text: 'Gecikme sonrasi kisa temizlik turu sosyal tonu toparlar.' },
    ),
    echoes: echoes(
      'Koku notu kucuk gorunur ama apartman aksinda hizla yayilir.',
      'Cumhuriyet apartman konteyneri temizlik penceresine alindi.',
      'Site sakinleri kapak ve koku sorununu birlikte yorumluyor.',
      'Sosyal nabiz katmaninda apartman aksini izle.',
      'Yarin ayni konteyner kapak kontroluyle baslasin.',
      'Apartman konteyneri Cumhuriyet raporunda izli kapanis verdi.',
    ),
  },
  {
    id: 'cumhuriyet_esnaf_sikayet_hatti',
    title: 'Cumhuriyet Esnaf Sikayet Hatti',
    districtIds: ['cumhuriyet'],
    domains: ['vehicle_route', 'authority_milestone'],
    affectedActor: 'cadde esnafi',
    concreteScene: 'Kisa cadde uzerinde esnaf gec bosaltma notu paylasiyor.',
    visibleOperationalProblem: 'Rota gecisi gorunmezse guven yorumu zayiflar.',
    decisionTradeoff: 'Caddeyi one almak yesil alan temizligini geriye iter.',
    shortTermEffect: 'Esnaf hatti daha sakin izlenir.',
    carryOverConsequence: 'Yanitsiz notlar ertesi gun sosyal nabzi sertlestirir.',
    districtOperationKind: 'merchant_response_cumhuriyet',
    recommendedVariantKinds: ['normal', 'reward', 'district_trust', 'player_adaptive'],
    mapLayerIds: ['active_task_route', 'social_pulse', 'district_trust'],
    trustIntent: 'Esnaf geri bildiriminin hizmet guvenine etkisini baglamak.',
    memoryIntent: 'Sikayet hattini sonraki cadde planina tasimak.',
    resourceIntent: 'Rota onceligi ile alternatif temizlik saatini dengelemek.',
    variantCopies: variants(
      'Esnaf hatti gec bosaltma diyor; rota onceligi hassas tartilmali.',
      { kind: 'reward', text: 'Zamaninda yanit esnaf yorumunda olumlu iz birakir.' },
      { kind: 'district_trust', text: 'Net donus Cumhuriyet guvenini gorunur sekilde destekler.' },
      { kind: 'player_adaptive', text: 'Onceki cadde tercihin varsa esnaf hatti buna gore yumusar.' },
    ),
    echoes: echoes(
      'Cumhuriyet esnafi icin yanit zamani hizmet kadar degerli.',
      'Esnaf sikayet hatti rota onceligiyle eslendi.',
      'Cadde esnafi gorunur donusu olumlu karsiliyor.',
      'Aktif rota katmaninda esnaf hattini kisa oncelik olarak goster.',
      'Yarin ayni caddeye erken sosyal kontrol ekle.',
      'Esnaf hatti Cumhuriyet icin guven destekli kapandi.',
    ),
  },
  {
    id: 'cumhuriyet_guven_onarim_noktasi',
    title: 'Cumhuriyet Guven Onarim Noktasi',
    districtIds: ['cumhuriyet'],
    domains: ['district_balance', 'operation_era', 'generic_operation'],
    affectedActor: 'mahalle temsilcisi',
    concreteScene: 'Temsilci, iki gunluk gecikme notunu sakin bir dille iletiyor.',
    visibleOperationalProblem: 'Gecikme cozulmeden yeni is verilirse guven dusuk kalir.',
    decisionTradeoff: 'Onarim turu kaynak ister, yeni talep bekler.',
    shortTermEffect: 'Temsilci ile temas netlesir.',
    carryOverConsequence: 'Guven notu dusuk kalirsa yarinki kararlar daha pahali hissedilir.',
    districtOperationKind: 'trust_repair_cumhuriyet',
    recommendedVariantKinds: ['normal', 'carry_over', 'resource_fatigue', 'operation_era'],
    mapLayerIds: ['district_trust', 'district_memory', 'operation_era'],
    trustIntent: 'Gecikme sonrasi onarim kararini district trust ile baglamak.',
    memoryIntent: 'Iki gunluk gecikme notunu mahalle hafizasina tasimak.',
    resourceIntent: 'Onarim turunun ekip zamanini olcmek.',
    variantCopies: variants(
      'Cumhuriyet guven notu dusuk; onarim turu yeni talebi bekletebilir.',
      { kind: 'carry_over', text: 'Onarim ertelenirse temsilci notu yarinki rapora tasinir.' },
      { kind: 'resource_fatigue', text: 'Ekip onarim turu alirsa aksama vardiyasi kisalir.' },
      { kind: 'operation_era', text: 'District trust donemi bu karari daha gorunur yorumlar.' },
    ),
    echoes: echoes(
      'Burada hedef hiz degil, guven notunu tekrar okunur yapmak.',
      'Cumhuriyet guven onarim noktasi rapora eklendi.',
      'Temsilci net temas gorunce tonu yumusatiyor.',
      'District trust katmaninda onarim noktasini isaretle.',
      'Yarin temsilci notu ilk rapor satirinda kontrol edilsin.',
      'Cumhuriyet guven onarimi kismi iyilesme verdi.',
    ),
  },
  {
    id: 'sanayi_vardiya_cikis_rotasi',
    title: 'Sanayi Vardiya Cikis Rotasi',
    districtIds: ['sanayi'],
    domains: ['vehicle_route', 'personnel'],
    affectedActor: 'sanayi cikis ekibi',
    concreteScene: 'Vardiya cikisinda servis araclari ile toplama rotasi cakisir.',
    visibleOperationalProblem: 'Bekleme suresi arac ve personel temposunu dusurur.',
    decisionTradeoff: 'Rotayi erkene almak Cumhuriyet baglantisini yavaslatir.',
    shortTermEffect: 'Sanayi cikis akisi daha duzenli kalir.',
    carryOverConsequence: 'Cakisma kalirsa ertesi gun arac yorgunlugu yukselir.',
    districtOperationKind: 'route_shift_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['active_task_route', 'resource_fatigue', 'district_trust'],
    trustIntent: 'Sanayi hizmet guvenini rota uyumu ile baglamak.',
    memoryIntent: 'Vardiya cikis cakismasini tekrar saatine kaydetmek.',
    resourceIntent: 'Arac beklemesi ile ekip penceresini dengelemek.',
    variantCopies: variants(
      'Sanayi cikisinda rota cakisti; erken pencere beklemeyi azaltir.',
      { kind: 'improved', text: 'Servis saatinden once gecis arac temposunu korur.' },
      { kind: 'carry_over', text: 'Cakisma kalirsa sabah planina yorgunluk notu eklenir.' },
      { kind: 'district_trust', text: 'Sanayi aksinda tahmin edilebilir rota guveni destekler.' },
    ),
    echoes: echoes(
      'Sanayi icin dogru saat, dogru rotadan daha etkili olabilir.',
      'Vardiya cikis rotasi arac beklemesiyle birlikte izlendi.',
      'Isletmeler gecisin servis saatinden once bitmesini istiyor.',
      'Aktif rota katmaninda vardiya cikis penceresini goster.',
      'Yarin Sanayi cikis rotasi servis saatinden once denenmeli.',
      'Sanayi vardiya cikis rotasi daha dengeli kapandi.',
    ),
  },
  {
    id: 'sanayi_endustriyel_atik_baski',
    title: 'Sanayi Endustriyel Atik Baski',
    districtIds: ['sanayi'],
    domains: ['crisis_adjacent', 'generic_operation'],
    affectedActor: 'atolye sorumlulari',
    concreteScene: 'Yan sokakta karisik atik kutu cevresinde birikmeye basliyor.',
    visibleOperationalProblem: 'Yanlis ayrim ekibin toplama suresini uzatir.',
    decisionTradeoff: 'Uyari turu eklemek ana rotayi geciktirir.',
    shortTermEffect: 'Ayrim hatasi ayni gun sinirlanir.',
    carryOverConsequence: 'Uyari kalirsa yarin ek temizlik saati gerekir.',
    districtOperationKind: 'industrial_sorting_sanayi',
    recommendedVariantKinds: ['normal', 'worsened', 'resource_fatigue', 'comeback', 'crisis_adjacent'],
    mapLayerIds: ['resource_pressure', 'crisis_watch', 'district_memory'],
    trustIntent: 'Sanayi aksinda sakin uyarinin guven etkisini olcmek.',
    memoryIntent: 'Karisik atik noktasini tekrar eden risk hafizasina almak.',
    resourceIntent: 'Uyari turu ile ek temizlik ihtimalini dengelemek.',
    crisisAdjacency: 'Kontrollu ayrim riski; sert korku dili yok.',
    variantCopies: variants(
      'Karisik atik birikiyor; uyarili tur ana rotayi geciktirebilir.',
      { kind: 'worsened', text: 'Uyari gecikirse toplama suresi daha fazla uzar.' },
      { kind: 'resource_fatigue', text: 'Ek temizlik ayni ekibin gun sonu temposunu zorlar.' },
      { kind: 'comeback', text: 'Gecikme sonrasi kisa uyarili tur duzeni toparlar.' },
    ),
    echoes: echoes(
      'Sanayi noktasinda sakin ayrim uyarisi bugun yeterli olabilir.',
      'Endustriyel atik baskisi kontrollu izleme satirina alindi.',
      'Atolye sorumlulari net ayrim bilgisini bekliyor.',
      'Kaynak baskisi katmaninda karisik atik noktasini isaretle.',
      'Yarin ayni sokakta erken ayrim kontrolu yap.',
      'Sanayi atik baskisi buyumeden sinirlandi.',
    ),
  },
  {
    id: 'sanayi_arac_yorgunlugu_penceresi',
    title: 'Sanayi Arac Yorgunlugu Penceresi',
    districtIds: ['sanayi'],
    domains: ['resource_recovery', 'operation_era'],
    affectedActor: 'bakim planlama ekibi',
    concreteScene: 'Iki arac pes pese agir hat aldi ve bakim penceresi daraldi.',
    visibleOperationalProblem: 'Arac yorgunlugu yeni toplama talebini riskli kilar.',
    decisionTradeoff: 'Bakim penceresi acmak bugunku kapasiteyi azaltir.',
    shortTermEffect: 'Arac arizasi ihtimali daha dusuk izlenir.',
    carryOverConsequence: 'Bakim kalirsa yarin rota secenekleri daralir.',
    districtOperationKind: 'vehicle_fatigue_sanayi',
    recommendedVariantKinds: ['normal', 'reward', 'district_trust', 'recovery'],
    mapLayerIds: ['resource_fatigue', 'operation_era', 'resource_pressure'],
    trustIntent: 'Arac sagligi kararinin hizmet guvenine etkisini gostermek.',
    memoryIntent: 'Agir hat tekrarini bakim hafizasina eklemek.',
    resourceIntent: 'Bugunku kapasite ile yarinki arac sagligini dengelemek.',
    variantCopies: variants(
      'Sanayi araclari yoruldu; bakim penceresi bugunku kapasiteyi azaltir.',
      { kind: 'reward', text: 'Bakim penceresi acilinca yarinki rota esnekligi artar.' },
      { kind: 'district_trust', text: 'Kesintisiz hizmet algisi arac sagligi ile korunur.' },
      { kind: 'recovery', text: 'Kisa bakim molasi gun sonu rotasini yeniden dengeler.' },
    ),
    echoes: echoes(
      'Araci korumak bugun yavas, yarin daha esnek hissettirir.',
      'Sanayi arac yorgunlugu bakim penceresiyle raporlandi.',
      'Saha ekibi arac molasini planli gorunce daha rahat ilerliyor.',
      'Resource fatigue katmaninda iki agir hatti birlikte goster.',
      'Yarin ilk atamada bakimdan donen araci hafif hatla baslat.',
      'Sanayi arac yorgunlugu planli toparlanma verdi.',
    ),
  },
  {
    id: 'sanayi_yan_yol_konteyner',
    title: 'Sanayi Yan Yol Konteyner',
    districtIds: ['sanayi'],
    domains: ['container', 'authority_milestone'],
    affectedActor: 'yan yol isletmeleri',
    concreteScene: 'Yan yol konteyneri ana rotadan gorunmuyor ve doluluk artiyor.',
    visibleOperationalProblem: 'Atlanan kutu sonraki toplamada ek durak olusturur.',
    decisionTradeoff: 'Yan yol sapmasi ana hat suresini uzatir.',
    shortTermEffect: 'Doluluk baskisi ayni gun azalir.',
    carryOverConsequence: 'Sapma yapilmazsa yarin yan yol daha maliyetli baslar.',
    districtOperationKind: 'side_road_container_sanayi',
    recommendedVariantKinds: ['normal', 'carry_over', 'resource_fatigue', 'worsened'],
    mapLayerIds: ['active_task_route', 'resource_pressure', 'event_family_signal'],
    trustIntent: 'Ana rota disi isletmelerin hizmet algisini korumak.',
    memoryIntent: 'Yan yol atlanma riskini rota hafizasina almak.',
    resourceIntent: 'Sapma suresi ile ek durak maliyetini karsilastirmak.',
    variantCopies: variants(
      'Yan yol kutusu doluyor; sapma bugun sure, yarin ek durak demek.',
      { kind: 'carry_over', text: 'Atlanan kutu yarinki planin ilk ek duragi olur.' },
      { kind: 'resource_fatigue', text: 'Sapma ayni aracin gun sonu temposunu azaltir.' },
      { kind: 'worsened', text: 'Sapma yapilmazsa yan yol dolulugu daha gorunur olur.' },
    ),
    echoes: echoes(
      'Sanayi yan yolu gorunmez ama maliyeti yarina kalabilir.',
      'Yan yol konteyneri ana rota sapmasi olarak rapora girdi.',
      'Isletmeler yan yolun unutulmadigini gormek istiyor.',
      'Aktif rota katmaninda yan yol sapmasini kisa isaretle.',
      'Yarin yan yol kutusu ilk kaynak baskisi kontrolunde olsun.',
      'Sanayi yan yol konteyneri takip edilebilir seviyeye indi.',
    ),
  },
  {
    id: 'istasyon_sabah_aktarma_noktasi',
    title: 'Istasyon Sabah Aktarma Noktasi',
    districtIds: ['istasyon'],
    domains: ['vehicle_route', 'social'],
    affectedActor: 'sabah yolculari',
    concreteScene: 'Aktarma noktasinda sabah akisi hizlanirken rota araci bekliyor.',
    visibleOperationalProblem: 'Gecis gecikirse yaya akisi ve hizmet algisi birlikte zorlanir.',
    decisionTradeoff: 'Aktarma noktasini one almak Merkez meydanini bekletir.',
    shortTermEffect: 'Sabah gecisi daha akici izlenir.',
    carryOverConsequence: 'Gecikme kalirsa yarin aktarma sosyal notu yukselir.',
    districtOperationKind: 'transfer_route_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['active_task_route', 'social_pulse', 'district_trust'],
    trustIntent: 'Istasyon sabah akisini hizmet guveniyle baglamak.',
    memoryIntent: 'Aktarma saatini yarinki rota hafizasina eklemek.',
    resourceIntent: 'Aktarma onceligi ile Merkez beklemesini dengelemek.',
    variantCopies: variants(
      'Aktarma noktasi yogun; rota onceligi sabah akisina etki eder.',
      { kind: 'improved', text: 'Erken gecis yolcu akisini sakin tutar.' },
      { kind: 'carry_over', text: 'Gecikme yarin aktarma noktasina sosyal not tasir.' },
      { kind: 'district_trust', text: 'Tahmin edilebilir sabah gecisi Istasyon guvenini destekler.' },
    ),
    echoes: echoes(
      'Istasyon icin sabah dakikasi tum gunun tonunu belirliyor.',
      'Aktarma noktasi sabah rota onceligiyle raporlandi.',
      'Yolcular gecisin duzenli olmasini fark ediyor.',
      'Aktif rota katmaninda aktarma noktasini erken pencereye al.',
      'Yarin aktarma noktasini ilk sosyal nabiz kontrolune ekle.',
      'Istasyon aktarma noktasi sakin bir sonuc verdi.',
    ),
  },
  {
    id: 'istasyon_aksam_yaya_akisi',
    title: 'Istasyon Aksam Yaya Akisi',
    districtIds: ['istasyon'],
    domains: ['personnel', 'operation_era'],
    affectedActor: 'aksam saha ekibi',
    concreteScene: 'Aksam yaya akisi artarken ekip ara sokak temizligini bitirmeye calisiyor.',
    visibleOperationalProblem: 'Ekip kalabalikla cakisirsa is suresi uzar.',
    decisionTradeoff: 'Temizligi erkene almak Sanayi yan yolunu geriye iter.',
    shortTermEffect: 'Yaya akisi icinde saha gorunurlugu daha sakin kalir.',
    carryOverConsequence: 'Zamanlama kacarsa yarin ara sokak notu tekrar acilir.',
    districtOperationKind: 'pedestrian_timing_istasyon',
    recommendedVariantKinds: ['normal', 'worsened', 'resource_fatigue', 'comeback'],
    mapLayerIds: ['resource_fatigue', 'district_memory', 'operation_era'],
    trustIntent: 'Kalabalik saatinde ekip uyumunun algisini gostermek.',
    memoryIntent: 'Aksam yaya saatini istasyon hafizasina eklemek.',
    resourceIntent: 'Ekip temposu ile ara sokak temizligi arasinda denge kurmak.',
    variantCopies: variants(
      'Aksam yaya akisi artiyor; ekip saatini kaydirmak rota maliyeti yaratir.',
      { kind: 'worsened', text: 'Kalabalikla cakisma is suresini uzatir.' },
      { kind: 'resource_fatigue', text: 'Ayni ekibe gec saat temizligi vermek yorgunluk biriktirir.' },
      { kind: 'comeback', text: 'Kacirilan pencere kisa ara sokak turuyla toparlanir.' },
    ),
    echoes: echoes(
      'Istasyon gec saatlerinde ekipten cok zamanlama ister.',
      'Aksam yaya akisi ekip penceresiyle raporlandi.',
      'Yayalar ekip gecisini sakin ve kisa gormek istiyor.',
      'District memory katmaninda aksam yaya saatini isaretle.',
      'Yarin ara sokak temizligi yaya akisi oncesine alinsin.',
      'Istasyon aksam akisi planli bir kapanis verdi.',
    ),
  },
  {
    id: 'istasyon_kisa_kirlilik_cebi',
    title: 'Istasyon Kisa Kirlilik Cebi',
    districtIds: ['istasyon'],
    domains: ['container', 'resource_recovery', 'crisis_adjacent'],
    affectedActor: 'peron cevresi esnafi',
    concreteScene: 'Peron arkasinda kisa bir kirlilik cebi hizla gorunur oluyor.',
    visibleOperationalProblem: 'Kucuk alan buyurse rota disi temizlik gerekir.',
    decisionTradeoff: 'Hemen temizlemek aktarma rotasini bekletir.',
    shortTermEffect: 'Peron arkasi daha temiz gorunur.',
    carryOverConsequence: 'Beklerse yarin ek temizlik kaydi acilir.',
    districtOperationKind: 'pocket_cleanup_istasyon',
    recommendedVariantKinds: ['normal', 'reward', 'district_trust', 'crisis_adjacent'],
    mapLayerIds: ['resource_pressure', 'crisis_watch', 'district_trust'],
    trustIntent: 'Kucuk alan mudahalesinin guven etkisini olcmek.',
    memoryIntent: 'Peron arkasi cebi tekrar riskine baglamak.',
    resourceIntent: 'Kisa temizlik ile aktarma gecikmesini tartmak.',
    crisisAdjacency: 'Erken kucuk risk; oyuncuya sert baski dili yok.',
    variantCopies: variants(
      'Peron arkasi kirlilik cebi buyumeden kisa karar ister.',
      { kind: 'reward', text: 'Kisa temizlik sosyal yorumda duzenli hizmet izi birakir.' },
      { kind: 'district_trust', text: 'Gorunur kucuk mudahale Istasyon guvenini destekler.' },
      { kind: 'crisis_adjacent', text: 'Alan buyumeden sakin bir temizlik penceresi yeterli olur.' },
    ),
    echoes: echoes(
      'Kucuk cep simdi cozume yakin, yarin daha pahali olabilir.',
      'Peron arkasi kirlilik cebi kontrollu izlemeye alindi.',
      'Esnaf kisa temizligi duzenli hizmet olarak okuyor.',
      'Kaynak baskisi katmaninda peron arkasi cebi goster.',
      'Yarin peron arkasi ilk kisa temizlik kontrolunde olsun.',
      'Istasyon kirlilik cebi buyumeden azaldi.',
    ),
  },
  {
    id: 'istasyon_rota_koordinasyon_penceresi',
    title: 'Istasyon Rota Koordinasyon',
    districtIds: ['istasyon'],
    domains: ['authority_milestone', 'district_balance'],
    affectedActor: 'rota koordinatoru',
    concreteScene: 'Iki arac ayni aktarma girisine yaklasirken koordinator karar bekliyor.',
    visibleOperationalProblem: 'Cakisma buyurse arac bekleme zinciri olusur.',
    decisionTradeoff: 'Bir araci kaydirmak konteyner hattini geciktirir.',
    shortTermEffect: 'Aktarma girisi daha duzenli kalir.',
    carryOverConsequence: 'Koordinasyon eksigi yarin rota onceligini agirlastirir.',
    districtOperationKind: 'route_coordination_istasyon',
    recommendedVariantKinds: ['normal', 'carry_over', 'resource_fatigue', 'operation_era'],
    mapLayerIds: ['active_task_route', 'operation_era', 'resource_fatigue'],
    trustIntent: 'Koordinasyon kararini yetki algisiyla baglamak.',
    memoryIntent: 'Aktarma girisi cakismasini planlama hafizasina almak.',
    resourceIntent: 'Arac kaydirma ile konteyner gecikmesini dengelemek.',
    variantCopies: variants(
      'Istasyon girisinde iki arac cakisti; koordinator kisa karar bekliyor.',
      { kind: 'carry_over', text: 'Cakisma notu kalirsa yarin rota onceligi sertlesir.' },
      { kind: 'resource_fatigue', text: 'Arac kaydirma gun sonu bakim penceresini daraltir.' },
      { kind: 'operation_era', text: 'Rota bakim donemi bu koordinasyonu daha net okur.' },
    ),
    echoes: echoes(
      'Burada tek karar iki aracin da gununu belirliyor.',
      'Rota koordinasyon penceresi Istasyon raporuna eklendi.',
      'Saha ekibi net siralama bekliyor.',
      'Aktif rota katmaninda iki arac yaklasimini ayir.',
      'Yarin aktarma girisi icin tek arac gecis penceresi ac.',
      'Istasyon rota koordinasyonu izlenebilir kapanis verdi.',
    ),
  },
  {
    id: 'yesilvadi_park_cevresi_bakim',
    title: 'Yesilvadi Park Cevresi Bakim',
    districtIds: ['yesilvadi'],
    domains: ['container', 'resource_recovery'],
    affectedActor: 'park kullanicilari',
    concreteScene: 'Park kenarindaki kutular hafta sonu kalabaligindan sonra dolu.',
    visibleOperationalProblem: 'Park temiz gorunmezse aile kullanimi azalir.',
    decisionTradeoff: 'Park ekibi ayirmak ara sokak toplamasini geciktirir.',
    shortTermEffect: 'Park cevresi daha duzenli izlenir.',
    carryOverConsequence: 'Kalinirsa yarin Yesilvadi sosyal yorumu zayiflar.',
    districtOperationKind: 'park_container_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['resource_pressure', 'social_pulse', 'district_trust'],
    trustIntent: 'Park cevresinde aile hizmet algisini korumak.',
    memoryIntent: 'Hafta sonu park baskisini tekrar planina almak.',
    resourceIntent: 'Park ekibi ile ara sokak toplamasini dengelemek.',
    variantCopies: variants(
      'Park kutulari dolu; gorunur bakim ara sokak toplamasini bekletir.',
      { kind: 'improved', text: 'Park ekibi erken gelirse aile kullanimi daha sakin kalir.' },
      { kind: 'carry_over', text: 'Park baskisi kalirsa yarin sosyal yorum daha zayif baslar.' },
      { kind: 'district_trust', text: 'Yesilvadi park bakimi mahalle guvenini destekler.' },
    ),
    echoes: echoes(
      'Yesilvadi parkinda temizlik, hizmetin en gorunur yuzudur.',
      'Park cevresi bakimi kutu baskisiyla raporlandi.',
      'Aileler park kenarindaki duzeni hizla fark ediyor.',
      'Kaynak baskisi katmaninda park kutularini one al.',
      'Yarin park kenari ilk doluluk kontrolune eklensin.',
      'Yesilvadi park cevresi daha temiz algiyla kapandi.',
    ),
  },
  {
    id: 'yesilvadi_sessiz_hizmet_saati',
    title: 'Yesilvadi Sessiz Hizmet Saati',
    districtIds: ['yesilvadi'],
    domains: ['personnel', 'district_balance', 'operation_era'],
    affectedActor: 'erken saat sakinleri',
    concreteScene: 'Sessiz sokakta erken hizmet saati ile ekip sesi hassaslasiyor.',
    visibleOperationalProblem: 'Temizlik gerekiyor ama saat algisi onemli.',
    decisionTradeoff: 'Daha gec saat hizmeti gunduz rotasini sikistirir.',
    shortTermEffect: 'Sokak temizligi daha kabul edilebilir olur.',
    carryOverConsequence: 'Saat hassasiyeti yok sayilirsa yarin guven notu duser.',
    districtOperationKind: 'quiet_service_yesilvadi',
    recommendedVariantKinds: ['normal', 'worsened', 'resource_fatigue', 'comeback'],
    mapLayerIds: ['district_trust', 'district_memory', 'resource_fatigue'],
    trustIntent: 'Sessiz saat tercihinin guven etkisini olcmek.',
    memoryIntent: 'Hassas saat bilgisini Yesilvadi hafizasina almak.',
    resourceIntent: 'Gec hizmet penceresi ile ekip temposunu dengelemek.',
    variantCopies: variants(
      'Sessiz sokakta temizlik saati hassas; gec pencere rota baskisi yaratir.',
      { kind: 'worsened', text: 'Erken ses artarsa sakin yorumlari daha olumsuz olur.' },
      { kind: 'resource_fatigue', text: 'Gec pencere ekibin gun ortasi temposunu daraltir.' },
      { kind: 'comeback', text: 'Saat kaydirma sonrasi kisa bilgilendirme guveni toparlar.' },
    ),
    echoes: echoes(
      'Yesilvadi bugun hizmetin sesini de hesaba katiyor.',
      'Sessiz hizmet saati guven hassasiyetiyle rapora alindi.',
      'Sakinler temizligi istiyor ama saat secimini izliyor.',
      'District memory katmaninda sessiz saat sokagini isaretle.',
      'Yarin ayni sokak gec pencereyle planlansin.',
      'Yesilvadi sessiz hizmet saati dengeli kapandi.',
    ),
  },
  {
    id: 'yesilvadi_konteyner_denge_noktasi',
    title: 'Yesilvadi Konteyner Denge',
    districtIds: ['yesilvadi'],
    domains: ['vehicle_route', 'authority_milestone'],
    affectedActor: 'site yonetimi',
    concreteScene: 'Iki site arasinda bir konteyner hizli doluyor, digeri bos kaliyor.',
    visibleOperationalProblem: 'Dengesiz doluluk gereksiz durak ve sikayet yaratir.',
    decisionTradeoff: 'Konteyner yer degisimi bugun ekip ve arac saati ister.',
    shortTermEffect: 'Doluluk dengesi daha okunur hale gelir.',
    carryOverConsequence: 'Denge kurulmazsa yarin rota iki kez ugramak zorunda kalir.',
    districtOperationKind: 'container_balance_yesilvadi',
    recommendedVariantKinds: ['normal', 'reward', 'district_trust', 'player_adaptive'],
    mapLayerIds: ['resource_pressure', 'active_task_route', 'district_trust'],
    trustIntent: 'Site yonetimiyle hizmet dengesini guven notuna baglamak.',
    memoryIntent: 'Dengesiz doluluk noktasini konteyner hafizasina eklemek.',
    resourceIntent: 'Yer degisimi maliyeti ile iki durak maliyetini tartmak.',
    variantCopies: variants(
      'Yesilvadi konteynerleri dengesiz; yer degisimi bugun kaynak ister.',
      { kind: 'reward', text: 'Denge kuruldugunda gereksiz durak sayisi azalir.' },
      { kind: 'district_trust', text: 'Site yonetimi dengeli hizmeti daha guvenilir okur.' },
      { kind: 'player_adaptive', text: 'Once doluluk verisini izlediysen karar daha netlesir.' },
    ),
    echoes: echoes(
      'Iki kutu arasindaki fark, yarinin rota maliyetini belirler.',
      'Konteyner denge noktasi site yonetimiyle raporlandi.',
      'Site sakinleri doluluk farkinin gorulmesini olumlu karsiliyor.',
      'Kaynak baskisi katmaninda iki konteyneri birlikte goster.',
      'Yarin doluluk farki ilk rapor satirinda kontrol edilsin.',
      'Yesilvadi konteyner dengesi daha okunur hale geldi.',
    ),
  },
  {
    id: 'yesilvadi_yesil_alan_hassasiyeti',
    title: 'Yesilvadi Yesil Alan Hassasiyeti',
    districtIds: ['yesilvadi'],
    domains: ['social', 'crisis_adjacent', 'generic_operation'],
    affectedActor: 'yesil alan gonulluleri',
    concreteScene: 'Yesil alan girisinde dal ve torba birikimi dikkat cekiyor.',
    visibleOperationalProblem: 'Alan bakimi gecikirse sosyal hassasiyet artar.',
    decisionTradeoff: 'Bakim turu eklemek bugunku ana rotayi kisaltir.',
    shortTermEffect: 'Yesil alan girisi daha duzenli kalir.',
    carryOverConsequence: 'Bakim kalirsa yarin gonullu notlari artar.',
    districtOperationKind: 'green_area_care_yesilvadi',
    recommendedVariantKinds: ['normal', 'carry_over', 'resource_fatigue', 'recovery', 'crisis_adjacent'],
    mapLayerIds: ['social_pulse', 'crisis_watch', 'district_memory'],
    trustIntent: 'Yesil alan hassasiyetini sakin guven notuyla baglamak.',
    memoryIntent: 'Dal ve torba birikimini tekrarlayan alan hafizasina almak.',
    resourceIntent: 'Bakim turu ile ana rota kisalmasini dengelemek.',
    crisisAdjacency: 'Hassasiyet artmadan once kontrollu bakim; sert dil yok.',
    variantCopies: variants(
      'Yesil alan girisi hassas; bakim turu ana rotayi kisaltabilir.',
      { kind: 'carry_over', text: 'Bakim ertelenirse gonullu notlari yarin artar.' },
      { kind: 'resource_fatigue', text: 'Ek bakim ayni ekibin gun sonu kapasitesini azaltir.' },
      { kind: 'recovery', text: 'Kisa bakim turu alan girisini tekrar duzenli gosterir.' },
    ),
    echoes: echoes(
      'Yesilvadi icin bu nokta sadece temizlik degil, hassasiyet.',
      'Yesil alan hassasiyeti kontrollu bakim satirina alindi.',
      'Gonulluler alan girisinin duzenli kalmasini izliyor.',
      'Sosyal nabiz katmaninda yesil alan girisini goster.',
      'Yarin dal ve torba birikimi erken kontrol edilsin.',
      'Yesilvadi yesil alan girisi daha sakin kapandi.',
    ),
  },
] as const;

function mapEchoCopyBlocks(family: DistrictPackOneFamily): CreviaContentCopyBlock[] {
  const echoSurfaceMap: Record<DistrictPackOneEchoSurface, CreviaContentProductionSurface> = {
    advisor: 'advisor_echo',
    report: 'report_echo',
    social: 'social_echo',
    map: 'map_hint',
    tomorrow_preview: 'tomorrow_preview',
    result: 'operation_result',
  };

  return Object.entries(family.echoes).map(([surface, text]) => ({
    id: `${family.id}_echo_${surface}`,
    surface: echoSurfaceMap[surface as DistrictPackOneEchoSurface],
    text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapVariantCopyBlocks(family: DistrictPackOneFamily): CreviaContentCopyBlock[] {
  return family.variantCopies.map((copy) => ({
    id: `${family.id}_variant_${copy.kind}`,
    surface: 'event_variant',
    text: copy.text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEventFamilyCopyBlocks(family: DistrictPackOneFamily): CreviaContentCopyBlock[] {
  const blocks: Array<[string, string]> = [
    ['scene', family.concreteScene],
    ['problem', family.visibleOperationalProblem],
    ['tradeoff', family.decisionTradeoff],
    ['carry_over', family.carryOverConsequence],
  ];

  return blocks.map(([key, text]) => ({
    id: `${family.id}_${key}`,
    surface: 'event_family',
    text,
    maxRecommendedLength: 140,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function toContentPackItem(family: DistrictPackOneFamily): CreviaContentPackItem {
  const variantKinds = family.variantCopies.map((copy) => copy.kind);
  const conceptTags = [
    family.id === 'merkez_meydan_kutu_hatti' ? 'district_operation' : `${family.districtOperationKind}_link`,
    family.id === 'merkez_meydan_kutu_hatti'
      ? 'carry_over'
      : variantKinds.includes('carry_over')
        ? `carry_over_${family.id}`
        : `daily_memory_${family.id}`,
    family.id === 'merkez_ana_durak_gorunurluk'
      ? 'reward_recovery'
      : variantKinds.some((kind) => ['reward', 'comeback', 'recovery'].includes(kind))
        ? `reward_recovery_${family.id}`
        : `resource_balance_${family.id}`,
  ];

  return {
    id: `cp_district_pack_one_${family.id}`,
    packId: DISTRICT_PACK_ONE_ID,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    operationEraIds: [...DISTRICT_PACK_ONE_OPERATION_ERA_IDS],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces: [...DISTRICT_PACK_ONE_REQUIRED_ECHO_SURFACES],
    mapLayerIds: [...family.mapLayerIds],
    rankPermissionIds: ['district_trust_preview', 'map_resource_layer'],
    tags: [
      ...family.districtIds,
      ...family.domains,
      ...variantKinds,
      family.districtOperationKind,
      ...conceptTags,
    ],
    copyBlocks: [
      ...mapEventFamilyCopyBlocks(family),
      ...mapVariantCopyBlocks(family),
      ...mapEchoCopyBlocks(family),
    ],
    metadata: {
      affectedActor: family.affectedActor,
      concreteScene: family.concreteScene,
      visibleOperationalProblem: family.visibleOperationalProblem,
      decisionTradeoff: family.decisionTradeoff,
      shortTermEffect: family.shortTermEffect,
      carryOverConsequence: family.carryOverConsequence,
      districtOperationKind: family.districtOperationKind,
      trustIntent: family.trustIntent,
      memoryIntent: family.memoryIntent,
      resourceIntent: family.resourceIntent,
      crisisAdjacency: family.crisisAdjacency ?? '',
      variantCopyCount: family.variantCopies.length,
      echoSurfaceCount: Object.keys(family.echoes).length,
      source: 'district_pack_one_authoring',
    },
  };
}

export const DISTRICT_PACK_ONE_ITEMS: readonly CreviaContentPackItem[] =
  DISTRICT_PACK_ONE_FAMILIES.map(toContentPackItem);

export const DISTRICT_PACK_ONE_CONTENT_PACK: CreviaContentPackDefinition = {
  id: DISTRICT_PACK_ONE_ID,
  title: 'District Pack One',
  description:
    'First real district-focused authoring pack for event family copy, variants, echo surfaces, trust, memory, and operations.',
  kind: 'district_pack',
  status: 'qa',
  version: '1.0.0',
  owner: 'content_authoring',
  targetDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
  targetDomains: [
    'container',
    'vehicle_route',
    'personnel',
    'social',
    'district_balance',
    'resource_recovery',
    'crisis_adjacent',
    'operation_era',
    'authority_milestone',
    'generic_operation',
  ],
  targetOperationEraIds: [...DISTRICT_PACK_ONE_OPERATION_ERA_IDS],
  targetSurfaces: [
    'event_family',
    'event_variant',
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
    'operation_result',
  ],
  relatedRankPermissionIds: ['district_trust_preview', 'map_resource_layer'],
  relatedMapLayerIds: [
    'resource_pressure',
    'resource_fatigue',
    'social_pulse',
    'crisis_watch',
    'district_trust',
    'district_memory',
    'active_task_route',
    'event_family_signal',
    'operation_era',
  ],
  releaseNotes:
    'Authoring-only district pack. Not linked to runtime activation, event generation, persistence, analytics, IAP, or UI.',
  createdForPhase: 'content_pack_authoring_phase_2_district_pack_1',
  isRuntimeLinked: false,
  isFutureOnly: false,
  items: [...DISTRICT_PACK_ONE_ITEMS],
};

export function getDistrictPackOneFamiliesByDistrict(): Record<
  DistrictPackOneDistrictId,
  DistrictPackOneFamily[]
> {
  return DISTRICT_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const districtId of family.districtIds) {
        acc[districtId].push(family);
      }
      return acc;
    },
    {
      merkez: [],
      cumhuriyet: [],
      sanayi: [],
      istasyon: [],
      yesilvadi: [],
    } as Record<DistrictPackOneDistrictId, DistrictPackOneFamily[]>,
  );
}

export function getDistrictPackOneVariantCoverage(): Record<DistrictPackOneVariantKind, number> {
  return DISTRICT_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const copy of family.variantCopies) {
        acc[copy.kind] += 1;
      }
      return acc;
    },
    {
      normal: 0,
      improved: 0,
      worsened: 0,
      carry_over: 0,
      reward: 0,
      comeback: 0,
      resource_fatigue: 0,
      district_trust: 0,
      crisis_adjacent: 0,
      operation_era: 0,
      player_adaptive: 0,
      recovery: 0,
    } as Record<DistrictPackOneVariantKind, number>,
  );
}

export function getDistrictPackOneEchoSurfaceCoverage(): Record<DistrictPackOneEchoSurface, number> {
  return DISTRICT_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const surface of Object.keys(family.echoes) as DistrictPackOneEchoSurface[]) {
        acc[surface] += 1;
      }
      return acc;
    },
    {
      advisor: 0,
      report: 0,
      social: 0,
      map: 0,
      tomorrow_preview: 0,
      result: 0,
    } as Record<DistrictPackOneEchoSurface, number>,
  );
}
