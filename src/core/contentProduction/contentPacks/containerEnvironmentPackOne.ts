import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

import type {
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
} from '../contentProductionTypes';

export const CONTAINER_ENVIRONMENT_PACK_ONE_ID = 'container_environment_pack_one';

export type ContainerEnvironmentPackOneDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type ContainerEnvironmentPackOneEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'result';

export type ContainerEnvironmentPackOneVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'resource_fatigue'
  | 'district_trust'
  | 'crisis_adjacent'
  | 'recovery';

export type ContainerEnvironmentPackOneDomain =
  | 'container_network'
  | 'container_pressure'
  | 'environmental_care'
  | 'visible_service'
  | 'social_trust'
  | 'district_operation'
  | 'resource_fatigue'
  | 'carry_over'
  | 'reward_recovery'
  | 'crisis_adjacent'
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'district_balance'
  | 'resource_recovery'
  | 'authority_milestone'
  | 'operation_era'
  | 'generic_operation';

export type ContainerEnvironmentPackOneVariantCopy = {
  kind: ContainerEnvironmentPackOneVariantKind;
  text: string;
};

export type ContainerEnvironmentPackOneEnvironmentHints = {
  containerNetworkHint: string;
  environmentCareHint: string;
  fieldHint: string;
  followUpHint: string;
};

export type ContainerEnvironmentPackOneFamily = {
  id: string;
  title: string;
  districtIds: ContainerEnvironmentPackOneDistrictId[];
  domains: ContainerEnvironmentPackOneDomain[];
  affectedActor: string;
  concreteScene: string;
  visibleOperationalProblem: string;
  decisionTradeoff: string;
  shortTermEffect: string;
  carryOverConsequence: string;
  containerNetworkIntent: string;
  environmentCareIntent: string;
  containerPressureIntent: string;
  resourceFatigueIntent: string;
  visibleServiceIntent?: string;
  districtOperationKind: string;
  recommendedVariantKinds: ContainerEnvironmentPackOneVariantKind[];
  mapLayerIds: CreviaMapLayerId[];
  trustIntent: string;
  memoryIntent: string;
  crisisAdjacency?: string;
  variantCopies: ContainerEnvironmentPackOneVariantCopy[];
  echoes: Record<ContainerEnvironmentPackOneEchoSurface, string>;
  environmentHints: ContainerEnvironmentPackOneEnvironmentHints;
};

export const CONTAINER_ENVIRONMENT_PACK_ONE_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] =
  [
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
    'operation_result',
  ] as const;

const CONTAINER_ENVIRONMENT_PACK_ONE_OPERATION_ERA_IDS = [
  'core_city_operations',
  'container_network_era',
  'district_trust_era',
  'social_pulse_era',
  'route_maintenance_era',
  'crisis_recovery_era',
] as const;

const CONTAINER_ENVIRONMENT_PACK_ONE_ERA_BY_DISTRICT: Record<
  ContainerEnvironmentPackOneDistrictId,
  (typeof CONTAINER_ENVIRONMENT_PACK_ONE_OPERATION_ERA_IDS)[number]
> = {
  cumhuriyet: 'container_network_era',
  yesilvadi: 'district_trust_era',
  merkez: 'core_city_operations',
  sanayi: 'container_network_era',
  istasyon: 'social_pulse_era',
};

function echoes(
  advisor: string,
  report: string,
  social: string,
  map: string,
  tomorrowPreview: string,
  result: string,
): Record<ContainerEnvironmentPackOneEchoSurface, string> {
  return {
    advisor,
    report,
    social,
    map,
    tomorrow_preview: tomorrowPreview,
    result,
  };
}

function environmentHints(
  containerNetworkHint: string,
  environmentCareHint: string,
  fieldHint: string,
  followUpHint: string,
): ContainerEnvironmentPackOneEnvironmentHints {
  return { containerNetworkHint, environmentCareHint, fieldHint, followUpHint };
}

function variants(
  normal: string,
  second: ContainerEnvironmentPackOneVariantCopy,
  third: ContainerEnvironmentPackOneVariantCopy,
  fourth: ContainerEnvironmentPackOneVariantCopy,
): ContainerEnvironmentPackOneVariantCopy[] {
  return [{ kind: 'normal', text: normal }, second, third, fourth];
}

