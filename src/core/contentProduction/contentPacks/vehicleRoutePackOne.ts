import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

import type {
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
} from '../contentProductionTypes';

export const VEHICLE_ROUTE_PACK_ONE_ID = 'vehicle_route_pack_one';

export type VehicleRoutePackOneDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type VehicleRoutePackOneEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'result';

export type VehicleRoutePackOneVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'resource_fatigue'
  | 'district_trust'
  | 'crisis_adjacent'
  | 'player_adaptive'
  | 'recovery'
  | 'operation_era';

export type VehicleRoutePackOneDomain =
  | 'vehicle_route'
  | 'route_efficiency'
  | 'vehicle_maintenance'
  | 'resource_fatigue'
  | 'active_route'
  | 'personnel_coordination'
  | 'district_operation'
  | 'carry_over'
  | 'reward_recovery'
  | 'crisis_adjacent'
  | 'personnel'
  | 'social'
  | 'container'
  | 'district_balance'
  | 'resource_recovery'
  | 'authority_milestone'
  | 'operation_era'
  | 'generic_operation';

export type VehicleRoutePackOneVariantCopy = {
  kind: VehicleRoutePackOneVariantKind;
  text: string;
};

export type VehicleRoutePackOneRouteHints = {
  dispatchHint: string;
  fieldHint: string;
  activeRouteHint: string;
  maintenanceHint: string;
};

export type VehicleRoutePackOneFamily = {
  id: string;
  title: string;
  districtIds: VehicleRoutePackOneDistrictId[];
  domains: VehicleRoutePackOneDomain[];
  affectedActor: string;
  concreteScene: string;
  visibleOperationalProblem: string;
  decisionTradeoff: string;
  shortTermEffect: string;
  carryOverConsequence: string;
  activeRouteIntent: string;
  vehicleMaintenanceIntent: string;
  resourceFatigueIntent: string;
  districtOperationKind: string;
  recommendedVariantKinds: VehicleRoutePackOneVariantKind[];
  mapLayerIds: CreviaMapLayerId[];
  trustIntent: string;
  memoryIntent: string;
  crisisAdjacency?: string;
  variantCopies: VehicleRoutePackOneVariantCopy[];
  echoes: Record<VehicleRoutePackOneEchoSurface, string>;
  routeHints: VehicleRoutePackOneRouteHints;
};

export const VEHICLE_ROUTE_PACK_ONE_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] = [
  'advisor_echo',
  'report_echo',
  'social_echo',
  'map_hint',
  'tomorrow_preview',
  'operation_result',
] as const;

const VEHICLE_ROUTE_PACK_ONE_OPERATION_ERA_IDS = [
  'core_city_operations',
  'route_maintenance_era',
  'district_trust_era',
  'crisis_recovery_era',
] as const;

const VEHICLE_ROUTE_PACK_ONE_ERA_BY_DISTRICT: Record<VehicleRoutePackOneDistrictId, (typeof VEHICLE_ROUTE_PACK_ONE_OPERATION_ERA_IDS)[number]> = {
  sanayi: 'route_maintenance_era',
  istasyon: 'core_city_operations',
  merkez: 'core_city_operations',
  cumhuriyet: 'crisis_recovery_era',
  yesilvadi: 'district_trust_era',
};

function echoes(
  advisor: string,
  report: string,
  social: string,
  map: string,
  tomorrowPreview: string,
  result: string,
): Record<VehicleRoutePackOneEchoSurface, string> {
  return {
    advisor,
    report,
    social,
    map,
    tomorrow_preview: tomorrowPreview,
    result,
  };
}

function routeHints(
  dispatchHint: string,
  fieldHint: string,
  activeRouteHint: string,
  maintenanceHint: string,
): VehicleRoutePackOneRouteHints {
  return { dispatchHint, fieldHint, activeRouteHint, maintenanceHint };
}

function variants(
  normal: string,
  second: VehicleRoutePackOneVariantCopy,
  third: VehicleRoutePackOneVariantCopy,
  fourth: VehicleRoutePackOneVariantCopy,
  fifth?: VehicleRoutePackOneVariantCopy,
): VehicleRoutePackOneVariantCopy[] {
  const base = [{ kind: 'normal' as const, text: normal }, second, third, fourth];
  return fifth ? [...base, fifth] : base;
}

export const VEHICLE_ROUTE_PACK_ONE_FAMILIES: readonly VehicleRoutePackOneFamily[] = [
  {
    id: 'sanayi_fabrika_kapi_arac_sirasi',
    title: 'Sanayi Fabrika Kapi Arac Sirasi',
    districtIds: ['sanayi'],
    domains: ['route_efficiency', 'active_route', 'personnel_coordination'],
    affectedActor: 'fabrika cikis saha ekibi',
    concreteScene: 'Vardiya bitiminde uc toplama araci ayni dar servis yolunda bekliyor.',
    visibleOperationalProblem: 'Cikis suresi uzuyor ve sonraki mahalle penceresi daraliyor.',
    decisionTradeoff: 'Sirayi kisaltmak bir araci geri cekmek demek; bekletmek yorgunluk biriktirir.',
    shortTermEffect: 'Fabrika kapi onu ayni aksam daha akici bosalir.',
    carryOverConsequence: 'Gecikirse sabah ilk sefer Sanayi girisinde ek durak alir.',
    activeRouteIntent: 'Sanayi cikis hattini aktif gorev rotasinda one al.',
    vehicleMaintenanceIntent: 'Uzun bekleyen aracin lastik ve fren kontrolu yarin plana girsin.',
    resourceFatigueIntent: 'Ucuncu araca art arda cikis verilirse ekip temposu duser.',
    districtOperationKind: 'route_shift_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'worsened', 'resource_fatigue'],
    mapLayerIds: ['active_task_route', 'resource_fatigue', 'resource_pressure'],
    trustIntent: 'Sanayi aksinda rota duzeninin gorunur kalmasini olcmek.',
    memoryIntent: 'Fabrika kapi kuyrugunu sonraki vardiya planina not etmek.',
    variantCopies: variants(
      'Fabrika kapida uc arac bekliyor; cikis sirasi bugun yeniden siralanabilir.',
      { kind: 'improved', text: 'Erken kaydirma cikis yolunu acar ve sonraki durak gecikmez.' },
      { kind: 'worsened', text: 'Bekleme uzarsa ayni ekip ikinci dar yola da girer.' },
      { kind: 'resource_fatigue', text: 'Art arda cikis verilen arac bakim notu toplar.' },
      { kind: 'carry_over', text: 'Kuyruk cozulmezse sabah seferi ek iki durakla baslar.' },
    ),
    echoes: echoes(
      'Sanayi cikisinda once sirayi, sonra hizi netlestir.',
      'Fabrika kapi arac sirasi bugun rota raporuna eklendi.',
      'Isletme temsilcisi cikis yolunun acilmasini bekliyor.',
      'Aktif rota katmaninda fabrika kapi hattini vurgula.',
      'Sabah ilk kontrol Sanayi servis yolundaki bekleyen araclarda olsun.',
      'Sanayi fabrika kapi cikisi daha duzenli kapandi.',
    ),
    routeHints: routeHints(
      'Cikis sirasini tek satirda dagit; uc araci ayni pencerede birakma.',
      'Servis yolunda bekleyen araclari saha ekibine numaralandir.',
      'Aktif gorevde Sanayi cikis hattini ust sira yap.',
      'Uzun bekleyen arac icin kisa fren kontrolu notu birak.',
    ),
  },
  {
    id: 'sanayi_servis_koridor_bogazi',
    title: 'Sanayi Servis Koridor Bogazi',
    districtIds: ['sanayi'],
    domains: ['vehicle_route', 'vehicle_maintenance'],
    affectedActor: 'sanayi yan yol suruculeri',
    concreteScene: 'Tek seritli fabrika servis koridorunda iki kamyonet kafa kafaya kaldi.',
    visibleOperationalProblem: 'Geri donus alani olmadigi icin koridor 12 dakika tikanik kaliyor.',
    decisionTradeoff: 'Bir kamyoneti geri almak zaman kaydirir; beklemek yan hat duraklarini geciktirir.',
    shortTermEffect: 'Koridor ayni aksam tek yonlu gecise alinir.',
    carryOverConsequence: 'Plan degismezse yarin ayni koridor saatinde yine tikanir.',
    activeRouteIntent: 'Servis koridoru bogazini aktif rotada uyari noktasi yap.',
    vehicleMaintenanceIntent: 'Geri manevra yapan aracin kaporta hasari riski kontrol edilsin.',
    resourceFatigueIntent: 'Ayni surucuye ikinci bogaz gorevi verilirse tempo duser.',
    districtOperationKind: 'side_road_container_sanayi',
    recommendedVariantKinds: ['normal', 'carry_over', 'comeback', 'district_trust'],
    mapLayerIds: ['active_task_route', 'event_family_signal', 'resource_pressure'],
    trustIntent: 'Sanayi yan yol hizmetinin ongorulebilirligini korumak.',
    memoryIntent: 'Dar yol bogaz saatini mahalle hafizasina kaydetmek.',
    variantCopies: variants(
      'Fabrika servis koridorunda iki kamyonet kafa kafaya; tek yonlu gecis gerekli.',
      { kind: 'carry_over', text: 'Bogaz cozulmezse sabah ilk sefer ayni noktada bekler.' },
      { kind: 'comeback', text: 'Kisa rota kaydirmasi bogazi aksam sonuna tasir.' },
      { kind: 'district_trust', text: 'On gorulebilir gecis Sanayi guven notunu destekler.' },
      { kind: 'improved', text: 'Erken tek yon karari tikanikligi yarim surede acar.' },
    ),
    echoes: echoes(
      'Dar yolda once gecis kurali, sonra hiz.',
      'Sanayi bogaz rotasi bugun izleme listesinde.',
      'Yan yol isletmeleri gecikmeyi fark ediyor.',
      'Haritada sanayi tek serit bogazini isaretle.',
      'Yarin ayni saat icin tek yonlu gecis planini hazirla.',
      'Sanayi dar yol bogazi kontrollu sekilde acildi.',
    ),
    routeHints: routeHints(
      'Bogazda tek yonlu gecis kararini dagitimda net yaz.',
      'Karsilasan araclardan birini geri cekme noktasini goster.',
      'Aktif rotada dar yol uyarisini ust siraya al.',
      'Geri manevra yapan aracin kaporta kontrolunu not et.',
    ),
  },
  {
    id: 'sanayi_agir_yuk_sefer_baskisi',
    title: 'Sanayi Agir Yuk Sefer Baskisi',
    districtIds: ['sanayi'],
    domains: ['resource_fatigue', 'carry_over', 'container'],
    affectedActor: 'endustriyel atik saha ekibi',
    concreteScene: 'Uc fabrika cikisinda agir atik konteynerleri ayni aksam doluyor.',
    visibleOperationalProblem: 'Toplama araci kapasitesi yetmiyor, ikinci tur gerekli.',
    decisionTradeoff: 'Ikinci tur diger mahalleleri geciktirir; ertelemek saha sikayetini artirir.',
    shortTermEffect: 'Agir atik ayni gun sinirli sekilde bosalir.',
    carryOverConsequence: 'Ikinci tur yapilmazsa sabah Sanayi girisinde ek yuk birikir.',
    activeRouteIntent: 'Agir atik hattini aktif rotada kapasite uyarisiyla isaretle.',
    vehicleMaintenanceIntent: 'Dolu aracin hidrolik kolu aksam sonu kontrol listesine girsin.',
    resourceFatigueIntent: 'Ikinci tur ayni ekibe verilirse yorgunluk raporu artar.',
    districtOperationKind: 'industrial_sorting_sanayi',
    recommendedVariantKinds: ['normal', 'worsened', 'carry_over', 'reward'],
    mapLayerIds: ['resource_pressure', 'active_task_route', 'resource_fatigue'],
    trustIntent: 'Sanayi agir atik hizmetinin duzenli gorunmesini saglamak.',
    memoryIntent: 'Kapasite asimini sonraki planlama dongusune tasimak.',
    variantCopies: variants(
      'Uc fabrikada agir atik doldu; kapasite bugun ikinci tura ihtiyac duyuyor.',
      { kind: 'worsened', text: 'Ikinci tur ertelenirse saha sikayet kaydi artar.' },
      { kind: 'carry_over', text: 'Bosaltma yarina kalirsa giris yolu sabah tikanir.' },
      { kind: 'reward', text: 'Planli ikinci tur fabrika cikislarini ayni aksam toparlar.' },
      { kind: 'resource_fatigue', text: 'Ayni araca ucuncu agir yuk yorgunluk notu ekler.' },
    ),
    echoes: echoes(
      'Agir atikta once kapasite, sonra hiz karari ver.',
      'Sanayi endustriyel rota baskisi rapora eklendi.',
      'Fabrika guvenlik sorumlusu bosaltma saatini soruyor.',
      'Kaynak baskisi katmaninda agir atik noktalarini goster.',
      'Sabah Sanayi girisinde kalan konteynerleri kontrol et.',
      'Sanayi agir atik rotasi sinirli ama gorunur kapandi.',
    ),
    routeHints: routeHints(
      'Ikinci tur ihtiyacini dagitimda kapasite satiri olarak yaz.',
      'Dolu konteynerleri saha ekibine saat sirasina gore numarala.',
      'Aktif rotada agir atik uyarisi acik kalsin.',
      'Hidrolik kolu yuklu arac bakim listesine ekle.',
    ),
  },
  {
    id: 'sanayi_hidrolik_servis_rotasi',
    title: 'Sanayi Hidrolik Servis Rotasi',
    districtIds: ['sanayi'],
    domains: ['personnel_coordination', 'operation_era', 'route_efficiency'],
    affectedActor: 'sanayi hidrolik servis teknisyeni',
    concreteScene: 'Hidrolik lift arizasi nedeniyle bir toplama araci servis cikisina cekiliyor.',
    visibleOperationalProblem: 'Servis suresi uzarsa aksam hattinda tek arac kalir.',
    decisionTradeoff: 'Lift onarimini beklemek rotayi kisaltir; yedek arac ayirmak baska hatti bos birakir.',
    shortTermEffect: 'Hidrolik ariza ayni aksam sinirli servis penceresinde cozulur.',
    carryOverConsequence: 'Ertelenirse yarin Sanayi hatti tek aracla ve uzun servisle baslar.',
    activeRouteIntent: 'Hidrolik servis cikisini aktif rotada kapasite dususu olarak goster.',
    vehicleMaintenanceIntent: 'Lift ve hidrolik hortum kontrolu bu aksam zorunlu satir.',
    resourceFatigueIntent: 'Yedek araca art arda hat verilirse tempo duser.',
    districtOperationKind: 'industrial_sorting_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'resource_fatigue', 'crisis_adjacent'],
    mapLayerIds: ['resource_fatigue', 'active_task_route', 'operation_era'],
    trustIntent: 'Sanayi filo guvenilirligini bakim disipliniyle baglamak.',
    memoryIntent: 'Ertelenen bakimi sonraki gun planina sabitlemek.',
    crisisAdjacency: 'Bakim ertelenirse kontrollu risk notu; aceleci anlatim yok.',
    variantCopies: variants(
      'Hidrolik lift arizasi bir araci servise cekiyor; aksam hatti kisalir.',
      { kind: 'improved', text: 'Kisa servis penceresi lifti yarin sefere hazir birakir.' },
      { kind: 'resource_fatigue', text: 'Yedek araca art arda hat verilirse tempo duser.' },
      { kind: 'crisis_adjacent', text: 'Ertelenen hortum kontrolu kontrollu risk satirina duser.' },
      { kind: 'carry_over', text: 'Servis yarin kalirsa tek aracla dort durak planlanir.' },
    ),
    echoes: echoes(
      'Sanayi servisinde once lift, sonra hat karari ver.',
      'Hidrolik servis rotasi bugun filo raporunda.',
      'Teknisyen aksam sefer sayisini soruyor.',
      'Yorgunluk katmaninda servisteki araci goster.',
      'Yarin sabah hortum kontrolu tamamlanmadan sefer acilmasin.',
      'Sanayi hidrolik servis rotasi planli sekilde kapandi.',
    ),
    routeHints: routeHints(
      'Servis cekilisini dagitimda kapasite dususu olarak isaretle.',
      'Liftteki araci saha listesinde ayri satir yap.',
      'Aktif rotada hidrolik servis uyarisini tut.',
      'Hortum kontrolunu aksam servis listesine yaz.',
    ),
  },
  {
    id: 'sanayi_saha_ekip_rotasi',
    title: 'Sanayi Saha Ekip Rotasi',
    districtIds: ['sanayi'],
    domains: ['reward_recovery', 'crisis_adjacent'],
    affectedActor: 'sanayi saha koordinatoru',
    concreteScene: 'Iki ekip ayni fabrika blogunda farkli rotalarla carpisiyor.',
    visibleOperationalProblem: 'Ayni noktada cift durak olusuyor, sure uzuyor.',
    decisionTradeoff: 'Bir ekibi kaydirmak gorunurlugu azaltir; birlestirmek yorgunluk yaratir.',
    shortTermEffect: 'Fabrika blogu tek rota hattinda birlestirilir.',
    carryOverConsequence: 'Uyumsuzluk surerse yarin ayni blokta tekrar cakisma olur.',
    activeRouteIntent: 'Fabrika blogu rotasini aktif gorevde tek hat yap.',
    vehicleMaintenanceIntent: 'Ekstra durak yapan aracin kilometre notu kontrol edilsin.',
    resourceFatigueIntent: 'Birlestirilen ekibe ucuncu blok verilirse tempo duser.',
    districtOperationKind: 'route_coordination_sanayi',
    recommendedVariantKinds: ['normal', 'district_trust', 'comeback', 'worsened'],
    mapLayerIds: ['active_task_route', 'district_trust', 'event_family_signal'],
    trustIntent: 'Sanayi saha uyumunun mahalle guvenine etkisini olcmek.',
    memoryIntent: 'Ekip cakisma saatini planlama hafizasina almak.',
    variantCopies: variants(
      'Sanayi fabrika blogunda iki ekip rotasi carpisti; tek hat gerekli.',
      { kind: 'district_trust', text: 'Uyumlu rota Sanayi hizmet guvenini destekler.' },
      { kind: 'comeback', text: 'Kisa koordinasyon blogu rotasini aksam sonuna toparlar.' },
      { kind: 'worsened', text: 'Cakisma surerse her iki ekip de gec kalir.' },
      { kind: 'improved', text: 'Erken birlestirme fabrika blogunu tek turda kapatir.' },
    ),
    echoes: echoes(
      'Sanayi blogunda once ekip hatti, sonra arac sirasi.',
      'Saha ekip rotasi uyumu bugun koordinasyon notunda.',
      'Fabrika guvenlik ekibi cift duragi fark etti.',
      'Aktif rotada fabrika blogu cakismasini goster.',
      'Yarin ayni blok icin tek ekip hatti planla.',
      'Sanayi saha ekip rotasi daha uyumlu kapandi.',
    ),
    routeHints: routeHints(
      'Iki ekibi tek fabrika hattinda birlestir.',
      'Cift durak noktasini saha koordinatorune tek satir ver.',
      'Aktif gorevde fabrika blogu uyarisini ac.',
      'Ekstra kilometre yapan aracin gunluk notunu kontrol et.',
    ),
  },
  {
    id: 'istasyon_peron_aktarma_kalabaligi',
    title: 'Istasyon Peron Aktarma Kalabaligi',
    districtIds: ['istasyon'],
    domains: ['route_efficiency', 'active_route', 'personnel', 'authority_milestone'],
    affectedActor: 'peron cevresi yolculari',
    concreteScene: 'Sabah aktarma dalgasinda peron onu iki araclik alana sigmiyor.',
    visibleOperationalProblem: 'Yolcu akisi temizlik aracinin gecisini kesiyor.',
    decisionTradeoff: 'Erken gecis yolcu yogunlugunu artirir; beklemek sabah penceresini daraltir.',
    shortTermEffect: 'Peron onu kisa pencerede temizlik gecisi acilir.',
    carryOverConsequence: 'Gecikirse ogle aktarmasinda ayni nokta tekrar tikanir.',
    activeRouteIntent: 'Sabah peron hattini aktif rotada ust siraya al.',
    vehicleMaintenanceIntent: 'Sik frende kalan aracin balata kontrolu yarin plana girsin.',
    resourceFatigueIntent: 'Sabah ekibine oglen ikinci peron verilirse tempo duser.',
    districtOperationKind: 'transfer_route_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['active_task_route', 'social_pulse', 'resource_pressure'],
    trustIntent: 'Istasyon sabah akisinda hizmet gorunurlugunu olcmek.',
    memoryIntent: 'Peron kalabalik saatini istasyon hafizasina kaydetmek.',
    variantCopies: variants(
      'Peron onu sabah aktarmada dolu; temizlik gecisi kisa pencere ister.',
      { kind: 'improved', text: 'Erken gecis peron akisini bozmadan hatti acar.' },
      { kind: 'carry_over', text: 'Bekleme ogle aktarmasinda ayni noktayi geri getirir.' },
      { kind: 'district_trust', text: 'Duzenli sabah gecisi Istasyon guvenini destekler.' },
      { kind: 'resource_fatigue', text: 'Ust uste peron gorevi sabah ekibini yorar.' },
    ),
    echoes: echoes(
      'Istasyon sabahinda once gecis penceresi, sonra hiz.',
      'Peron aktarma kalabaligi bugun rota raporunda.',
      'Yolcular peron onunun acilmasini bekliyor.',
      'Haritada sabah peron hattini one cikar.',
      'Ogle aktarmasindan once peron onunu tekrar kontrol et.',
      'Istasyon peron aktarmasi daha akici kapandi.',
    ),
    routeHints: routeHints(
      'Sabah peron gecisini dagitimda ilk pencere yap.',
      'Yolcu akisini kesmeden arac gecis noktasini saha ekibine goster.',
      'Aktif rotada peron hattini sabah ust siraya al.',
      'Sik frende kalan aracin balata notunu yarin listele.',
    ),
  },
  {
    id: 'istasyon_aksam_cikis_dalgasi',
    title: 'Istasyon Aksam Cikis Dalgasi',
    districtIds: ['istasyon'],
    domains: ['vehicle_route', 'resource_fatigue', 'district_balance'],
    affectedActor: 'aksam cikis yolculari',
    concreteScene: 'Is cikisi dalgasinda istasyon cikis yolu iki arac genisliginde tikaniyor.',
    visibleOperationalProblem: 'Toplama araci durak basina ulasamiyor.',
    decisionTradeoff: 'Rotayi bolmek ek ekip ister; tek turda gitmek gecikmeyi uzatir.',
    shortTermEffect: 'Cikis yolu aksam sonuna dogru sakinlesir.',
    carryOverConsequence: 'Yarim kalan duraklar sabah ilk turda ek sure alir.',
    activeRouteIntent: 'Aksam cikis dalgasini aktif rotada yogunluk uyarisi yap.',
    vehicleMaintenanceIntent: 'Dur-kalk yapan aracin yakit tuketimi notu kontrol edilsin.',
    resourceFatigueIntent: 'Aksam ekibine gece mesaisi eklenirse yorgunluk artar.',
    districtOperationKind: 'pedestrian_timing_istasyon',
    recommendedVariantKinds: ['normal', 'worsened', 'comeback', 'reward'],
    mapLayerIds: ['active_task_route', 'resource_fatigue', 'district_trust'],
    trustIntent: 'Istasyon aksam hizmetinin ongorulebilirligini korumak.',
    memoryIntent: 'Cikis dalgasi saatini sonraki aksam planina tasimak.',
    variantCopies: variants(
      'Istasyon cikis yolu aksam dalgasinda dolu; durak plani yeniden siralanmali.',
      { kind: 'worsened', text: 'Tek turda gitmek son duraklari yarin birakir.' },
      { kind: 'comeback', text: 'Bolunmus rota aksam sonunda kalan duraklari toparlar.' },
      { kind: 'reward', text: 'Planli bolunme cikis yolunu ayni aksam sakinlestirir.' },
      { kind: 'carry_over', text: 'Yarim kalan durak sabah ilk sirada bekler.' },
    ),
    echoes: echoes(
      'Aksam dalgasinda once durak sirasi, sonra ekip.',
      'Istasyon cikis dalgasi bugun sefer raporunda.',
      'Yolcular durak gecikmesini konusuyor.',
      'Aktif rotada aksam cikis yogunlugunu goster.',
      'Sabah ilk turda kalan istasyon duraklarini one al.',
      'Istasyon aksam cikis dalgasi kontrollu kapandi.',
    ),
    routeHints: routeHints(
      'Aksam durak sirasini dagitimda bolunmus planla yaz.',
      'Tikanan cikis yolunda arac gecis noktasini saha ekibine netlestir.',
      'Aktif rotada aksam dalga uyarisi acik kalsin.',
      'Dur-kalk yapan aracin yakit notunu kontrol listesine ekle.',
    ),
  },
  {
    id: 'istasyon_alt_gecit_ambalaj',
    title: 'Istasyon Alt Gecit Ambalaj',
    districtIds: ['istasyon'],
    domains: ['social', 'vehicle_maintenance', 'carry_over'],
    affectedActor: 'alt gecit guvenlik gorevlisi',
    concreteScene: 'Alt gecit merdiveninde ambalaj yigini yaya akisini daraltiyor.',
    visibleOperationalProblem: 'Toplama araci merdiven onunde uzun bekleyemiyor.',
    decisionTradeoff: 'Merdiven mudahalesi aktarma saatini keser; ertelemek yigini buyutur.',
    shortTermEffect: 'Alt gecit ayni aksam kisa mudahaleyle acilir.',
    carryOverConsequence: 'Ertelenirse aksam sonu aktarmada yigin geri gelir.',
    activeRouteIntent: 'Alt gecit hattini aktif rotada kisa mudahale olarak isaretle.',
    vehicleMaintenanceIntent: 'Dar gecitte manevra yapan aracin ayna kontrolu yapilsin.',
    resourceFatigueIntent: 'Ayni ekibe art arda gecit gorevi verilirse tempo duser.',
    districtOperationKind: 'pocket_cleanup_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'crisis_adjacent'],
    mapLayerIds: ['social_pulse', 'active_task_route', 'district_trust'],
    trustIntent: 'Istasyon yaya akisinda gorunur temizligi olcmek.',
    memoryIntent: 'Gecit birikim saatini istasyon hafizasina almak.',
    crisisAdjacency: 'Birikim artarsa kontrollu mudahale; aceleci anlatim yok.',
    variantCopies: variants(
      'Alt gecit merdiveninde ambalaj yigini; mudahale penceresi dar.',
      { kind: 'improved', text: 'Hizli merdiven mudahalesi aktarma akisini rahatlatir.' },
      { kind: 'carry_over', text: 'Ertelenen yigin aksam sonu dalgada geri gelir.' },
      { kind: 'crisis_adjacent', text: 'Buyuyen yigin kontrollu mudahale satirina duser.' },
      { kind: 'district_trust', text: 'Gorunur merdiven temizligi Istasyon notunu destekler.' },
    ),
    echoes: echoes(
      'Alt gecitte kisa mudahale, uzun beklemekten daha etkili.',
      'Alt gecit ambalaj satiri bugun istasyon raporunda.',
      'Guvenlik gorevlisi merdivenin acilmasini bekliyor.',
      'Sosyal nabiz katmaninda alt gecidi goster.',
      'Aksam aktarmasindan once merdiveni tekrar kontrol et.',
      'Istasyon alt gecit ambalaji daha temiz kapandi.',
    ),
    routeHints: routeHints(
      'Merdiven mudahalesini dagitimda kisa pencere olarak yaz.',
      'Yigini merdiven onunde saha ekibine tek nokta olarak goster.',
      'Aktif rotada alt gecit uyarisini ac.',
      'Dar merdiven manevrasi yapan aracin ayna kontrolunu not et.',
    ),
  },
  {
    id: 'istasyon_dakika_rota_plani',
    title: 'Istasyon Dakika Rota Plani',
    districtIds: ['istasyon'],
    domains: ['route_efficiency', 'active_route', 'personnel_coordination'],
    affectedActor: 'istasyon rota planlayicisi',
    concreteScene: 'Aktarma saatleri arasinda duraklar arasi sure 4 dakika asiyor.',
    visibleOperationalProblem: 'Planlanan 18 dakikalik tur 26 dakikaya uzuyor.',
    decisionTradeoff: 'Bir duragi atlamak hiz kazandirir; tum duraklari tutmak gecikmeyi buyutur.',
    shortTermEffect: 'Tur ayni aksam yeniden zamanlanir.',
    carryOverConsequence: 'Plan degismezse sabah turu yine gec baslar.',
    activeRouteIntent: 'Istasyon turunu aktif rotada dakika bazli guncelle.',
    vehicleMaintenanceIntent: 'Geciken aracin motor sicaklik notu kontrol edilsin.',
    resourceFatigueIntent: 'Uzayan tura ek durak verilirse ekip yorgunlugu artar.',
    districtOperationKind: 'route_coordination_istasyon',
    recommendedVariantKinds: ['normal', 'worsened', 'improved', 'resource_fatigue', 'operation_era'],
    mapLayerIds: ['active_task_route', 'operation_era', 'event_family_signal'],
    trustIntent: 'Istasyon rota zamanlamasinin guvenilirligini olcmek.',
    memoryIntent: 'Asan tur suresini planlama dongusune kaydetmek.',
    variantCopies: variants(
      'Istasyon turu 8 dakika gecikti; durak sirasi yeniden zamanlanmali.',
      { kind: 'worsened', text: 'Tum duraklar tutulursa aksam sonu turu yarina kalir.' },
      { kind: 'improved', text: 'Yeniden zamanlama turu ayni aksam kapatir.' },
      { kind: 'resource_fatigue', text: 'Uzayan tura ek durak ekip temposunu dusurur.' },
      { kind: 'operation_era', text: 'Rota bakim donemi tur gecikmesini daha net okur.' },
    ),
    echoes: echoes(
      'Istasyonda once dakika plani, sonra arac.',
      'Dakika rota plani bugun sefer raporuna eklendi.',
      'Durak esnafi gecikmeyi fark ediyor.',
      'Aktif rotada tur gecikmesini goster.',
      'Sabah turunu onceki gecikmeye gore ac.',
      'Istasyon dakika rota plani daha tutarli kapandi.',
    ),
    routeHints: routeHints(
      'Tur gecikmesini dagitimda dakika satiriyla guncelle.',
      'Asan duraklari saha ekibine yeni sirayla ver.',
      'Aktif rotada tur gecikme uyarisini tut.',
      'Uzun calisan aracin motor notunu kontrol et.',
    ),
  },
  {
    id: 'istasyon_cift_arac_koordinasyon',
    title: 'Istasyon Cift Arac Koordinasyon',
    districtIds: ['istasyon'],
    domains: ['reward_recovery', 'crisis_adjacent'],
    affectedActor: 'istasyon giris koordinatoru',
    concreteScene: 'Platform alti rampada iki sefer ayni manevra noktasina sikisti.',
    visibleOperationalProblem: 'Geri cekme alani olmadigi icin her iki surucu de bekliyor.',
    decisionTradeoff: 'Rampayi tek araca kapatmak aktarmayi geciktirir; acik birakmak carpisma riskini artirir.',
    shortTermEffect: 'Platform alti rampa ayni aksam tek gecis planina alinir.',
    carryOverConsequence: 'Karar ertelenirse sabah ilk aktarmada rampa yine tikanir.',
    activeRouteIntent: 'Platform alti rampayi aktif rotada manevra uyarisi yap.',
    vehicleMaintenanceIntent: 'Geri manevra yapan aracin geri vites sensoru kontrol edilsin.',
    resourceFatigueIntent: 'Ayni surucuye art arda rampa gorevi verilirse tempo duser.',
    districtOperationKind: 'route_coordination_istasyon',
    recommendedVariantKinds: ['normal', 'comeback', 'district_trust', 'reward'],
    mapLayerIds: ['active_task_route', 'district_trust', 'resource_fatigue'],
    trustIntent: 'Istasyon giris koordinasyonunun hizmet guvenine etkisi.',
    memoryIntent: 'Rampadaki cakisma saatini istasyon hafizasina almak.',
    variantCopies: variants(
      'Platform alti rampada iki sefer sikisti; tek gecis plani gerekli.',
      { kind: 'comeback', text: 'Koordinasyon rampayi aksam sonuna kadar acik tutar.' },
      { kind: 'district_trust', text: 'Duzenli rampa gecisi Istasyon guvenini destekler.' },
      { kind: 'reward', text: 'Planli tek gecis sabah aktarmasini rahatlatir.' },
      { kind: 'worsened', text: 'Koordinasyon yoksa her iki arac da gec kalir.' },
    ),
    echoes: echoes(
      'Rampada once tek gecis kurali, sonra hiz.',
      'Cift arac koordinasyonu bugun istasyon notunda.',
      'Giris guvenlik ekibi gecikmeyi izliyor.',
      'Aktif rotada giris rampasi uyarisini goster.',
      'Sabah aktarmasinda rampa planini tek gecise sabitle.',
      'Istasyon cift arac koordinasyonu daha duzenli kapandi.',
    ),
    routeHints: routeHints(
      'Rampada tek gecis kararini dagitimda net yaz.',
      'Bekleyen ikinci araci saha koordinatorune sirala.',
      'Aktif rotada giris rampasi uyarisi acik kalsin.',
      'Geri manevra yapan aracin sensor kontrolunu not et.',
    ),
  },
  {
    id: 'merkez_gorunur_rota_hatti',
    title: 'Merkez Gorunur Rota Hatti',
    districtIds: ['merkez'],
    domains: ['route_efficiency', 'district_operation', 'generic_operation'],
    affectedActor: 'merkez cadde esnafi',
    concreteScene: 'Ana cadde uzerinde toplama araci gorunur sekilde ilerliyor ama duraklar atlaniyor.',
    visibleOperationalProblem: 'Hiz var, gorunur hizmet algisi zayif.',
    decisionTradeoff: 'Duraklari tutmak rotayi uzatir; atlamak guven algisini dusurur.',
    shortTermEffect: 'Ana cadde hatti ayni aksam gorunur duraklarla tamamlanir.',
    carryOverConsequence: 'Atlama surerse yarin esnaf sikayet kaydi artar.',
    activeRouteIntent: 'Ana cadde hattini aktif rotada gorunur duraklarla isaretle.',
    vehicleMaintenanceIntent: 'Sik dur-kalk yapan aracin fren balatasi notu kontrol edilsin.',
    resourceFatigueIntent: 'Ek durak ayni ekibe verilirse aksam temposu duser.',
    districtOperationKind: 'visible_service_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'carry_over'],
    mapLayerIds: ['active_task_route', 'district_trust', 'event_family_signal'],
    trustIntent: 'Merkezde gorunur hizmet rotasini guven ile baglamak.',
    memoryIntent: 'Atlanan duraklari sonraki cadde planina tasimak.',
    variantCopies: variants(
      'Merkez ana cadde hatti hizli ama duraklar gorunur degil; plan yenilenmeli.',
      { kind: 'improved', text: 'Gorunur durak turu esnaf notunu ayni aksam yumusatir.' },
      { kind: 'district_trust', text: 'Cadde uzerinde gorunur gecis Merkez guvenini destekler.' },
      { kind: 'carry_over', text: 'Atlanan duraklar sabah ilk turda ek sure alir.' },
      { kind: 'player_adaptive', text: 'Oyuncu temposu hizliyken kisa durak plani daha iyi oturur.' },
    ),
    echoes: echoes(
      'Merkezde gorunurluk hiz kadar onemli.',
      'Gorunur rota hatti bugun Merkez raporunda.',
      'Esnaf aracin cadde uzerinde durmasini bekliyor.',
      'Aktif rotada ana cadde duraklarini vurgula.',
      'Sabah turunda atlanan duraklari tamamla.',
      'Merkez gorunur rota hatti daha dengeli kapandi.',
    ),
    routeHints: routeHints(
      'Ana cadde duraklarini dagitimda gorunur sira yap.',
      'Esnaf noktalarinda kisa durma planini saha ekibine ver.',
      'Aktif rotada gorunur cadde hattini one al.',
      'Dur-kalk yapan aracin fren notunu kontrol et.',
    ),
  },
  {
    id: 'merkez_acil_hat_devriyesi',
    title: 'Merkez Acil Hat Devriyesi',
    districtIds: ['merkez'],
    domains: ['active_route', 'reward_recovery', 'crisis_adjacent'],
    affectedActor: 'meydan baglantisi esnafi',
    concreteScene: 'Ana meydan baglantisinda devrilen cop kutusu zinciri arac gecidini kapatiyor.',
    visibleOperationalProblem: 'Acil hat gecikirse meydan baglantisi uzun sure kapali kalir.',
    decisionTradeoff: 'Devriye timini yoneltmek ana hat duraklarini bekletir; beklemek zinciri buyutur.',
    shortTermEffect: 'Meydan baglantisi ayni aksam kisa devriye ile acilir.',
    carryOverConsequence: 'Ertelenirse yarin meydan turu yogun baslar.',
    activeRouteIntent: 'Acil hat devriyesini aktif rotada oncelikli gorev yap.',
    vehicleMaintenanceIntent: 'Devriye aracinin lastik ve ayna kontrolu yapilsin.',
    resourceFatigueIntent: 'Devriye timine ikinci acil cagri verilirse tempo duser.',
    districtOperationKind: 'shift_balance_merkez',
    recommendedVariantKinds: ['normal', 'reward', 'comeback', 'worsened'],
    mapLayerIds: ['active_task_route', 'crisis_watch', 'resource_pressure'],
    trustIntent: 'Merkez acil hat devriye algisini olcmek.',
    memoryIntent: 'Meydan baglantisi kapanisini devriye hafizasina almak.',
    variantCopies: variants(
      'Meydan baglantisinda devrilen kutular acil devriye istiyor; ana hat bekleyebilir.',
      { kind: 'reward', text: 'Planli devriye meydan gecidini ayni aksam acar.' },
      { kind: 'comeback', text: 'Kisa devriye sonrasi ana hat aksam sonuna yetisir.' },
      { kind: 'worsened', text: 'Devriye ertelenirse meydan baglantisi uzun sure kapali kalir.' },
      { kind: 'carry_over', text: 'Zincir yarin sabah ilk sirada bekler.' },
    ),
    echoes: echoes(
      'Meydan baglantisinda once devriye, sonra tam hat.',
      'Acil hat devriyesi bugun Merkez raporunda.',
      'Esnaf gecidin acilmasini bekliyor.',
      'Aktif rotada meydan baglantisi devriyesini goster.',
      'Yarin meydan turunu devriye sonrasina gore ac.',
      'Merkez acil hat devriyesi kontrollu kapandi.',
    ),
    routeHints: routeHints(
      'Devriye timini dagitimda oncelikli gorev olarak isaretle.',
      'Devrilen kutu zincirini saha timine tek satir ver.',
      'Aktif rotada meydan devriye hattini ust siraya al.',
      'Devriye aracinin lastik notunu kontrol et.',
    ),
  },
  {
    id: 'cumhuriyet_mobilya_parca_seferi',
    title: 'Cumhuriyet Mobilya Parca Seferi',
    districtIds: ['cumhuriyet'],
    domains: ['container', 'route_efficiency', 'district_operation'],
    affectedActor: 'cumhuriyet site sakinleri',
    concreteScene: 'Site cikisinda mobilya parcalari ayni toplama gunune denk geliyor.',
    visibleOperationalProblem: 'Tek arac hacmi yetmiyor, ikinci sefer gerekli.',
    decisionTradeoff: 'Ikinci sefer diger rotayi geciktirir; ertelemek sikayet biriktirir.',
    shortTermEffect: 'Mobilya parcalari ayni gun sinirli kapasiteyle alinir.',
    carryOverConsequence: 'Ertelenirse yarin site girisinde ek parca yigini bekler.',
    activeRouteIntent: 'Mobilya parca seferini aktif rotada kapasite uyarisiyla goster.',
    vehicleMaintenanceIntent: 'Agir yuklu aracin suspansiyon kontrolu yapilsin.',
    resourceFatigueIntent: 'Ikinci sefer ayni surucuye verilirse yorgunluk artar.',
    districtOperationKind: 'bulky_waste_cumhuriyet',
    recommendedVariantKinds: ['normal', 'worsened', 'reward', 'resource_fatigue'],
    mapLayerIds: ['resource_pressure', 'active_task_route', 'resource_fatigue'],
    trustIntent: 'Cumhuriyet mobilya parca hizmet guvenini olcmek.',
    memoryIntent: 'Site giris yiginini sonraki toplama planina tasimak.',
    variantCopies: variants(
      'Cumhuriyet site girisinde mobilya parcalari; kapasite ikinci sefer istiyor.',
      { kind: 'worsened', text: 'Tek sefer yetmezse parca yigini yarin buyur.' },
      { kind: 'reward', text: 'Planli ikinci sefer site girisini ayni gun toparlar.' },
      { kind: 'resource_fatigue', text: 'Agir yuklu ikinci sefer surucu yorgunlugu biriktirir.' },
      { kind: 'carry_over', text: 'Ertelenen parca yigini sabah rotasinda ilk durak olur.' },
    ),
    echoes: echoes(
      'Mobilya parcalarinda once kapasite, sonra rota.',
      'Cumhuriyet mobilya parca seferi bugun raporda.',
      'Site yonetimi toplama saatini bekliyor.',
      'Kaynak baskisi katmaninda parca yiginini goster.',
      'Sabah site girisinde kalan parcalari kontrol et.',
      'Cumhuriyet mobilya parca seferi sinirli ama gorunur kapandi.',
    ),
    routeHints: routeHints(
      'Ikinci sefer ihtiyacini dagitimda kapasite satiri yap.',
      'Parca yiginini saha ekibine agirlik sirasina gore ver.',
      'Aktif rotada mobilya parca uyarisi acik kalsin.',
      'Suspansiyon kontrolunu agir yuklu araca not et.',
    ),
  },
  {
    id: 'cumhuriyet_gece_atik_rota_duzeni',
    title: 'Cumhuriyet Gece Atik Rota Duzeni',
    districtIds: ['cumhuriyet'],
    domains: ['carry_over', 'active_route', 'district_balance', 'personnel'],
    affectedActor: 'cumhuriyet gece birakan sakinler',
    concreteScene: 'Gece birakilan ambalajlar sabah rota basinda uc durakta birikiyor.',
    visibleOperationalProblem: 'Sabah turu planlanandan 20 dakika gec basliyor.',
    decisionTradeoff: 'Gece birikimini one almak ogle rotasini daraltir; normal sirada gorunurluk duser.',
    shortTermEffect: 'Sabah turu gece birikimini onceleyerek baslar.',
    carryOverConsequence: 'Ertelenirse ogle saatinde ayni sokakta tekrar birikir.',
    activeRouteIntent: 'Gece birikim duraklarini aktif sabah rotasinda one al.',
    vehicleMaintenanceIntent: 'Erken cikan aracin isik ve ayna kontrolu yapilsin.',
    resourceFatigueIntent: 'Sabah ekibine oglen ek blok verilirse tempo duser.',
    districtOperationKind: 'night_residual_cumhuriyet',
    recommendedVariantKinds: ['normal', 'carry_over', 'improved', 'comeback'],
    mapLayerIds: ['active_task_route', 'district_memory', 'resource_pressure'],
    trustIntent: 'Cumhuriyet sabah rota duzeninin ongorulebilirligini korumak.',
    memoryIntent: 'Gece birakma noktalarini mahalle hafizasina kaydetmek.',
    variantCopies: variants(
      'Gece birakilan atik sabah rotasini uzatiyor; durak sirasi yenilenmeli.',
      { kind: 'carry_over', text: 'Ertelenen birikim ogle turunda geri gelir.' },
      { kind: 'improved', text: 'Erken oncelik sabah turunu plana yaklastirir.' },
      { kind: 'comeback', text: 'Kisa kaydirma ogle hattini dengeye getirir.' },
      { kind: 'district_trust', text: 'Duzenli sabah rota Cumhuriyet guvenini destekler.' },
    ),
    echoes: echoes(
      'Sabah rotasinda once gece birikimi, sonra normal hat.',
      'Gece atik rota duzeni bugun Cumhuriyet raporunda.',
      'Sakinler sabah temiz sokak bekliyor.',
      'Aktif rotada gece birikim duraklarini goster.',
      'Ogle turundan once kalan gece noktalarini kontrol et.',
      'Cumhuriyet gece atik rota duzeni daha tutarli kapandi.',
    ),
    routeHints: routeHints(
      'Gece birikim duraklarini sabah dagitiminda one al.',
      'Uc duraktaki yigini saha ekibine sabah sirasiyla ver.',
      'Aktif rotada gece birikim uyarisini tut.',
      'Erken cikan aracin isik kontrolunu not et.',
    ),
  },
  {
    id: 'yesilvadi_sessiz_rota_plani',
    title: 'Yesilvadi Sessiz Rota Plani',
    districtIds: ['yesilvadi'],
    domains: ['route_efficiency', 'resource_recovery', 'authority_milestone', 'generic_operation'],
    affectedActor: 'yesilvadi sakinleri',
    concreteScene: 'Sabah erken saatte toplama araci dar sokakta yuksek sesle ilerliyor.',
    visibleOperationalProblem: 'Sakin sikayet kaydi artiyor, rota suresi uzuyor.',
    decisionTradeoff: 'Sessiz hiz yavaslatir; hizli gecis sikayeti artirir.',
    shortTermEffect: 'Dar sokak ayni sabah dusuk gurultu planiyla tamamlanir.',
    carryOverConsequence: 'Plan degismezse yarin ayni saatte sikayet tekrarlar.',
    activeRouteIntent: 'Sessiz rota planini aktif gorevde dar sokak uyarisi yap.',
    vehicleMaintenanceIntent: 'Egzoz kontrolu yapilmayan arac sessiz planda kalamaz.',
    resourceFatigueIntent: 'Yavas rota ayni ekibe oglen ek tur verirse tempo duser.',
    districtOperationKind: 'low_noise_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'crisis_adjacent', 'recovery'],
    mapLayerIds: ['social_pulse', 'active_task_route', 'district_trust'],
    trustIntent: 'Yesilvadi dusuk gurultu hassasiyetini guven ile baglamak.',
    memoryIntent: 'Sikayet saatini yesil rota hafizasina almak.',
    crisisAdjacency: 'Sikayet artarsa kontrollu hiz ayari; aceleci anlatim yok.',
    variantCopies: variants(
      'Yesilvadi dar sokakta sabah gurultusu artiyor; sessiz rota plani gerekli.',
      { kind: 'improved', text: 'Dusuk gurultu gecisi sakin notunu ayni sabah yumusatir.' },
      { kind: 'district_trust', text: 'Sessiz plan Yesilvadi guven notunu destekler.' },
      { kind: 'crisis_adjacent', text: 'Artan sikayet kontrollu hiz satirina duser.' },
      { kind: 'recovery', text: 'Sessiz plan toparlaninca sakin notu ayni hafta yumusar.' },
    ),
    echoes: echoes(
      'Yesilvadi icin sessizlik hiz kadar onemli.',
      'Sessiz rota plani bugun Yesilvadi raporunda.',
      'Sakinler sabah gurultusunu konusuyor.',
      'Sosyal nabiz katmaninda dar sokak uyarisi goster.',
      'Yarin ayni saat icin sessiz gecis planini hazirla.',
      'Yesilvadi sessiz rota plani daha sakin kapandi.',
    ),
    routeHints: routeHints(
      'Dar sokakta dusuk gurultu hizini dagitimda yaz.',
      'Sakin sokaklarinda kisa durma planini saha ekibine ver.',
      'Aktif rotada sessiz sokak uyarisini ac.',
      'Egzoz kontrolu yapilmayan araci bakim listesine al.',
    ),
  },
  {
    id: 'yesilvadi_kosu_parkuru_hassas_gecis',
    title: 'Yesilvadi Kosu Parkuru Hassas Gecis',
    districtIds: ['yesilvadi'],
    domains: ['active_route', 'reward_recovery', 'vehicle_maintenance', 'resource_recovery', 'social'],
    affectedActor: 'kosu parkuru gonulluleri',
    concreteScene: 'Kosu parkuru kenarindaki dar servis yolu ayni anda sporcu ve toplama aracina dar.',
    visibleOperationalProblem: 'Arac parkura giremiyor, dis durakta torba birikimi olusuyor.',
    decisionTradeoff: 'Parkur kenari hassasiyeti artirir; dis durakta gorunurluk duser.',
    shortTermEffect: 'Parkur kenari ayni aksam hassas gecis planiyla temizlenir.',
    carryOverConsequence: 'Ertelenirse hafta sonu etkinlik oncesi torba birikimi buyur.',
    activeRouteIntent: 'Parkur kenari hattini aktif rotada dar gecis uyarisi yap.',
    vehicleMaintenanceIntent: 'Dar park girisinde manevra yapan aracin ayna kontrolu yapilsin.',
    resourceFatigueIntent: 'Hassas gecis ayni ekibe ikinci kez verilirse tempo duser.',
    districtOperationKind: 'green_zone_yesilvadi',
    recommendedVariantKinds: ['normal', 'reward', 'comeback', 'resource_fatigue'],
    mapLayerIds: ['active_task_route', 'district_trust', 'social_pulse'],
    trustIntent: 'Yesil alan hassas hizmetinin guven etkisini olcmek.',
    memoryIntent: 'Park giris darligini sonraki hafta planina tasimak.',
    variantCopies: variants(
      'Kosu parkuru kenarinda dar servis yolu var; hassas gecis dis birikimi onler.',
      { kind: 'reward', text: 'Planli hassas gecis parkur kenarini ayni aksam toparlar.' },
      { kind: 'comeback', text: 'Kisa kenar turu dis duraktaki torbayi azaltir.' },
      { kind: 'resource_fatigue', text: 'Ikinci hassas tur ekip kapasitesini daraltir.' },
      { kind: 'carry_over', text: 'Ertelenen kenar hatti hafta sonu oncesi yogunlasir.' },
    ),
    echoes: echoes(
      'Parkurda once hassasiyet, sonra hiz.',
      'Kosu parkuru hassas gecis bugun Yesilvadi raporunda.',
      'Gonulluler parkur kenarinin acik kalmasini izliyor.',
      'Aktif rotada parkur kenari uyarisini goster.',
      'Hafta sonu oncesi dis duragi kontrol et.',
      'Yesilvadi kosu parkuru hassas gecisi daha sakin kapandi.',
    ),
    routeHints: routeHints(
      'Parkur kenari gecisini dagitimda dar yol satiri yap.',
      'Dis duraktaki torbayi saha ekibine oncelik ver.',
      'Aktif rotada parkur kenari uyarisini tut.',
      'Dar servis yolundaki aracin ayna kontrolunu not et.',
    ),
  },
] as const;