export const CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES: readonly ContainerEnvironmentPackOneFamily[] = [
  {
    id: 'cumhuriyet_sokak_kenari_gece_yigini',
    title: 'Cumhuriyet Sokak Kenari Gece Yigini',
    districtIds: ['cumhuriyet'],
    domains: ['container_network', 'container_pressure'],
    affectedActor: 'sokak kenari apartman sakinleri',
    concreteScene: 'Blok arkasindaki servis yolunda gece birakilan torba yigini sabah konteyner onunu kapatiyor.',
    visibleOperationalProblem: 'Toplama ekibi konteynere ulasamadan yigin buyuyor.',
    decisionTradeoff: 'Yigini once almak apartman onu rotasini geciktirir; beklemek sikayet notunu artirir.',
    shortTermEffect: 'Servis yolu ayni sabah sinirli kapasiteyle acilir.',
    carryOverConsequence: 'Ertelenirse ogle toplama turu ek sure ve ek sikayet alir.',
    containerNetworkIntent: 'Blok arka hattini konteyner aginda sabah oncelikli nokta yap.',
    environmentCareIntent: 'Servis yolu cevresinde kisa cevre dokunusu planla.',
    containerPressureIntent: 'Apartman onu basincini konteyner kapasite uyarisiyla isaretle.',
    resourceFatigueIntent: 'Ayni ekibe art arda agir yuk verilirse tempo duser.',
    districtOperationKind: 'container_recovery_cumhuriyet',
    recommendedVariantKinds: ['normal', 'worsened', 'carry_over', 'resource_fatigue'],
    mapLayerIds: ['resource_pressure', 'district_trust', 'district_memory'],
    trustIntent: 'Cumhuriyet sabah guven algisini olcmek.',
    memoryIntent: 'Gece birakma noktasini site hafizasina kaydetmek.',
    variantCopies: variants(
      'Blok arkasinda gece yigini var; sabah konteyner onu daraldi.',
      { kind: 'worsened', text: 'Bekleme uzarsa torba yigini ogle saatinde geri gelir.' },
      { kind: 'carry_over', text: 'Ertelenen yigin yarin ilk toplama sirasina eklenir.' },
      { kind: 'resource_fatigue', text: 'Agir yuk ayni ekibin ikinci turunda yorgunluk biriktirir.' },
    ),
    echoes: echoes(
      'Cumhuriyet sabahinda once yigin, sonra rutin hat.',
      'Sokak kenari gece yigini bugun Cumhuriyet raporunda.',
      'Sakinler servis yolunun acilmasini bekliyor.',
      'Kaynak baskisi katmaninda blok arka noktasini goster.',
      'Yarin sabah ayni servis yolunu erken kontrol et.',
      'Cumhuriyet sokak kenari yigini sinirli ama gorunur azaldi.',
    ),
    environmentHints: environmentHints(
      'Blok arka hattini ag haritasinda sabah ust siraya al.',
      'Servis yolu cevresinde kisa temizlik penceresi ac.',
      'Torba yiginini konteyner onunde numaralandir.',
      'Yarin sabah ayni noktayi takip listesine ekle.',
    ),
  },
  {
    id: 'cumhuriyet_blok_onu_konteyner_tasmasi',
    title: 'Cumhuriyet Blok Onu Konteyner Tasmasi',
    districtIds: ['cumhuriyet'],
    domains: ['environmental_care', 'social_trust'],
    affectedActor: 'blok onu site yonetimi',
    concreteScene: 'Apartman onundeki dortlu konteyner setinde kapaklar kapanmiyor, malzeme tasti.',
    visibleOperationalProblem: 'Yaya gecidi daraliyor ve site girisi gorunmez kaliyor.',
    decisionTradeoff: 'Hemen toparlamak diger bloklari bekletir; yarin birakmak guven notunu dusurur.',
    shortTermEffect: 'Blok onu ayni aksam sinirli duzenle acilir.',
    carryOverConsequence: 'Tasma surerse yarin site girisi ek kontrol ister.',
    containerNetworkIntent: 'Dortlu seti konteyner aginda kapasite asimi olarak isaretle.',
    environmentCareIntent: 'Blok onu cevresinde cevre duzeni ve yaya gecidini birlikte planla.',
    containerPressureIntent: 'Tasan set basincini mahalle guven katmanina yansit.',
    resourceFatigueIntent: 'Uzun toparlama ayni ekibin aksam kapasitesini daraltir.',
    districtOperationKind: 'night_residual_cumhuriyet',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'comeback'],
    mapLayerIds: ['social_pulse', 'resource_pressure', 'district_trust'],
    trustIntent: 'Site yonetimi guvenini gorunur toparlamayla olcmek.',
    memoryIntent: 'Tasma saatini blok onu hafizasina almak.',
    variantCopies: variants(
      'Blok onu dortlu set tasti; yaya gecidi daraldi.',
      { kind: 'improved', text: 'Kisa toparlama site girisini ayni aksam acik gosterir.' },
      { kind: 'district_trust', text: 'Gorunur duzen Cumhuriyet guven notunu destekler.' },
      { kind: 'comeback', text: 'Ertelenen set ertesi sabah ilk kontrolde toparlanir.' },
    ),
    echoes: echoes(
      'Blok onunda gorunurluk, hiz kadar etkili.',
      'Konteyner tasmasi bugun Cumhuriyet raporuna eklendi.',
      'Site yonetimi giris onunun acilmasini istiyor.',
      'Sosyal nabiz katmaninda blok onu setini vurgula.',
      'Yarin sabah dortlu set kapak kontrolu yapilsin.',
      'Cumhuriyet blok onu tasmasi kontrollu seviyeye indi.',
    ),
    environmentHints: environmentHints(
      'Dortlu seti ag haritasinda kapasite uyarisi yap.',
      'Yaya gecidi cevresinde cevre dokunusunu planla.',
      'Tasan malzemeyi set bazinda ayir.',
      'Ertesi sabah kapak kontrolunu takip satirina yaz.',
    ),
  },
  {
    id: 'cumhuriyet_esnaf_cevresi_sikayet_notu',
    title: 'Cumhuriyet Esnaf Cevresi Sikayet Notu',
    districtIds: ['cumhuriyet'],
    domains: ['visible_service', 'district_operation', 'social', 'district_balance'],
    affectedActor: 'carsi esnafi',
    concreteScene: 'Dukkan onundaki ikili sette ambalaj yigini vitrin camina yansiyor; esnaf defterine not dusuldu.',
    visibleOperationalProblem: 'Musteri girisi daraliyor, dukkan onu gorunmez kaliyor.',
    decisionTradeoff: 'Set cevresini hemen toparlamak carsi ic hat sirasini kisaltir; notu acik birakmak ogle yogunlugunu buyutur.',
    shortTermEffect: 'Dukkan onu ayni ogleden once gorunur duzenle acilir.',
    carryOverConsequence: 'Not kapanmazsa yarin carsi acilisinda ayni dukkan onu tekrar sikayet uretir.',
    containerNetworkIntent: 'Dukkan onu ikili seti konteyner aginda esnaf oncelikli nokta yap.',
    environmentCareIntent: 'Vitrin hizasindaki ambalaj izini cevre dokunusu ile birlikte al.',
    containerPressureIntent: 'Dukkan onu basincini mahalle dengesi satirina yaz.',
    resourceFatigueIntent: 'Carsi ic hat sonrasi ekibe ucuncu nokta verilirse tempo duser.',
    districtOperationKind: 'visible_service_cumhuriyet',
    recommendedVariantKinds: ['normal', 'reward', 'worsened', 'carry_over'],
    mapLayerIds: ['social_pulse', 'district_trust', 'event_family_signal'],
    trustIntent: 'Esnaf cevresi guven onarimini olcmek.',
    memoryIntent: 'Sikayet saatini carsi hafizasina kaydetmek.',
    variantCopies: variants(
      'Dukkan onu ikili sette ambalaj yigini esnaf defterine dustu.',
      { kind: 'reward', text: 'Planli set cevresi temizligi vitrin onunu ayni ogle acik gosterir.' },
      { kind: 'worsened', text: 'Ertelenirse defter notu carsi kapanisina kadar acik kalir.' },
      { kind: 'carry_over', text: 'Acik not yarin carsi acilis turunda ilk dukkan onunda bekler.' },
    ),
    echoes: echoes(
      'Carsida once dukkan onu seti, sonra ic hat.',
      'Esnaf cevresi defter notu bugun Cumhuriyet raporunda.',
      'Esnaf vitrin caminin acilmasini bekliyor.',
      'Sosyal nabiz katmaninda dukkan onu setini goster.',
      'Yarin carsi acilisinda ayni ikili seti erken kontrol et.',
      'Cumhuriyet esnaf cevresi defter notu kontrollu kapandi.',
    ),
    environmentHints: environmentHints(
      'Dukkan onu setini ag haritasinda esnaf oncelikli yap.',
      'Vitrin hizasi ambalaj izine cevre dokunusu planla.',
      'Ikili set numarasini esnaf defterine tek satir yaz.',
      'Yarin carsi acilis oncesi notu tekrar oku.',
    ),
  },
  {
    id: 'cumhuriyet_sakin_guven_yamasi',
    title: 'Cumhuriyet Sakin Guven Yamasi',
    districtIds: ['cumhuriyet'],
    domains: ['carry_over', 'resource_fatigue'],
    affectedActor: 'site guvenlik gorevlisi',
    concreteScene: 'Dun atlanan konteyner cevresi bugun site girisinde tekrar gorunur kirlilik birakti.',
    visibleOperationalProblem: 'Sakinler hizmetin tutarsiz oldugunu dusunuyor.',
    decisionTradeoff: 'Guven yamasi diger hatlari bekletir; kismi mudahale notu yumusatir ama iz birakir.',
    shortTermEffect: 'Site girisi ayni sabah guven yamasi ile toparlanir.',
    carryOverConsequence: 'Yama yapilmazsa hafta sonu sikayet dalgasi buyur.',
    containerNetworkIntent: 'Atlanan noktayi konteyner aginda guven yamasi olarak isaretle.',
    environmentCareIntent: 'Tekrarlayan cevre izini sakin diliyle sakinlestir.',
    containerPressureIntent: 'Site giris basincini mahalle guven katmaninda goster.',
    resourceFatigueIntent: 'Guven yamasi ayni ekibe ucuncu nokta verilirse tempo duser.',
    districtOperationKind: 'container_recovery_cumhuriyet',
    recommendedVariantKinds: ['normal', 'district_trust', 'recovery', 'crisis_adjacent'],
    mapLayerIds: ['district_trust', 'district_memory', 'social_pulse'],
    trustIntent: 'Sosyal guven onarim etkisini olcmek.',
    memoryIntent: 'Atlanan nokta izini guven hafizasina almak.',
    crisisAdjacency: 'Tutarsizlik artarsa kontrollu yama; aceleci anlatim yok.',
    variantCopies: variants(
      'Dun atlanan konteyner cevresi bugun site girisinde tekrar gorunur.',
      { kind: 'district_trust', text: 'Gorunur yama sakin guven notunu ayni gun yumusatir.' },
      { kind: 'recovery', text: 'Kisa yama hafta sonu oncesi sikayeti sinirlar.' },
      { kind: 'crisis_adjacent', text: 'Artan tutarsizlik kontrollu mudahale satirina duser.' },
    ),
    echoes: echoes(
      'Guven yamasinda once tutarlilik, sonra hiz.',
      'Sakin guven yamasi bugun Cumhuriyet raporunda.',
      'Guvenlik gorevlisi tekrarlayan izi izliyor.',
      'Mahalle guveni katmaninda site girisini goster.',
      'Hafta sonu oncesi ayni noktayi ikinci kontrol et.',
      'Cumhuriyet sakin guven yamasi olculu kapandi.',
    ),
    environmentHints: environmentHints(
      'Atlanan noktayi ag haritasinda yama olarak isaretle.',
      'Tekrarlayan cevre izine sakin tonlu not birak.',
      'Site girisindeki birikimi guvenlik ekibine sirala.',
      'Hafta sonu oncesi ikinci kontrolu planla.',
    ),
  },
  {
    id: 'cumhuriyet_site_girisi_toparlanma',
    title: 'Cumhuriyet Site Girisi Toparlanma',
    districtIds: ['cumhuriyet'],
    domains: ['reward_recovery', 'crisis_adjacent', 'operation_era'],
    affectedActor: 'site sakinleri temsilcisi',
    concreteScene: 'Site girisindeki konteyner cevresi toparlanma penceresi dar bir aksam dilimine sigmali.',
    visibleOperationalProblem: 'Toparlama yarim kalirsa giris onu yarin yine yogun baslar.',
    decisionTradeoff: 'Tam toparlama baska bloklari bekletir; kismi duzen notu birakir.',
    shortTermEffect: 'Site girisi ayni aksam toparlanma penceresinde duzenlenir.',
    carryOverConsequence: 'Pencere kacirilirsa sabah giris turu ek sure alir.',
    containerNetworkIntent: 'Site giris toparlanmasini konteyner aginda kapasite penceresi yap.',
    environmentCareIntent: 'Giris cevresinde gorunur cevre duzeni sagla.',
    containerPressureIntent: 'Giris onu basincini konteyner kapasite satirina yaz.',
    resourceFatigueIntent: 'Toparlama sonrasi ek nokta verilirse ekip yorulur.',
    districtOperationKind: 'container_recovery_cumhuriyet',
    recommendedVariantKinds: ['normal', 'reward', 'improved', 'carry_over'],
    mapLayerIds: ['resource_pressure', 'district_trust', 'crisis_watch'],
    trustIntent: 'Toparlanma penceresi guven etkisini olcmek.',
    memoryIntent: 'Dar pencere saatini site planina kaydetmek.',
    variantCopies: variants(
      'Site giris toparlanma penceresi dar; tam duzen aksamda mumkun.',
      { kind: 'reward', text: 'Planli pencere giris onunu ayni aksam toparlar.' },
      { kind: 'improved', text: 'Erken baslangic toparlamayi aksam sonuna yetistirir.' },
      { kind: 'carry_over', text: 'Yarim kalan duzen sabah giris turuna kalir.' },
    ),
    echoes: echoes(
      'Dar pencerede once giris, sonra diger bloklar.',
      'Site girisi toparlanma bugun Cumhuriyet raporunda.',
      'Temsilci aksam saatini soruyor.',
      'Kaynak baskisi katmaninda giris onunu goster.',
      'Sabah giris turunu toparlanma sonrasina gore ac.',
      'Cumhuriyet site girisi toparlanma olculu kapandi.',
    ),
    environmentHints: environmentHints(
      'Toparlanma penceresini ag haritasinda dar dilim yap.',
      'Giris cevresi cevre duzenini ayni pencerede bitir.',
      'Yarim kalan noktayi sabah listesine yaz.',
      'Aksam sonu kontrolunu takip satirina ekle.',
    ),
  },
  {
    id: 'yesilvadi_park_kenari_konteyner_dengesi',
    title: 'Yesilvadi Park Kenari Konteyner Dengesi',
    districtIds: ['yesilvadi'],
    domains: ['container_network', 'environmental_care', 'district_balance'],
    affectedActor: 'park kenari yuruyus kullanicilari',
    concreteScene: 'Park kenarindaki ikili konteyner seti hafta sonu yogunlugundan sonra dengesiz dolmus.',
    visibleOperationalProblem: 'Yuruyus yolu daraliyor ve aile kullanimi azaliyor.',
    decisionTradeoff: 'Park kenarini oncelemek ana hat duraklarini bekletir; denge kurulmazsa iz kalir.',
    shortTermEffect: 'Park kenari ayni gun sinirli dengeyle duzenlenir.',
    carryOverConsequence: 'Denge bozulursa gelecek hafta sonu ayni nokta yogun baslar.',
    containerNetworkIntent: 'Park kenari setini konteyner aginda hassas denge noktasi yap.',
    environmentCareIntent: 'Yesil alan cevresinde sakin cevre dokunusu planla.',
    containerPressureIntent: 'Park kenari basincini kaynak katmaninda goster.',
    resourceFatigueIntent: 'Hassas denge turu ekip temposunu yavaslatir.',
    districtOperationKind: 'park_container_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'carry_over'],
    mapLayerIds: ['social_pulse', 'district_trust', 'resource_pressure'],
    trustIntent: 'Park kenari hassas guvenini olcmek.',
    memoryIntent: 'Hafta sonu yogunlugunu yesil alan hafizasina almak.',
    variantCopies: variants(
      'Park kenari ikili set dengesiz; yuruyus yolu daraldi.',
      { kind: 'improved', text: 'Kisa denge turu park kenarini ayni gun rahatlatir.' },
      { kind: 'district_trust', text: 'Sakin duzen Yesilvadi guven notunu destekler.' },
      { kind: 'carry_over', text: 'Ertelenen denge gelecek hafta sonu yogunluguna kalir.' },
    ),
    echoes: echoes(
      'Park kenarinda once denge, sonra hiz.',
      'Park kenari konteyner dengesi bugun Yesilvadi raporunda.',
      'Yuruyus kullanicilari yolun acilmasini bekliyor.',
      'Sosyal nabiz katmaninda park kenarini goster.',
      'Gelecek hafta sonu oncesi ayni seti erken kontrol et.',
      'Yesilvadi park kenari dengesi daha sakin kapandi.',
    ),
    environmentHints: environmentHints(
      'Park kenari setini ag haritasinda hassas nokta yap.',
      'Yesil alan cevresinde sakin cevre plani yaz.',
      'Dengesiz seti saha ekibine ikili numara ver.',
      'Hafta sonu oncesi denge kontrolunu planla.',
    ),
  },
  {
    id: 'yesilvadi_sessiz_toplama_plani',
    title: 'Yesilvadi Agacli Sokak Kapak Vurusu',
    districtIds: ['yesilvadi'],
    domains: ['container_pressure', 'social_trust', 'personnel'],
    affectedActor: 'yesilvadi sakinleri',
    concreteScene: 'Aksam vardiyasinda agacli sokakta kapak vurusu ve set surtunmesi apartman kayitlarini artiriyor.',
    visibleOperationalProblem: 'Kayitlar cogalirken set kilidi kapanma suresi uzuyor.',
    decisionTradeoff: 'Yumusak kilitleme plani turu yavaslatir; hizli kilitleme ayni sokakta kaydi geri getirir.',
    shortTermEffect: 'Agacli sokak ayni aksam yumusak kilitleme planiyla tamamlanir.',
    carryOverConsequence: 'Plan sabit kalmazsa yarin aksam vardiyasinda vurus tekrarlar.',
    containerNetworkIntent: 'Agacli sokak setini konteyner aginda kilitleme hassasiyeti olarak isaretle.',
    environmentCareIntent: 'Set cevresinde yaprak izini aksam dokunusuyla birlikte al.',
    containerPressureIntent: 'Kilitleme basincini mahalle guven uyarisiyla goster.',
    resourceFatigueIntent: 'Yavas kilitleme plani ayni ekibe gece ikinci set verirse tempo duser.',
    districtOperationKind: 'low_noise_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'crisis_adjacent', 'recovery'],
    mapLayerIds: ['social_pulse', 'district_trust', 'resource_fatigue'],
    trustIntent: 'Kapak vurusu guven etkisini olcmek.',
    memoryIntent: 'Kapak vurusu saatini agacli sokak hafizasina almak.',
    crisisAdjacency: 'Notlar artarsa kontrollu kapak hizi; aceleci anlatim yok.',
    variantCopies: variants(
      'Aksam vardiyasinda kapak vurusu artiyor; yumusak kilitleme plani gerekli.',
      { kind: 'improved', text: 'Yumusak kilitleme apartman kaydini ayni aksam yumusatir.' },
      { kind: 'crisis_adjacent', text: 'Artan vurus kontrollu kilitleme hizi satirina duser.' },
      { kind: 'recovery', text: 'Plan oturunca apartman tonu ayni hafta duzelir.' },
    ),
    echoes: echoes(
      'Agacli sokakta kapak tonu gorunurluk kadar onemli.',
      'Kapak vurusu uyarisi bugun Yesilvadi raporunda.',
      'Apartmanlar aksam vurusunu kayda geciriyor.',
      'Sosyal nabiz katmaninda kilitleme hassas setini goster.',
      'Yarin aksam vardiyasi icin yumusak kilitleme planini hazirla.',
      'Yesilvadi kapak vurusu uyarisi daha sakin kapandi.',
    ),
    environmentHints: environmentHints(
      'Agacli sokak setini ag haritasinda dusuk gurultu yap.',
      'Kapak cevresi yaprak izine sakin cevre dokunusu planla.',
      'Set numarasini saha ekibine kapak sirasina gore ver.',
      'Yarin sabah ayni vardiya saatini kontrol et.',
    ),
  },
  {
    id: 'yesilvadi_yesil_koridor_cevre_notu',
    title: 'Yesilvadi Yesil Koridor Cevre Notu',
    districtIds: ['yesilvadi'],
    domains: ['visible_service', 'resource_fatigue', 'container'],
    affectedActor: 'yesil koridor gonulluleri',
    concreteScene: 'Agacli koridor boyunca konteyner cevresinde yaprak ve ambalaj birikimi gorunur.',
    visibleOperationalProblem: 'Koridor estetigi zayiflayinca gonullu notlari artiyor.',
    decisionTradeoff: 'Koridoru oncelemek ana hat bekler; kismi temizlik iz birakir.',
    shortTermEffect: 'Yesil koridor ayni aksam gorunur cevre notuyla toparlanir.',
    carryOverConsequence: 'Ertelenirse yarin koridor girisi yine yogun baslar.',
    containerNetworkIntent: 'Yesil koridor hattini konteyner aginda cevre notu noktasi yap.',
    environmentCareIntent: 'Agacli koridorda cevresel hassasiyet onceligi ver.',
    containerPressureIntent: 'Koridor basincini kaynak katmaninda isaretle.',
    resourceFatigueIntent: 'Uzun koridor turu ekip kapasitesini daraltir.',
    districtOperationKind: 'green_zone_yesilvadi',
    recommendedVariantKinds: ['normal', 'reward', 'worsened', 'comeback'],
    mapLayerIds: ['resource_pressure', 'district_memory', 'social_pulse'],
    trustIntent: 'Cevresel hassasiyet guven etkisini olcmek.',
    memoryIntent: 'Koridor birikim saatini hafizaya almak.',
    variantCopies: variants(
      'Yesil koridorda konteyner cevresi birikti; cevre notu gerekli.',
      { kind: 'reward', text: 'Planli cevre notu koridoru ayni aksam toparlar.' },
      { kind: 'worsened', text: 'Ertelenirse gonullu notlari yarin artar.' },
      { kind: 'comeback', text: 'Kisa tur koridor girisini aksam sonuna yetistirir.' },
    ),
    echoes: echoes(
      'Koridorda once cevre notu, sonra rutin hat.',
      'Yesil koridor cevre notu bugun Yesilvadi raporunda.',
      'Gonulluler koridor estetigini izliyor.',
      'Kaynak baskisi katmaninda koridor noktasini goster.',
      'Yarin koridor girisini erken kontrol et.',
      'Yesilvadi yesil koridor cevre notu sakin kapandi.',
    ),
    environmentHints: environmentHints(
      'Koridor hattini ag haritasinda cevre notu yap.',
      'Yaprak birikimine hassas cevre dokunusu planla.',
      'Koridor noktalarini gonullu listesine ekle.',
      'Yarin giris kontrolunu takip satirina yaz.',
    ),
  },
  {
    id: 'yesilvadi_piknik_alani_sonrasi_iz',
    title: 'Yesilvadi Piknik Alani Sonrasi Iz',
    districtIds: ['yesilvadi'],
    domains: ['carry_over', 'reward_recovery', 'resource_recovery'],
    affectedActor: 'piknik alani ziyaretcileri',
    concreteScene: 'Hafta sonu piknik alani cevresinde konteyner seti ve oturma alani atik izi birakti.',
    visibleOperationalProblem: 'Pazartesi sabah alan aileler icin kullanilamaz gorunuyor.',
    decisionTradeoff: 'Piknik izini erken almak ana rotayi bekletir; beklemek izi buyutur.',
    shortTermEffect: 'Piknik alani ayni sabah sinirli temizlikle acilir.',
    carryOverConsequence: 'Iz kalirsa gelecek hafta sonu oncesi yogunlasir.',
    containerNetworkIntent: 'Piknik alani setini konteyner aginda hafta sonu iz noktasi yap.',
    environmentCareIntent: 'Oturma alani cevresinde sakin temizlik dili kullan.',
    containerPressureIntent: 'Piknik alani basincini sosyal nabizda goster.',
    resourceFatigueIntent: 'Erken piknik turu sabah ekibini yorar.',
    districtOperationKind: 'green_area_care_yesilvadi',
    recommendedVariantKinds: ['normal', 'carry_over', 'recovery', 'district_trust'],
    mapLayerIds: ['social_pulse', 'district_memory', 'district_trust'],
    trustIntent: 'Hafta sonu izi sonrasi guven algisini olcmek.',
    memoryIntent: 'Piknik yogunlugunu alan hafizasina kaydetmek.',
    variantCopies: variants(
      'Piknik alani cevresinde hafta sonu izi var; pazartesi sabah oncelik gerekir.',
      { kind: 'carry_over', text: 'Ertelenen iz gelecek hafta sonu oncesi buyur.' },
      { kind: 'recovery', text: 'Erken temizlik alani ayni sabah kullanilabilir gosterir.' },
      { kind: 'district_trust', text: 'Sakin temizlik Yesilvadi guven notunu destekler.' },
    ),
    echoes: echoes(
      'Piknik izinde once alan, sonra hat.',
      'Piknik alani sonrasi iz bugun Yesilvadi raporunda.',
      'Ziyaretciler pazartesi alanin acilmasini bekliyor.',
      'Sosyal nabiz katmaninda piknik alanini goster.',
      'Gelecek hafta sonu oncesi ayni seti kontrol et.',
      'Yesilvadi piknik alani izi sinirli ama gorunur azaldi.',
    ),
    environmentHints: environmentHints(
      'Piknik setini ag haritasinda hafta sonu izi yap.',
      'Oturma alani cevresinde sakin cevre plani yaz.',
      'Atik izini saha ekibine alan sirasina gore ver.',
      'Hafta sonu oncesi erken kontrol planla.',
    ),
  },
  {
    id: 'yesilvadi_golge_agac_hatti_hizmeti',
    title: 'Yesilvadi Golge Koridor Yumusak Ton',
    districtIds: ['yesilvadi'],
    domains: ['crisis_adjacent', 'district_operation', 'operation_era', 'generic_operation'],
    affectedActor: 'golge koridor apartmanlari',
    concreteScene: 'Golge koridorundaki set cevresi gorunur; apartmanlar yumusak hizmet tonu istiyor.',
    visibleOperationalProblem: 'Hizli kapak ve kisa durak dili apartman kaydini artiriyor.',
    decisionTradeoff: 'Yumusak hizmet daha uzun surer; hizli gecis koridor notunu artirir.',
    shortTermEffect: 'Golge koridor ayni aksam yumusak ton planiyla toparlanir.',
    carryOverConsequence: 'Ton sert kalirsa yarin ayni koridorda kayit tekrarlar.',
    containerNetworkIntent: 'Golge koridorunu konteyner aginda yumusak ton noktasi yap.',
    environmentCareIntent: 'Koridor cevresinde gorunur ama yumusak cevre dili kullan.',
    containerPressureIntent: 'Hat basincini mahalle guveninde goster.',
    resourceFatigueIntent: 'Yavas hat ayni ekibe ikinci tur verilirse tempo duser.',
    districtOperationKind: 'green_zone_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'resource_fatigue'],
    mapLayerIds: ['district_trust', 'social_pulse', 'event_family_signal'],
    trustIntent: 'Koridor yumusak ton guvenini olcmek.',
    memoryIntent: 'Golge koridor ton hassasiyetini plana kaydetmek.',
    variantCopies: variants(
      'Golge koridorunda set cevresi gorunur; yumusak ton plani gerekli.',
      { kind: 'improved', text: 'Yumusak ton apartman kaydini ayni aksam yumusatir.' },
      { kind: 'district_trust', text: 'Gorunur yumusak ton guveni destekler.' },
      { kind: 'resource_fatigue', text: 'Uzayan koridor turu ekip kapasitesini daraltir.' },
    ),
    echoes: echoes(
      'Golge koridorunda ton, hiz kadar onemli.',
      'Koridor yumusak ton satiri bugun Yesilvadi raporunda.',
      'Apartmanlar tonun sakin kalmasini bekliyor.',
      'Mahalle guveni katmaninda golge koridoru goster.',
      'Yarin ayni koridor icin yumusak plani tekrarla.',
      'Yesilvadi golge koridoru daha sakin kapandi.',
    ),
    environmentHints: environmentHints(
      'Golge koridorunu ag haritasinda yumusak ton yap.',
      'Koridor cevresi cevre dokunusunu yumusak planla.',
      'Set cevresini saha ekibine kisa durakla anlat.',
      'Yarin koridor basinda ayni tonu koru.',
    ),
  },
  {
    id: 'merkez_meydan_cevresi_gorunurluk',
    title: 'Merkez Cikis Bandi Gorunur Temizlik',
    districtIds: ['merkez'],
    domains: ['container_network', 'visible_service'],
    affectedActor: 'meydan cikis bandi esnafi',
    concreteScene: 'Cikis bandinda set doluyor; saha ekibi arka sokaktan gectigi icin temizlik gorunmuyor.',
    visibleOperationalProblem: 'Is yapilsa bile yaya bandinda hizmet algisi zayif.',
    decisionTradeoff: 'Band uzerinde kisa durak ayirmak ic hatlari bekletir; arka sokak gecisi guveni dusurur.',
    shortTermEffect: 'Cikis bandi ayni aksam gorunur temizlik bandiyla duzenlenir.',
    carryOverConsequence: 'Band gorunmez kalirsa yarin esnaf defteri yenilenir.',
    containerNetworkIntent: 'Cikis bandi setini konteyner aginda gorunur temizlik bandi yap.',
    environmentCareIntent: 'Band cevresinde cevre dokunusunu yaya akisina gore planla.',
    containerPressureIntent: 'Cikis bandi basincini kaynak katmaninda goster.',
    resourceFatigueIntent: 'Ek gorunur durak ayni ekibi yorar.',
    visibleServiceIntent: 'Band uzerinde vatandasin gorebilecegi kisa durak planla.',
    districtOperationKind: 'visible_service_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'carry_over'],
    mapLayerIds: ['district_trust', 'event_family_signal', 'resource_pressure'],
    trustIntent: 'Cikis bandi gorunur hizmet algisini olcmek.',
    memoryIntent: 'Band yogunlugunu plana kaydetmek.',
    variantCopies: variants(
      'Cikis bandinda set doluyor; gorunur temizlik bandi gerekli.',
      { kind: 'improved', text: 'Band uzerindeki kisa durak esnaf notunu ayni aksam yumusatir.' },
      { kind: 'district_trust', text: 'Gorunur band temizligi Merkez guvenini destekler.' },
      { kind: 'carry_over', text: 'Ertelenen band sabah cikis turunda ilk sirada bekler.' },
    ),
    echoes: echoes(
      'Cikis bandinda gorunurluk hiz kadar onemli.',
      'Band gorunur temizlik satiri bugun Merkez raporunda.',
      'Esnaf duragi band uzerinde gormek istiyor.',
      'Aktif gorev katmaninda cikis bandi setini vurgula.',
      'Sabah cikis turunda ayni bandi kontrol et.',
      'Merkez cikis bandi daha gorunur kapandi.',
    ),
    environmentHints: environmentHints(
      'Cikis bandi setini ag haritasinda gorunur band yap.',
      'Cevre dokunusunu yaya akisina uygun planla.',
      'Gorunur duragi saha ekibine band uzerinde goster.',
      'Sabah turu oncesi band kontrolunu yaz.',
    ),
  },
  {
    id: 'merkez_cadde_gecis_konteyner_hatti',
    title: 'Merkez Resmi Hat Gecis Penceresi',
    districtIds: ['merkez'],
    domains: ['container_pressure', 'social_trust', 'generic_operation'],
    affectedActor: 'resmi cadde yaya akisi',
    concreteScene: 'Resmi hat uzerindeki set cevresi ogle gecis penceresinde yaya seridini daraltiyor.',
    visibleOperationalProblem: 'Yaya seridi ile set kapatma ayni dakikalarda ust uste geliyor.',
    decisionTradeoff: 'Hat uzerinde kisa pencere ayirmak ara sokagi geciktirir; beklemek gecis guvenini dusurur.',
    shortTermEffect: 'Resmi hat ayni ogle penceresinde daha duzenli akar.',
    carryOverConsequence: 'Pencere kayarsa yarin ayni saatte serit daralmasi tekrarlar.',
    containerNetworkIntent: 'Cadde gecis hattini konteyner aginda yogunluk uyarisi yap.',
    environmentCareIntent: 'Cadde cevresinde cevre duzeni ve yaya guvenini birlikte tut.',
    containerPressureIntent: 'Gecis basincini sosyal nabizda goster.',
    resourceFatigueIntent: 'Yogun gecis ayni ekibe art arda verilirse tempo duser.',
    visibleServiceIntent: 'Cadde uzerinde kisa gorunur gecis penceresi planla.',
    districtOperationKind: 'shift_balance_merkez',
    recommendedVariantKinds: ['normal', 'worsened', 'comeback', 'resource_fatigue'],
    mapLayerIds: ['active_task_route', 'social_pulse', 'resource_pressure'],
    trustIntent: 'Yogun gecis guvenini olcmek.',
    memoryIntent: 'Gecis saatini cadde hafizasina kaydetmek.',
    variantCopies: variants(
      'Resmi hat set cevresi daraldi; ogle gecis penceresi gerekli.',
      { kind: 'worsened', text: 'Bekleme uzarsa yaya seridi ogleden sonra zorlasir.' },
      { kind: 'comeback', text: 'Kisa pencere hat gecisini aksam sonuna toparlar.' },
      { kind: 'resource_fatigue', text: 'Art arda ogle penceresi ekip yorgunlugu biriktirir.' },
    ),
    echoes: echoes(
      'Resmi hatta once serit guveni, sonra hiz.',
      'Hat gecis penceresi bugun Merkez raporunda.',
      'Yayalar serit daralmasini fark ediyor.',
      'Sosyal nabiz katmaninda hat setini goster.',
      'Yarin ayni ogle saati icin pencere planini ac.',
      'Merkez resmi hat gecisi daha duzenli kapandi.',
    ),
    environmentHints: environmentHints(
      'Cadde hattini ag haritasinda yogunluk uyarisi yap.',
      'Yaya gecidi cevresi cevre planini netlestir.',
      'Daralan seti saha ekibine gecis sirasina gore ver.',
      'Yarin ayni saat penceresini kontrol et.',
    ),
  },
  {
    id: 'merkez_vatandas_gozu_onu_mudahale',
    title: 'Merkez Vatandas Gozu Onu Mudahale',
    districtIds: ['merkez'],
    domains: ['environmental_care', 'district_operation', 'authority_milestone'],
    affectedActor: 'belediye binasi ziyaretcileri',
    concreteScene: 'Kurum onundaki konteyner cevresinde ani ambalaj birikimi vatandas algisini etkiliyor.',
    visibleOperationalProblem: 'Mudahale gecikirse giris onu yogun gorunur.',
    decisionTradeoff: 'On plandaki mudahale diger konteyner hatlarini bekletir.',
    shortTermEffect: 'Kurum onu ayni aksam gorunur mudahaleyle toparlanir.',
    carryOverConsequence: 'Ertelenirse yarin ziyaretci girisi yogun baslar.',
    containerNetworkIntent: 'Kurum onu noktasini konteyner aginda oncelikli mudahale yap.',
    environmentCareIntent: 'Giris cevresinde hizli cevre dokunusu planla.',
    containerPressureIntent: 'Kurum onu basincini kaynak katmaninda goster.',
    resourceFatigueIntent: 'Mudahale timine ikinci agir nokta verilirse tempo duser.',
    visibleServiceIntent: 'Vatandasin gorebilecegi kisa mudahale penceresi ac.',
    districtOperationKind: 'public_visibility_merkez',
    recommendedVariantKinds: ['normal', 'reward', 'comeback', 'crisis_adjacent'],
    mapLayerIds: ['crisis_watch', 'district_trust', 'resource_pressure'],
    trustIntent: 'Vatandas algisi ve guven etkisini olcmek.',
    memoryIntent: 'Kurum onu birikimini mudahale hafizasina almak.',
    crisisAdjacency: 'Birikim artarsa kontrollu mudahale; aceleci anlatim yok.',
    variantCopies: variants(
      'Kurum onunda ani birikim var; vatandas algisi icin gorunur mudahale gerekli.',
      { kind: 'reward', text: 'Planli mudahale giris onunu ayni aksam toparlar.' },
      { kind: 'comeback', text: 'Kisa mudahale sonrasi ana hat aksam sonuna yetisir.' },
      { kind: 'crisis_adjacent', text: 'Artan birikim kontrollu mudahale satirina duser.' },
    ),
    echoes: echoes(
      'Kurum onunda once algisi, sonra tam hat.',
      'Vatandas gozu onu mudahale bugun Merkez raporunda.',
      'Ziyaretciler giris onunun duzenini bekliyor.',
      'Kaynak baskisi katmaninda kurum onunu goster.',
      'Yarin ziyaretci girisi planini mudahale sonrasina gore ac.',
      'Merkez vatandas gozu onu mudahale kontrollu kapandi.',
    ),
    environmentHints: environmentHints(
      'Kurum onunu ag haritasinda oncelikli mudahale yap.',
      'Giris cevresi cevre dokunusunu kisa pencerede bitir.',
      'Birikim noktasini mudahale timine tek satir ver.',
      'Yarin giris kontrolunu takip listesine ekle.',
    ),
  },
  {
    id: 'sanayi_uretim_bandi_konteyner_yogunlugu',
    title: 'Sanayi Uretim Bandi Konteyner Yogunlugu',
    districtIds: ['sanayi'],
    domains: ['container_network', 'container_pressure'],
    affectedActor: 'uretim bandi saha sorumlusu',
    concreteScene: 'Fabrika cikis bandinda uc set ayni vardiya sonunda kapasite uyarisi veriyor.',
    visibleOperationalProblem: 'Bosaltma sirasi yetmezse band cikisi ertesi vardiyada tikanir.',
    decisionTradeoff: 'Bandi oncelemek yan hat setlerini bekletir; ertelemek uretim cikisini yogunlastirir.',
    shortTermEffect: 'Band cikisi ayni vardiya sonunda sinirli bosaltmayla rahatlar.',
    carryOverConsequence: 'Ertelenirse sabah uretim cikisi ek set yuku alir.',
    containerNetworkIntent: 'Uretim bandi cikisini konteyner aginda kapasite uyarisi yap.',
    environmentCareIntent: 'Band cevresinde endustriyel cevre dokunusu planla.',
    containerPressureIntent: 'Band cikis basincini kaynak katmaninda goster.',
    resourceFatigueIntent: 'Ust uste agir bosaltma ekip yorgunlugu biriktirir.',
    districtOperationKind: 'industrial_sorting_sanayi',
    recommendedVariantKinds: ['normal', 'worsened', 'carry_over', 'resource_fatigue'],
    mapLayerIds: ['resource_pressure', 'resource_fatigue', 'event_family_signal'],
    trustIntent: 'Sanayi band guven algisini olcmek.',
    memoryIntent: 'Vardiya sonu yogunlugunu band hafizasina almak.',
    variantCopies: variants(
      'Fabrika cikis bandinda uc set doluyor; bosaltma sirasi yetmiyor.',
      { kind: 'worsened', text: 'Ertelenirse band cikisi sabah tikanir.' },
      { kind: 'carry_over', text: 'Kalan set sabah ilk sirada bekler.' },
      { kind: 'resource_fatigue', text: 'Agir bosaltma ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Band cikisinda once sira, sonra hiz.',
      'Uretim bandi konteyner yogunlugu bugun Sanayi raporunda.',
      'Saha sorumlusu bosaltma saatini soruyor.',
      'Kaynak baskisi katmaninda band setlerini goster.',
      'Sabah uretim cikisini onceki yogunluga gore ac.',
      'Sanayi uretim bandi yogunlugu sinirli kapandi.',
    ),
    environmentHints: environmentHints(
      'Band cikis setlerini ag haritasinda kapasite uyarisi yap.',
      'Endustriyel cevre dokunusunu band cevresinde planla.',
      'Dolu setleri saha ekibine vardiya sirasina gore ver.',
      'Sabah band kontrolunu takip satirina yaz.',
    ),
  },
  {
    id: 'sanayi_ayristirma_noktasi_cevre',
    title: 'Sanayi Ayrisim Bandi Karisim Uyarisi',
    districtIds: ['sanayi'],
    domains: ['environmental_care', 'resource_fatigue', 'resource_recovery'],
    affectedActor: 'ayrisim bandi teknisyeni',
    concreteScene: 'Ayrisim bandinda yanlis atik satiri set cevresinde koku ve etiket karisikligi yaratiyor.',
    visibleOperationalProblem: 'Etiket uyumsuzlugu sonraki band turunu uzatiyor.',
    decisionTradeoff: 'Bandi durdurup duzeltmek vardiya sonunu geciktirir; devam etmek karisikligi buyutur.',
    shortTermEffect: 'Ayrisim bandi ayni vardiyada sinirli duzeltmeyle calisir.',
    carryOverConsequence: 'Karisik etiket kalirsa yarin band turu ek kontrol ister.',
    containerNetworkIntent: 'Ayrisim bandini konteyner aginda etiket riski olarak isaretle.',
    environmentCareIntent: 'Band cevresinde koku ve etiket uyumunu birlikte ele al.',
    containerPressureIntent: 'Band basincini kaynak katmaninda goster.',
    resourceFatigueIntent: 'Uzun etiket duzeltmesi ayni ekibin vardiya sonunu daraltir.',
    districtOperationKind: 'side_road_container_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'comeback', 'crisis_adjacent'],
    mapLayerIds: ['resource_pressure', 'crisis_watch', 'resource_fatigue'],
    trustIntent: 'Ayrisim bandi guven algisini olcmek.',
    memoryIntent: 'Karisim olayini nokta hafizasina kaydetmek.',
    crisisAdjacency: 'Karisim artarsa kontrollu mudahale; aceleci anlatim yok.',
    variantCopies: variants(
      'Ayrisim bandinda etiket karisikligi var; cevre ve etiket birlikte duzeltilmeli.',
      { kind: 'improved', text: 'Kisa etiket duzeltmesi bandi ayni vardiyada calisir yapar.' },
      { kind: 'comeback', text: 'Ertelenen duzeltme sabah band turunu toparlar.' },
      { kind: 'crisis_adjacent', text: 'Artan karisiklik kontrollu mudahale satirina duser.' },
    ),
    echoes: echoes(
      'Ayrisim bandinda once etiket, sonra hiz.',
      'Band etiket uyarisi bugun Sanayi raporunda.',
      'Teknisyen karisik satiri izliyor.',
      'Kaynak baskisi katmaninda ayrisim bandini goster.',
      'Yarin band turunda ayni etiket satirini erken kontrol et.',
      'Sanayi ayrisim bandi etiket riski sinirlandi.',
    ),
    environmentHints: environmentHints(
      'Ayrisim bandini ag haritasinda etiket riski yap.',
      'Koku kaynagina band cevresi cevre dokunusu planla.',
      'Karisik etiket satirlarini teknisyene ayir.',
      'Sabah band turunda erken kontrolu yaz.',
    ),
  },
  {
    id: 'istasyon_peron_cep_atik_birikimi',
    title: 'Istasyon Peron Kenar Cep Temizligi',
    districtIds: ['istasyon'],
    domains: ['container_pressure', 'environmental_care', 'vehicle_route'],
    affectedActor: 'peron kenar guvenlik ekibi',
    concreteScene: 'Aktarma dalgasi sonrasi peron kenar cepinde ambalaj izi yolcu seridini daraltiyor.',
    visibleOperationalProblem: 'Cep izi buyurse aktarma ritmi bozulur.',
    decisionTradeoff: 'Kenar cep mudahalesi aktarma penceresini keser; beklemek izi buyutur.',
    shortTermEffect: 'Peron kenar cep ayni aksam kisa temizlikle acilir.',
    carryOverConsequence: 'Ertelenirse sabah ilk aktarmada cep yine dar baslar.',
    containerNetworkIntent: 'Peron cepini konteyner aginda aktarma sonrasi kontrol noktasi yap.',
    environmentCareIntent: 'Peron cevresinde kisa cevre dokunusu planla.',
    containerPressureIntent: 'Peron cep basincini sosyal nabizda goster.',
    resourceFatigueIntent: 'Aktarma sonrasi ek cep gorevi ekip temposunu duser.',
    districtOperationKind: 'pocket_cleanup_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'district_trust'],
    mapLayerIds: ['social_pulse', 'resource_pressure', 'active_task_route'],
    trustIntent: 'Istasyon aktarma guven algisini olcmek.',
    memoryIntent: 'Aktarma sonrasi cep saatini istasyon hafizasina almak.',
    variantCopies: variants(
      'Peron kenar cepinde aktarma izi var; kisa temizlik gerekli.',
      { kind: 'improved', text: 'Kisa temizlik yolcu seridini ayni aksam rahatlatir.' },
      { kind: 'carry_over', text: 'Ertelenen cep sabah ilk aktarmada geri gelir.' },
      { kind: 'district_trust', text: 'Gorunur kenar temizligi Istasyon guvenini destekler.' },
    ),
    echoes: echoes(
      'Peronda once kenar cep, sonra aktarma ritmi.',
      'Peron kenar cep temizligi bugun Istasyon raporunda.',
      'Guvenlik ekibi yolcu seridini izliyor.',
      'Sosyal nabiz katmaninda peron kenar cepini goster.',
      'Sabah ilk aktarmada cep kontrolunu one al.',
      'Istasyon peron kenar cep izi sinirli ama gorunur azaldi.',
    ),
    environmentHints: environmentHints(
      'Peron cepini ag haritasinda aktarma sonrasi kontrol yap.',
      'Kisa cevre dokunusunu peron cevresinde planla.',
      'Birikim noktasini guvenlik ekibine tek satir ver.',
      'Sabah aktarmasi oncesi cep kontrolunu yaz.',
    ),
  },
] as const;