function mapEchoCopyBlocks(family: VehicleRoutePackOneFamily): CreviaContentCopyBlock[] {
  const echoSurfaceMap: Record<VehicleRoutePackOneEchoSurface, CreviaContentProductionSurface> = {
    advisor: 'advisor_echo',
    report: 'report_echo',
    social: 'social_echo',
    map: 'map_hint',
    tomorrow_preview: 'tomorrow_preview',
    result: 'operation_result',
  };

  return Object.entries(family.echoes).map(([surface, text]) => ({
    id: `${family.id}_echo_${surface}`,
    surface: echoSurfaceMap[surface as VehicleRoutePackOneEchoSurface],
    text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapVariantCopyBlocks(family: VehicleRoutePackOneFamily): CreviaContentCopyBlock[] {
  return family.variantCopies.map((copy) => ({
    id: `${family.id}_variant_${copy.kind}`,
    surface: 'event_variant',
    text: copy.text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEventFamilyCopyBlocks(family: VehicleRoutePackOneFamily): CreviaContentCopyBlock[] {
  const blocks: Array<[string, string]> = [
    ['scene', family.concreteScene],
    ['problem', family.visibleOperationalProblem],
    ['tradeoff', family.decisionTradeoff],
    ['carry_over', family.carryOverConsequence],
    ['active_route', family.activeRouteIntent],
    ['maintenance', family.vehicleMaintenanceIntent],
    ['fatigue', family.resourceFatigueIntent],
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

function mapRouteHintCopyBlocks(family: VehicleRoutePackOneFamily): CreviaContentCopyBlock[] {
  const hintMap: Array<[string, string]> = [
    ['dispatch_hint', family.routeHints.dispatchHint],
    ['field_hint', family.routeHints.fieldHint],
    ['active_route_hint', family.routeHints.activeRouteHint],
    ['maintenance_hint', family.routeHints.maintenanceHint],
  ];

  return hintMap.map(([key, text]) => ({
    id: `${family.id}_${key}`,
    surface: 'map_hint',
    text,
    maxRecommendedLength: 100,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function toContentPackItem(family: VehicleRoutePackOneFamily): CreviaContentPackItem {
  const variantKinds = family.variantCopies.map((copy) => copy.kind);
  const conceptTags = [
    `district_operation_${family.districtOperationKind}`,
    variantKinds.includes('carry_over') ? `carry_over_${family.id}` : `route_memory_${family.id}`,
    variantKinds.some((kind) => ['reward', 'comeback'].includes(kind))
      ? `reward_recovery_${family.id}`
      : `route_balance_${family.id}`,
    `vr_pack_${family.id}`,
  ];

  return {
    id: `cp_vehicle_route_pack_one_${family.id}`,
    packId: VEHICLE_ROUTE_PACK_ONE_ID,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    operationEraIds: [
      VEHICLE_ROUTE_PACK_ONE_ERA_BY_DISTRICT[family.districtIds[0]!],
      ...(family.domains.includes('operation_era') ? (['container_network_era'] as const) : []),
      ...(family.districtIds[0] === 'istasyon' ? (['social_pulse_era'] as const) : []),
      ...(family.id === 'yesilvadi_kosu_parkuru_hassas_gecis' ? (['city_growth_preview_era'] as const) : []),
    ],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces: [...VEHICLE_ROUTE_PACK_ONE_REQUIRED_ECHO_SURFACES],
    mapLayerIds: [...family.mapLayerIds],
    rankPermissionIds: ['map_resource_layer', 'active_task_route_preview'],
    tags: [family.districtOperationKind, ...conceptTags],
    copyBlocks: [
      ...mapEventFamilyCopyBlocks(family),
      ...mapVariantCopyBlocks(family),
      ...mapEchoCopyBlocks(family),
      ...mapRouteHintCopyBlocks(family),
    ],
    metadata: {
      affectedActor: family.affectedActor,
      concreteScene: family.concreteScene,
      visibleOperationalProblem: family.visibleOperationalProblem,
      decisionTradeoff: family.decisionTradeoff,
      shortTermEffect: family.shortTermEffect,
      carryOverConsequence: family.carryOverConsequence,
      activeRouteIntent: family.activeRouteIntent,
      vehicleMaintenanceIntent: family.vehicleMaintenanceIntent,
      resourceFatigueIntent: family.resourceFatigueIntent,
      districtOperationKind: family.districtOperationKind,
      trustIntent: family.trustIntent,
      memoryIntent: family.memoryIntent,
      crisisAdjacency: family.crisisAdjacency ?? '',
      dispatchHint: family.routeHints.dispatchHint,
      fieldHint: family.routeHints.fieldHint,
      activeRouteHint: family.routeHints.activeRouteHint,
      maintenanceHint: family.routeHints.maintenanceHint,
      variantCopyCount: family.variantCopies.length,
      echoSurfaceCount: Object.keys(family.echoes).length,
      source: 'vehicle_route_pack_one_authoring',
    },
  };
}

export const VEHICLE_ROUTE_PACK_ONE_ITEMS: readonly CreviaContentPackItem[] =
  VEHICLE_ROUTE_PACK_ONE_FAMILIES.map(toContentPackItem);

export const VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK: CreviaContentPackDefinition = {
  id: VEHICLE_ROUTE_PACK_ONE_ID,
  title: 'Vehicle and Route Pack One',
  description:
    'Authoring-only vehicle, route, maintenance, and fatigue content for Sanayi, Istasyon, and supporting districts.',
  kind: 'event_family_pack',
  status: 'qa',
  version: '1.0.0',
  owner: 'content_authoring',
  targetDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
  targetDomains: [
    'vehicle_route',
    'route_efficiency',
    'vehicle_maintenance',
    'resource_fatigue',
    'active_route',
    'personnel_coordination',
    'district_operation',
    'carry_over',
    'reward_recovery',
    'crisis_adjacent',
    'personnel',
    'social',
    'container',
    'district_balance',
    'resource_recovery',
    'authority_milestone',
    'operation_era',
    'generic_operation',
  ],
  targetOperationEraIds: [
    ...VEHICLE_ROUTE_PACK_ONE_OPERATION_ERA_IDS,
    'container_network_era',
    'social_pulse_era',
  ],
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
  relatedRankPermissionIds: ['map_resource_layer', 'active_task_route_preview'],
  relatedMapLayerIds: [
    'active_task_route',
    'resource_fatigue',
    'resource_pressure',
    'district_trust',
    'district_memory',
    'social_pulse',
    'crisis_watch',
    'event_family_signal',
    'operation_era',
  ],
  releaseNotes:
    'Authoring-only vehicle and route pack. Not linked to runtime activation, event generation, persistence, or UI.',
  createdForPhase: 'content_pack_authoring_vehicle_route_pack_one',
  isRuntimeLinked: false,
  isFutureOnly: false,
  items: [...VEHICLE_ROUTE_PACK_ONE_ITEMS],
};

export function getVehicleRoutePackOneFamiliesByDistrict(): Record<
  VehicleRoutePackOneDistrictId,
  VehicleRoutePackOneFamily[]
> {
  return VEHICLE_ROUTE_PACK_ONE_FAMILIES.reduce(
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
    } as Record<VehicleRoutePackOneDistrictId, VehicleRoutePackOneFamily[]>,
  );
}

export function getVehicleRoutePackOneVariantCoverage(): Record<VehicleRoutePackOneVariantKind, number> {
  return VEHICLE_ROUTE_PACK_ONE_FAMILIES.reduce(
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
    } as Record<VehicleRoutePackOneVariantKind, number>,
  );
}

export function getVehicleRoutePackOneEchoSurfaceCoverage(): Record<
  VehicleRoutePackOneEchoSurface,
  number
> {
  return VEHICLE_ROUTE_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const surface of Object.keys(family.echoes) as VehicleRoutePackOneEchoSurface[]) {
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
    } as Record<VehicleRoutePackOneEchoSurface, number>,
  );
}