const CONTAINER_ENVIRONMENT_PACK_ONE_EXTRA_ERAS_BY_FAMILY: Record<string, readonly string[]> = {
  cumhuriyet_sokak_kenari_gece_yigini: ['crisis_recovery_era'],
  cumhuriyet_sakin_guven_yamasi: ['crisis_recovery_era'],
  cumhuriyet_site_girisi_toparlanma: ['crisis_recovery_era'],
  yesilvadi_sessiz_toplama_plani: ['route_maintenance_era'],
  yesilvadi_piknik_alani_sonrasi_iz: ['crisis_recovery_era'],
  merkez_cadde_gecis_konteyner_hatti: ['route_maintenance_era'],
  sanayi_uretim_bandi_konteyner_yogunlugu: ['route_maintenance_era'],
  sanayi_ayristirma_noktasi_cevre: ['crisis_recovery_era'],
};

function mapEchoCopyBlocks(family: ContainerEnvironmentPackOneFamily): CreviaContentCopyBlock[] {
  const echoSurfaceMap: Record<ContainerEnvironmentPackOneEchoSurface, CreviaContentProductionSurface> = {
    advisor: 'advisor_echo',
    report: 'report_echo',
    social: 'social_echo',
    map: 'map_hint',
    tomorrow_preview: 'tomorrow_preview',
    result: 'operation_result',
  };

  return Object.entries(family.echoes).map(([surface, text]) => ({
    id: `${family.id}_echo_${surface}`,
    surface: echoSurfaceMap[surface as ContainerEnvironmentPackOneEchoSurface],
    text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapVariantCopyBlocks(family: ContainerEnvironmentPackOneFamily): CreviaContentCopyBlock[] {
  return family.variantCopies.map((copy) => ({
    id: `${family.id}_variant_${copy.kind}`,
    surface: 'event_variant',
    text: copy.text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEventFamilyCopyBlocks(family: ContainerEnvironmentPackOneFamily): CreviaContentCopyBlock[] {
  const blocks: Array<[string, string]> = [
    ['scene', family.concreteScene],
    ['problem', family.visibleOperationalProblem],
    ['tradeoff', family.decisionTradeoff],
    ['carry_over', family.carryOverConsequence],
    ['container_network', family.containerNetworkIntent],
    ['environment_care', family.environmentCareIntent],
    ['container_pressure', family.containerPressureIntent],
    ['fatigue', family.resourceFatigueIntent],
  ];
  if (family.visibleServiceIntent) {
    blocks.push(['visible_service', family.visibleServiceIntent]);
  }

  return blocks.map(([key, text]) => ({
    id: `${family.id}_${key}`,
    surface: 'event_family',
    text,
    maxRecommendedLength: 140,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEnvironmentHintCopyBlocks(family: ContainerEnvironmentPackOneFamily): CreviaContentCopyBlock[] {
  const hintMap: Array<[string, string]> = [
    ['container_network_hint', family.environmentHints.containerNetworkHint],
    ['environment_care_hint', family.environmentHints.environmentCareHint],
    ['field_hint', family.environmentHints.fieldHint],
    ['follow_up_hint', family.environmentHints.followUpHint],
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

function toContentPackItem(family: ContainerEnvironmentPackOneFamily): CreviaContentPackItem {
  const variantKinds = family.variantCopies.map((copy) => copy.kind);
  const conceptTags = [
    `district_operation_${family.districtOperationKind}`,
    variantKinds.includes('carry_over') ? `carry_over_${family.id}` : `ce_memory_${family.id}`,
    variantKinds.some((kind) => ['reward', 'comeback', 'recovery'].includes(kind))
      ? `reward_recovery_${family.id}`
      : `ce_balance_${family.id}`,
    `ce_pack_${family.id}`,
  ];

  return {
    id: `cp_container_environment_pack_one_${family.id}`,
    packId: CONTAINER_ENVIRONMENT_PACK_ONE_ID,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    operationEraIds: [
      CONTAINER_ENVIRONMENT_PACK_ONE_ERA_BY_DISTRICT[family.districtIds[0]!],
      ...(family.districtIds[0] === 'cumhuriyet' || family.districtIds[0] === 'sanayi'
        ? (['container_network_era'] as const)
        : []),
      ...(CONTAINER_ENVIRONMENT_PACK_ONE_EXTRA_ERAS_BY_FAMILY[family.id] ?? []),
      ...(family.id === 'yesilvadi_piknik_alani_sonrasi_iz' ? (['city_growth_preview_era'] as const) : []),
    ],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces: [...CONTAINER_ENVIRONMENT_PACK_ONE_REQUIRED_ECHO_SURFACES],
    mapLayerIds: [...family.mapLayerIds],
    rankPermissionIds: ['map_resource_layer', 'district_trust_preview'],
    tags: [family.districtOperationKind, ...conceptTags],
    copyBlocks: [
      ...mapEventFamilyCopyBlocks(family),
      ...mapVariantCopyBlocks(family),
      ...mapEchoCopyBlocks(family),
      ...mapEnvironmentHintCopyBlocks(family),
    ],
    metadata: {
      affectedActor: family.affectedActor,
      concreteScene: family.concreteScene,
      visibleOperationalProblem: family.visibleOperationalProblem,
      decisionTradeoff: family.decisionTradeoff,
      shortTermEffect: family.shortTermEffect,
      carryOverConsequence: family.carryOverConsequence,
      containerNetworkIntent: family.containerNetworkIntent,
      environmentCareIntent: family.environmentCareIntent,
      containerPressureIntent: family.containerPressureIntent,
      resourceFatigueIntent: family.resourceFatigueIntent,
      visibleServiceIntent: family.visibleServiceIntent ?? '',
      districtOperationKind: family.districtOperationKind,
      trustIntent: family.trustIntent,
      memoryIntent: family.memoryIntent,
      crisisAdjacency: family.crisisAdjacency ?? '',
      containerNetworkHint: family.environmentHints.containerNetworkHint,
      environmentCareHint: family.environmentHints.environmentCareHint,
      fieldHint: family.environmentHints.fieldHint,
      followUpHint: family.environmentHints.followUpHint,
      variantCopyCount: family.variantCopies.length,
      echoSurfaceCount: Object.keys(family.echoes).length,
      source: 'container_environment_pack_one_authoring',
    },
  };
}

export const CONTAINER_ENVIRONMENT_PACK_ONE_ITEMS: readonly CreviaContentPackItem[] =
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.map(toContentPackItem);

export const CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK: CreviaContentPackDefinition = {
  id: CONTAINER_ENVIRONMENT_PACK_ONE_ID,
  title: 'Container and Environment Pack One',
  description:
    'Authoring-only container network, environmental care, visible service, and district trust content for Cumhuriyet, Yesilvadi, and Merkez.',
  kind: 'event_family_pack',
  status: 'qa',
  version: '1.0.0',
  owner: 'content_authoring',
  targetDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
  targetDomains: [
    'container_network',
    'container_pressure',
    'environmental_care',
    'visible_service',
    'social_trust',
    'district_operation',
    'resource_fatigue',
    'carry_over',
    'reward_recovery',
    'crisis_adjacent',
    'personnel',
    'social',
    'district_balance',
    'resource_recovery',
    'authority_milestone',
    'generic_operation',
  ],
  targetOperationEraIds: [
    ...CONTAINER_ENVIRONMENT_PACK_ONE_OPERATION_ERA_IDS,
    'city_growth_preview_era',
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
  relatedRankPermissionIds: ['map_resource_layer', 'district_trust_preview'],
  relatedMapLayerIds: [
    'resource_pressure',
    'resource_fatigue',
    'district_trust',
    'district_memory',
    'social_pulse',
    'crisis_watch',
    'event_family_signal',
    'active_task_route',
  ],
  releaseNotes:
    'Authoring-only container and environment pack. Not linked to runtime activation, container network engine, or UI.',
  createdForPhase: 'content_pack_authoring_container_environment_pack_one',
  isRuntimeLinked: false,
  isFutureOnly: false,
  items: [...CONTAINER_ENVIRONMENT_PACK_ONE_ITEMS],
};

export function getContainerEnvironmentPackOneFamiliesByDistrict(): Record<
  ContainerEnvironmentPackOneDistrictId,
  ContainerEnvironmentPackOneFamily[]
> {
  return CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.reduce(
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
    } as Record<ContainerEnvironmentPackOneDistrictId, ContainerEnvironmentPackOneFamily[]>,
  );
}

export function getContainerEnvironmentPackOneVariantCoverage(): Record<
  ContainerEnvironmentPackOneVariantKind,
  number
> {
  return CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.reduce(
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
      recovery: 0,
    } as Record<ContainerEnvironmentPackOneVariantKind, number>,
  );
}

export function getContainerEnvironmentPackOneEchoSurfaceCoverage(): Record<
  ContainerEnvironmentPackOneEchoSurface,
  number
> {
  return CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const surface of Object.keys(family.echoes) as ContainerEnvironmentPackOneEchoSurface[]) {
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
    } as Record<ContainerEnvironmentPackOneEchoSurface, number>,
  );
}

