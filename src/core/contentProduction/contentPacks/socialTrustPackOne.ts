import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

import type {
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
} from '../contentProductionTypes';

export const SOCIAL_TRUST_PACK_ONE_ID = 'social_trust_pack_one';

export type SocialTrustPackOneDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type SocialTrustPackOneEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'result';

export type SocialTrustPackOneVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'district_trust'
  | 'recovery'
  | 'player_adaptive'
  | 'crisis_adjacent'
  | 'resource_fatigue';

export type SocialTrustPackOneDomain =
  | 'social_trust'
  | 'public_sentiment'
  | 'district_trust'
  | 'district_memory'
  | 'visible_service'
  | 'citizen_feedback'
  | 'district_operation'
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

export type SocialTrustPackOneVariantCopy = {
  kind: SocialTrustPackOneVariantKind;
  text: string;
};

export type SocialTrustPackOneSocialHints = {
  socialMentionHint: string;
  districtTrustHint: string;
  advisorToneHint: string;
  reportPublicReactionHint: string;
};

export type SocialTrustPackOneFamily = {
  id: string;
  title: string;
  districtIds: SocialTrustPackOneDistrictId[];
  domains: SocialTrustPackOneDomain[];
  affectedActor: string;
  concreteScene: string;
  visibleOperationalProblem: string;
  decisionTradeoff: string;
  shortTermEffect: string;
  carryOverConsequence: string;
  socialTrustIntent: string;
  publicSentimentIntent: string;
  districtTrustIntent: string;
  districtMemoryIntent: string;
  socialMentionIntent: string;
  resourceIntent?: string;
  districtOperationKind: string;
  recommendedVariantKinds: SocialTrustPackOneVariantKind[];
  mapLayerIds: CreviaMapLayerId[];
  trustIntent: string;
  memoryIntent: string;
  crisisAdjacency?: string;
  variantCopies: SocialTrustPackOneVariantCopy[];
  echoes: Record<SocialTrustPackOneEchoSurface, string>;
  socialHints: SocialTrustPackOneSocialHints;
};

export const SOCIAL_TRUST_PACK_ONE_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] =
  [
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
    'operation_result',
  ] as const;

const SOCIAL_TRUST_PACK_ONE_OPERATION_ERA_IDS = [
  'core_city_operations',
  'container_network_era',
  'district_trust_era',
  'social_pulse_era',
  'crisis_recovery_era',
  'route_maintenance_era',
] as const;

const SOCIAL_TRUST_PACK_ONE_ERA_BY_DISTRICT: Record<
  SocialTrustPackOneDistrictId,
  (typeof SOCIAL_TRUST_PACK_ONE_OPERATION_ERA_IDS)[number]
> = {
  cumhuriyet: 'district_trust_era',
  merkez: 'core_city_operations',
  yesilvadi: 'district_trust_era',
  istasyon: 'social_pulse_era',
  sanayi: 'social_pulse_era',
};

function echoes(
  advisor: string,
  report: string,
  social: string,
  map: string,
  tomorrowPreview: string,
  result: string,
): Record<SocialTrustPackOneEchoSurface, string> {
  return {
    advisor,
    report,
    social,
    map,
    tomorrow_preview: tomorrowPreview,
    result,
  };
}

function socialHints(
  socialMentionHint: string,
  districtTrustHint: string,
  advisorToneHint: string,
  reportPublicReactionHint: string,
): SocialTrustPackOneSocialHints {
  return { socialMentionHint, districtTrustHint, advisorToneHint, reportPublicReactionHint };
}

function variants(
  normal: string,
  second: SocialTrustPackOneVariantCopy,
  third: SocialTrustPackOneVariantCopy,
  fourth: SocialTrustPackOneVariantCopy,
): SocialTrustPackOneVariantCopy[] {
  return [{ kind: 'normal', text: normal }, second, third, fourth];
}

export const SOCIAL_TRUST_PACK_ONE_FAMILIES: readonly SocialTrustPackOneFamily[] = [
  {
    id: 'cumhuriyet_apartman_onu_defter_notu',
    title: 'Cumhuriyet Site Giris Panosu',
    districtIds: ['cumhuriyet'],
    domains: ['public_sentiment', 'visible_service'],
    affectedActor: 'site giris panosu kullanicilari',
    concreteScene: 'Site giris panosuna uc kisa sikayet satiri dustu; giris gorunurlugu dusuyor.',
    visibleOperationalProblem: 'Pano satirlari artarken guven onarim penceresi daraliyor.',
    decisionTradeoff: 'Panoya gorunur cevap vermek ic hat sirasini kisaltir; sessiz beklemek satirlari cogaltir.',
    shortTermEffect: 'Site girisi ayni ogle oncesi pano cevabiyla yumusar.',
    carryOverConsequence: 'Cevap yoksa yarin ayni blokta satir sayisi artar.',
    socialTrustIntent: 'Site giris panosu guven onarimini olcmek.',
    publicSentimentIntent: 'Pano satirlarindaki tonu nabizda izlemek.',
    districtTrustIntent: 'Cumhuriyet site giris guven notunu desteklemek.',
    districtMemoryIntent: 'Pano saatini blok hafizasina kaydetmek.',
    socialMentionIntent: 'Kullanici kisa yorumunu sosyal nabiza tasimak.',
    districtOperationKind: 'bulky_waste_cumhuriyet',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'carry_over'],
    mapLayerIds: ['social_pulse', 'district_trust', 'district_memory'],
    trustIntent: 'Site giris panosu algisini olcmek.',
    memoryIntent: 'Pano satir saatini hafizaya almak.',
    variantCopies: variants(
      'Site giris panosunda uc satir var; gorunur cevap gerekli.',
      { kind: 'improved', text: 'Kisa pano cevabi kullanici tonunu ayni gun yumusatir.' },
      { kind: 'district_trust', text: 'Gorunur cevap Cumhuriyet guven notunu destekler.' },
      { kind: 'carry_over', text: 'Acik satirlar yarin blok turunda ilk sirada bekler.' },
    ),
    echoes: echoes(
      'Panoda once gorunur cevap, sonra tam tur.',
      'Site giris panosu bugun Cumhuriyet raporunda.',
      'Kullanici: Giris panosu acilmadan kimse rahat etmiyor.',
      'Sosyal nabiz katmaninda site giris panosunu goster.',
      'Yarin blok turunda ayni pano satirini erken oku.',
      'Cumhuriyet site giris panosu kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Pano satirini nabizda kisa mention yap.',
      'Site giris guven katmanini vurgula.',
      'Danisman tonu: net ama sakin.',
      'Rapor tepkisi: pano cevabi gorunur.',
    ),
  },
  {
    id: 'cumhuriyet_sohbet_grubu_guven_notu',
    title: 'Cumhuriyet Sohbet Grubu Guven Notu',
    districtIds: ['cumhuriyet'],
    domains: ['resource_recovery', 'district_memory', 'crisis_adjacent'],
    affectedActor: 'apartman sohbet grubu',
    concreteScene: 'Gece balkon sesi sabah apartman sohbet grubunda mesaj tonunu sertlestirdi.',
    visibleOperationalProblem: 'Grup mesaji gecikirse ogle nabiz yorumlari cogalir.',
    decisionTradeoff: 'Gruba gorunur cevap vermek sabah turunu kisaltir; kisa bilgi notu tonu yumusatir ama iz birakir.',
    shortTermEffect: 'Apartman sohbet grubu ayni sabah sinirli cevapla sakinlesir.',
    carryOverConsequence: 'Cevap yoksa yarin ayni grupta mesaj tonu duser.',
    socialTrustIntent: 'Gece balkon sesi sonrasi grup tonunu olcmek.',
    publicSentimentIntent: 'Grup mesaj tonunu nabizda izlemek.',
    districtTrustIntent: 'Tekrarlayan gece konusmasinda guveni korumak.',
    districtMemoryIntent: 'Grup mesaj saatini mahalle hafizasina yazmak.',
    socialMentionIntent: 'Grup uyesi kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'night_residual_cumhuriyet',
    recommendedVariantKinds: ['normal', 'recovery', 'worsened', 'player_adaptive'],
    mapLayerIds: ['district_memory', 'social_pulse', 'district_trust'],
    trustIntent: 'Gece izi sonrasi guven onarim etkisini olcmek.',
    memoryIntent: 'Gece birakma noktasini hafizaya almak.',
    variantCopies: variants(
      'Gece konusma notu sabah grup tonunu sertlestirdi; gorunur cevap gerekli.',
      { kind: 'recovery', text: 'Erken grup cevabi apartman tonunu ayni sabah yumusatir.' },
      { kind: 'worsened', text: 'Bekleme uzarsa ogle nabiz yorumlari cogalir.' },
      { kind: 'player_adaptive', text: 'Kisa bilgi notu bugun icin yeterli olabilir.' },
    ),
    echoes: echoes(
      'Gece konusmasinda once grup cevabi, sonra rutin hat.',
      'Gece konusma guven notu bugun Cumhuriyet raporunda.',
      'Grup uyesi: Sabah mesaji sertlesti, gorunur cevap bekliyoruz.',
      'Mahalle hafizasi katmaninda sohbet grubunu goster.',
      'Yarin sabah ayni grup mesajini kontrol et.',
      'Cumhuriyet gece konusma guven notu olculu kapandi.',
    ),
    socialHints: socialHints(
      'Grup mentionini nabizda kisa tut.',
      'Guven notu katmanini one al.',
      'Danisman tonu: cevap planini net anlat.',
      'Rapor tepkisi: grup tonu yumusadi.',
    ),
  },
  {
    id: 'cumhuriyet_mahalleli_geri_bildirim_defteri',
    title: 'Cumhuriyet Bulvar Levha Nabiz Notu',
    districtIds: ['cumhuriyet'],
    domains: ['citizen_feedback', 'district_trust', 'reward_recovery'],
    affectedActor: 'bulvar mahalleli',
    concreteScene: 'Bulvar levhasina dort kisa satir dustu; komsu da not birakti.',
    visibleOperationalProblem: 'Satirlar artarken cevap suresi belirsizlesiyor.',
    decisionTradeoff: 'Panoya toplu cevap vermek ogle turunu kisaltir; tek tek cevap guveni artirir ama yavaslar.',
    shortTermEffect: 'Bulvar levhasi ayni gun sinirli cevapla sakinlesir.',
    carryOverConsequence: 'Cevap yoksa yarin levha sayfasi yeniden dolacak.',
    socialTrustIntent: 'Mahalleli geri bildirim guvenini olcmek.',
    publicSentimentIntent: 'Levha tonunu nabizda canli tutmak.',
    districtTrustIntent: 'Bulvar aksinda guven notunu desteklemek.',
    districtMemoryIntent: 'Levha yogunlugunu bulvar hafizasina almak.',
    socialMentionIntent: 'Mahalleli ve bakkal kisa yorumlarini mention yapmak.',
    districtOperationKind: 'merchant_response_cumhuriyet',
    recommendedVariantKinds: ['normal', 'reward', 'carry_over', 'comeback'],
    mapLayerIds: ['social_pulse', 'district_trust', 'event_family_signal'],
    trustIntent: 'Geri bildirim cevap hizini olcmek.',
    memoryIntent: 'Defter yogun saatini kaydetmek.',
    variantCopies: variants(
      'Bulvar levhasinda dort yeni satir var; toplu cevap mi tek cevap mi?',
      { kind: 'reward', text: 'Planli cevap levha tonunu ayni ogle yumusatir.' },
      { kind: 'carry_over', text: 'Acik satirlar yarin bulvar turunda ilk durak olur.' },
      { kind: 'comeback', text: 'Kisa tur cevabi aksam sonuna yetisirse ton toparlanir.' },
    ),
    echoes: echoes(
      'Bulvarda once levha cevabi, sonra tam hat.',
      'Bulvar levha nabiz notu bugun Cumhuriyet raporunda.',
      'Mahalleli: Levha yazdik, cevap saati net olsun istiyoruz.',
      'Sosyal nabiz katmaninda bulvar levhasini goster.',
      'Yarin bulvar turunda levha sayfasini erken ac.',
      'Cumhuriyet bulvar levha nabiz notu kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Levha mentionini nabizda iki satirla sinirla.',
      'Bulvar guven katmanini vurgula.',
      'Danisman tonu: cevap secenegini acikla.',
      'Rapor tepkisi: pano cevabi gorunur.',
    ),
  },
  {
    id: 'cumhuriyet_tekrar_baski_yumusatma',
    title: 'Cumhuriyet Tekrar Mesaj Yumusatma',
    districtIds: ['cumhuriyet'],
    domains: ['district_trust', 'reward_recovery', 'authority_milestone'],
    affectedActor: 'site sakini temsilcisi',
    concreteScene: 'Uc haftadir ayni blok aksinda tekrarlayan mesaj satiri temsilci tonunu sertlestirdi.',
    visibleOperationalProblem: 'Yumusatma plani gecikirse temsilci toplu mesaj hazirliyor.',
    decisionTradeoff: 'Tekrar baskiyi oncelemek diger bloklari bekletir; kismi bilgi notu tonu duser.',
    shortTermEffect: 'Blok aksinda ayni hafta sinirli yumusatma uygulanir.',
    carryOverConsequence: 'Plan tutmazsa yarin temsilci mesaji cogalir.',
    socialTrustIntent: 'Tekrar baski yumusatma etkisini olcmek.',
    publicSentimentIntent: 'Temsilci mesaj tonunu nabizda izlemek.',
    districtTrustIntent: 'Uzun sureli baskida guveni korumak.',
    districtMemoryIntent: 'Tekrar saatini apartman hafizasina yazmak.',
    socialMentionIntent: 'Site sakini kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'apartment_container_cumhuriyet',
    recommendedVariantKinds: ['normal', 'improved', 'crisis_adjacent', 'recovery'],
    mapLayerIds: ['district_trust', 'district_memory', 'social_pulse'],
    trustIntent: 'Tekrar mesaj temsilci etkisini olcmek.',
    memoryIntent: 'Tekrar dongusunu hafizaya almak.',
    crisisAdjacency: 'Mesaj artarsa kontrollu yumusatma; aceleci anlatim yok.',
    variantCopies: variants(
      'Tekrarlayan mesaj satiri guven notunu dusuruyor; yumusatma plani gerekli.',
      { kind: 'improved', text: 'Gorunur yumusatma temsilci tonunu ayni hafta yumusatir.' },
      { kind: 'crisis_adjacent', text: 'Artan mesaj kontrollu cevap satirina duser.' },
      { kind: 'recovery', text: 'Plan oturunca blok tonu yavaslar.' },
    ),
    echoes: echoes(
      'Tekrar baskida once plan, sonra hiz.',
      'Tekrar baski yumusatma bugun Cumhuriyet raporunda.',
      'Site sakini: Ayni satir uc haftadir duruyor, gorunur adim istiyoruz.',
      'Mahalle guveni katmaninda blok aksini goster.',
      'Yarin temsilci mesajini plan oncesi oku.',
      'Cumhuriyet tekrar baski yumusatma olculu kapandi.',
    ),
    socialHints: socialHints(
      'Tekrar mentionini nabizda kisa tut.',
      'Guven yumusatma katmanini vurgula.',
      'Danisman tonu: plan secenegini netlestir.',
      'Rapor tepkisi: temsilci tonu yumusadi.',
    ),
  },
  {
    id: 'merkez_gorunur_durusma_algisi',
    title: 'Merkez Kurum Lobisi Kart Nabzi',
    districtIds: ['merkez'],
    domains: ['public_sentiment', 'visible_service', 'district_memory'],
    affectedActor: 'kurum lobisi ziyaretcileri',
    concreteScene: 'Lobi kart noktasinda kisa durak yapilmadan gecilince ziyaretci yorumlari sertlesiyor.',
    visibleOperationalProblem: 'Kart adimi yoksa ogle yogunlugunda yorum sayisi artar.',
    decisionTradeoff: 'Lobide durak ayirmak ic hatlari bekletir; hizli gecis algiyi zayiflatir.',
    shortTermEffect: 'Kurum lobisi ayni ogle kisa durakla yumusar.',
    carryOverConsequence: 'Durak yoksa yarin lobi girisi yogun baslar.',
    socialTrustIntent: 'Lobi kart nabzi guven algisini olcmek.',
    publicSentimentIntent: 'Ziyaretci yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Merkez lobi algisini desteklemek.',
    districtMemoryIntent: 'Durak saatini lobi hafizasina yazmak.',
    socialMentionIntent: 'Ziyaretci kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'route_recovery_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'reward'],
    mapLayerIds: ['district_trust', 'event_family_signal', 'social_pulse'],
    trustIntent: 'Lobi kart algisini olcmek.',
    memoryIntent: 'Durak penceresini kaydetmek.',
    variantCopies: variants(
      'Lobi kart noktasinda durak yok; ziyaretci yorumlari sertlesiyor.',
      { kind: 'improved', text: 'Kisa durak yorum tonunu ayni ogle yumusatir.' },
      { kind: 'district_trust', text: 'Gorunur kart adimi Merkez guven notunu destekler.' },
      { kind: 'reward', text: 'Planli durak lobi kartini ayni gun toparlar.' },
    ),
    echoes: echoes(
      'Lobide once kart adimi, sonra hat.',
      'Kurum lobisi kart nabzi bugun Merkez raporunda.',
      'Ziyaretci: Kart adimini gormeden guven vermek zor.',
      'Sosyal nabiz katmaninda kurum lobisini goster.',
      'Yarin lobi girisinde ayni duragi planla.',
      'Merkez kurum lobisi kart nabzi kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Lobi mentionini nabizda canli tut.',
      'Lobi guven katmanini vurgula.',
      'Danisman tonu: kart onceligini acikla.',
      'Rapor tepkisi: ziyaretci tonu yumusadi.',
    ),
  },
  {
    id: 'merkez_meydan_yorum_dalgasi',
    title: 'Merkez Pasaj Girisi Yorum Dalgasi',
    districtIds: ['merkez'],
    domains: ['social_trust', 'operation_era', 'authority_milestone'],
    affectedActor: 'pasaj girisi esnafi',
    concreteScene: 'Ogle yogunlugunda pasaj girisinde bes kisa yorum ayni anda nabiza dustu.',
    visibleOperationalProblem: 'Yorum dalgasi cevapsiz kalirsa aksam algisi zayiflar.',
    decisionTradeoff: 'Pasaji oncelemek ara sokagi geciktirir; kisa toplu cevap tonu duser.',
    shortTermEffect: 'Pasaj girisi ayni ogle sinirli cevapla sakinlesir.',
    carryOverConsequence: 'Cevap yoksa yarin pasaj acilisinda satir tekrarlar.',
    socialTrustIntent: 'Pasaj yorum dalgasi guven etkisini olcmek.',
    publicSentimentIntent: 'Esnaf yorum tonunu nabizda canli tutmak.',
    districtTrustIntent: 'Pasaj cevresi guven notunu desteklemek.',
    districtMemoryIntent: 'Yorum yogunlugunu pasaj hafizasina almak.',
    socialMentionIntent: 'Esnaf kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'visible_service_merkez',
    recommendedVariantKinds: ['normal', 'worsened', 'comeback', 'player_adaptive'],
    mapLayerIds: ['social_pulse', 'district_trust', 'resource_pressure'],
    trustIntent: 'Pasaj yorum hizini olcmek.',
    memoryIntent: 'Yorum dalga saatini kaydetmek.',
    variantCopies: variants(
      'Pasaj girisinde bes yorum ayni anda dustu; cevap penceresi dar.',
      { kind: 'worsened', text: 'Bekleme uzarsa aksam yorumlari cogalir.' },
      { kind: 'comeback', text: 'Kisa tur cevabi aksam tonunu toparlar.' },
      { kind: 'player_adaptive', text: 'Toplu cevap bugun icin yeterli olabilir.' },
    ),
    echoes: echoes(
      'Pasajda once yorum cevabi, sonra hat.',
      'Pasaj girisi yorum dalgasi bugun Merkez raporunda.',
      'Esnaf: Giris yorumlari birikiyor, gorunur cevap istiyoruz.',
      'Sosyal nabiz katmaninda pasaj girisini goster.',
      'Yarin pasaj acilisinda yorumlari erken oku.',
      'Merkez pasaj girisi yorum dalgasi kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Yorum dalgasini nabizda canli mention yap.',
      'Pasaj guven katmanini vurgula.',
      'Danisman tonu: cevap secenegini netlestir.',
      'Rapor tepkisi: esnaf tonu yumusadi.',
    ),
  },
  {
    id: 'merkez_resmi_hat_mudahale_izi',
    title: 'Merkez Yaya Seridi Nabiz Notu',
    districtIds: ['merkez'],
    domains: ['personnel', 'generic_operation', 'crisis_adjacent'],
    affectedActor: 'yaya seridi kullanicilari',
    concreteScene: 'Yaya seridinde kisa serit bariyeri kuruldu ama yuruyenler adimi goremedigi icin yorum uretiyor.',
    visibleOperationalProblem: 'Bariyer isareti net degilse serit algisi zayif kalir.',
    decisionTradeoff: 'Seritte uzun durak guveni artirir; hizli gecis yorumu sertlestirir.',
    shortTermEffect: 'Yaya seridi ayni ogle bariyer isaretiyle yumusar.',
    carryOverConsequence: 'Isaret yoksa yarin ayni saatte yorum tekrarlar.',
    socialTrustIntent: 'Serit bariyeri guven etkisini olcmek.',
    publicSentimentIntent: 'Yaya yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Yaya seridi guven algisini desteklemek.',
    districtMemoryIntent: 'Bariyer saatini serit hafizasina yazmak.',
    socialMentionIntent: 'Yaya kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'authority_milestone_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'recovery'],
    mapLayerIds: ['social_pulse', 'active_task_route', 'district_trust'],
    trustIntent: 'Serit bariyeri algisini olcmek.',
    memoryIntent: 'Mudahale penceresini kaydetmek.',
    variantCopies: variants(
      'Yaya seridinde bariyer var ama isaret net degil; yorumlar artiyor.',
      { kind: 'improved', text: 'Net bariyer isareti yaya tonunu ayni ogle yumusatir.' },
      { kind: 'carry_over', text: 'Eksik isaret yarin serit turunda geri gelir.' },
      { kind: 'recovery', text: 'Kisa isaret aksam yorumunu sinirlar.' },
    ),
    echoes: echoes(
      'Seritte once bariyer isareti, sonra hiz.',
      'Yaya seridi nabiz notu bugun Merkez raporunda.',
      'Yaya: Bariyer kuruldu ama isareti goremedik, net isaret istiyoruz.',
      'Aktif gorev katmaninda yaya seridini goster.',
      'Yarin ayni ogle saatinde isaret planini ac.',
      'Merkez yaya seridi nabiz notu kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Serit mentionini nabizda canli tut.',
      'Yaya seridi guven katmanini vurgula.',
      'Danisman tonu: isaret onceligini acikla.',
      'Rapor tepkisi: yaya tonu yumusadi.',
    ),
  },
  {
    id: 'merkez_aksam_yogunluk_tepkisi',
    title: 'Merkez Otobus Terminali Nabiz Yogunlugu',
    districtIds: ['merkez'],
    domains: ['carry_over', 'vehicle_route', 'resource_recovery'],
    affectedActor: 'terminal bagaj holu yolculari',
    concreteScene: 'Otobus terminalinde aksam yogunlugunda bagaj holu yorumlari ayni dakikada nabiza yigildi.',
    visibleOperationalProblem: 'Hol yogunlugu cevap penceresini daraltiyor.',
    decisionTradeoff: 'Holu oncelemek gece hatlarini bekletir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Terminal holu ayni aksam sinirli cevapla sakinlesir.',
    carryOverConsequence: 'Cevap yoksa yarin terminal acilisinda tepki tekrarlar.',
    socialTrustIntent: 'Terminal hol tepkisi guven etkisini olcmek.',
    publicSentimentIntent: 'Bagaj holu tonunu nabizda izlemek.',
    districtTrustIntent: 'Merkez terminal guven notunu desteklemek.',
    districtMemoryIntent: 'Hol saatini terminal hafizasina yazmak.',
    socialMentionIntent: 'Yolcu kisa tepki satirini mention olarak tasimak.',
    districtOperationKind: 'public_visibility_merkez',
    recommendedVariantKinds: ['normal', 'worsened', 'reward', 'crisis_adjacent'],
    mapLayerIds: ['social_pulse', 'crisis_watch', 'district_trust'],
    trustIntent: 'Terminal tepki hizini olcmek.',
    memoryIntent: 'Hol yogunluk dakikasini kaydetmek.',
    crisisAdjacency: 'Tepki artarsa kontrollu cevap; aceleci anlatim yok.',
    variantCopies: variants(
      'Terminal holunda tepki satirlari yigildi; cevap penceresi dar.',
      { kind: 'worsened', text: 'Bekleme uzarsa gece hol tonu sertlesir.' },
      { kind: 'reward', text: 'Planli cevap hol tonunu ayni gun yumusatir.' },
      { kind: 'crisis_adjacent', text: 'Artan tepki kontrollu cevap satirina duser.' },
    ),
    echoes: echoes(
      'Terminalde once hol cevabi, sonra hat.',
      'Otobus terminali nabiz yogunlugu bugun Merkez raporunda.',
      'Yolcu: Bagaj holunda herkes ayni anda yaziyor, net cevap istiyoruz.',
      'Sosyal nabiz katmaninda terminal holunu goster.',
      'Yarin terminal acilisinda satirlari erken oku.',
      'Merkez otobus terminali nabiz yogunlugu kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Terminal mentionini nabizda canli tut.',
      'Hol guven katmanini vurgula.',
      'Danisman tonu: yogunluk onceligini acikla.',
      'Rapor tepkisi: cikis tonu yumusadi.',
    ),
  },
  {
    id: 'yesilvadi_sakin_beklenti_notu',
    title: 'Yesilvadi Sakin Beklenti Panosu',
    districtIds: ['yesilvadi'],
    domains: ['social_trust', 'public_sentiment', 'district_balance'],
    affectedActor: 'yesilvadi sakinleri',
    concreteScene: 'Agacli sokakta beklenti panosu: gorunur adim olsun ama ton yumusak kalsin.',
    visibleOperationalProblem: 'Pano net degilse nabizda cift yorum cikar.',
    decisionTradeoff: 'Yumusak plan yavaslatir; hizli gecis pano yorumunu sertlestirir.',
    shortTermEffect: 'Agacli sokak ayni aksam pano planina uygun tamamlanir.',
    carryOverConsequence: 'Plan tutmazsa yarin ayni sokakta pano yenilenir.',
    socialTrustIntent: 'Beklenti panosu guven etkisini olcmek.',
    publicSentimentIntent: 'Pano yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Yesilvadi sakin guven notunu desteklemek.',
    districtMemoryIntent: 'Beklenti saatini yesil rota hafizasina yazmak.',
    socialMentionIntent: 'Sakin kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'green_area_care_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'district_trust', 'player_adaptive'],
    mapLayerIds: ['district_trust', 'social_pulse', 'district_memory'],
    trustIntent: 'Sakin beklenti algisini olcmek.',
    memoryIntent: 'Beklenti not saatini kaydetmek.',
    variantCopies: variants(
      'Agacli sokakta sakin beklenti notu var; yumusak gorunurluk gerekli.',
      { kind: 'improved', text: 'Yumusak plan beklenti tonunu ayni aksam yumusatir.' },
      { kind: 'district_trust', text: 'Gorunur yumusak adim guveni destekler.' },
      { kind: 'player_adaptive', text: 'Kisa bilgi notu bugun icin yeterli olabilir.' },
    ),
    echoes: echoes(
      'Yesilvadi icin once ton, sonra hiz.',
      'Sakin beklenti notu bugun Yesilvadi raporunda.',
      'Sakin: Hiz istiyoruz ama sesimiz kirlmesin, yumusak plan bekliyoruz.',
      'Mahalle guveni katmaninda agacli sokagi goster.',
      'Yarin ayni sokak beklenti notunu tekrar oku.',
      'Yesilvadi sakin beklenti notu daha sakin kapandi.',
    ),
    socialHints: socialHints(
      'Beklenti mentionini nabizda yumusak tut.',
      'Sakin guven katmanini vurgula.',
      'Danisman tonu: yumusak gorunurluk onceligi.',
      'Rapor tepkisi: sakin ton yumusadi.',
    ),
  },
  {
    id: 'yesilvadi_park_kenari_kullanici_yorumu',
    title: 'Yesilvadi Park Kenari Kullanici Yorumu',
    districtIds: ['yesilvadi'],
    domains: ['citizen_feedback', 'district_memory', 'visible_service'],
    affectedActor: 'park kenari aileleri',
    concreteScene: 'Park kenarinda oturma alani cevresinde kullanici yorumlari: duzen gorunur olsun.',
    visibleOperationalProblem: 'Yorumlar artarken aile kullanimi azaliyor.',
    decisionTradeoff: 'Park kenarini oncelemek ana hat bekler; kismi cevap iz birakir.',
    shortTermEffect: 'Park kenari ayni aksam gorunur duzenle yumusar.',
    carryOverConsequence: 'Ertelenirse yarin park acilisinda yorum tekrarlar.',
    socialTrustIntent: 'Park kenari kullanici guven etkisini olcmek.',
    publicSentimentIntent: 'Aile yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Yesil alan guven notunu desteklemek.',
    districtMemoryIntent: 'Park yorum saatini yesil alan hafizasina yazmak.',
    socialMentionIntent: 'Aile kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'park_container_yesilvadi',
    recommendedVariantKinds: ['normal', 'reward', 'carry_over', 'recovery'],
    mapLayerIds: ['social_pulse', 'district_trust', 'resource_pressure'],
    trustIntent: 'Park kullanici algisini olcmek.',
    memoryIntent: 'Park yorum yogunlugunu kaydetmek.',
    variantCopies: variants(
      'Park kenarinda kullanici yorumlari artti; gorunur duzen gerekli.',
      { kind: 'reward', text: 'Planli duzen yorum tonunu ayni aksam yumusatir.' },
      { kind: 'carry_over', text: 'Ertelenen duzen yarin park acilisinda geri gelir.' },
      { kind: 'recovery', text: 'Kisa tur park kenarini aksam sonuna yetistirir.' },
    ),
    echoes: echoes(
      'Park kenarinda once duzen, sonra rutin.',
      'Park kenari kullanici yorumu bugun Yesilvadi raporunda.',
      'Aile: Cocuklar oturmak istemiyor, kenar duzeni gorunur olsun.',
      'Sosyal nabiz katmaninda park kenarini goster.',
      'Yarin park acilisinda kenar yorumunu erken oku.',
      'Yesilvadi park kenari kullanici yorumu sakin kapandi.',
    ),
    socialHints: socialHints(
      'Park mentionini nabizda aile tonuyla yaz.',
      'Yesil alan guven katmanini vurgula.',
      'Danisman tonu: cevre hassasiyeti onceligi.',
      'Rapor tepkisi: aile tonu yumusadi.',
    ),
  },
  {
    id: 'yesilvadi_duzeli_takip_guveni',
    title: 'Yesilvadi Gonullu Pano Takibi',
    districtIds: ['yesilvadi'],
    domains: ['district_trust', 'reward_recovery', 'generic_operation'],
    affectedActor: 'yesil koridor gonulluleri',
    concreteScene: 'Gonulluler haftalik pano kapanisi istiyor; nabizda eski yorumlar hala acik gorunuyor.',
    visibleOperationalProblem: 'Pano kapanisi gecikirse guven notu duser.',
    decisionTradeoff: 'Pano turu diger duraklari bekletir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Yesil koridor ayni hafta pano kapanisiyla yumusar.',
    carryOverConsequence: 'Kapanis tutmazsa yarin koridor girisinde yorum tekrarlar.',
    socialTrustIntent: 'Pano kapanisi guven etkisini olcmek.',
    publicSentimentIntent: 'Gonullu yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Yesilvadi toparlanma guvenini desteklemek.',
    districtMemoryIntent: 'Takip dongusunu koridor hafizasina yazmak.',
    socialMentionIntent: 'Gonullu kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'park_container_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'comeback', 'recovery'],
    mapLayerIds: ['district_memory', 'district_trust', 'social_pulse'],
    trustIntent: 'Pano kapanisi guven etkisini olcmek.',
    memoryIntent: 'Takip haftasini kaydetmek.',
    variantCopies: variants(
      'Yesil koridorda takip listesi gecikiyor; guven notu dusuyor.',
      { kind: 'improved', text: 'Duzenli takip gonullu tonunu ayni hafta yumusatir.' },
      { kind: 'comeback', text: 'Kisa tur koridor girisini aksam sonuna yetistirir.' },
      { kind: 'recovery', text: 'Takip oturunca nabizdaki eski yorumlar kapanir.' },
    ),
    echoes: echoes(
      'Koridorda once takip, sonra hiz.',
      'Duzenli takip guveni bugun Yesilvadi raporunda.',
      'Gonullu: Eski yorumlar acik kaliyor, takip listesi net olsun.',
      'Mahalle hafizasi katmaninda yesil koridoru goster.',
      'Yarin koridor basinda takip listesini ac.',
      'Yesilvadi duzenli takip guveni sakin kapandi.',
    ),
    socialHints: socialHints(
      'Takip mentionini nabizda gonullu tonuyla yaz.',
      'Toparlanma guven katmanini vurgula.',
      'Danisman tonu: takip onceligini acikla.',
      'Rapor tepkisi: gonullu ton yumusadi.',
    ),
  },
  {
    id: 'istasyon_erken_vardiya_nabiz_kuyrugu',
    title: 'Istasyon Bekleme Salonu Nabiz Kuyrugu',
    districtIds: ['istasyon'],
    domains: ['public_sentiment', 'resource_recovery', 'district_memory'],
    affectedActor: 'erken vardiya bilet kontrol noktasi',
    concreteScene: 'Erken vardiyada bilet kontrol noktasinda yolcu yorumlari ust uste dustu.',
    visibleOperationalProblem: 'Nokta cevapsiz kalirsa yolcu tonu sertlesir.',
    decisionTradeoff: 'Kontrol noktasini oncelemek ara hatlari bekletir; kisa toplu cevap tonu duser.',
    shortTermEffect: 'Bilet kontrol noktasi ayni saat diliminde sinirli cevapla yumusar.',
    carryOverConsequence: 'Cevap yoksa yarin erken vardiyada nokta sert baslar.',
    socialTrustIntent: 'Erken vardiya kontrol noktasi guven etkisini olcmek.',
    publicSentimentIntent: 'Yolcu yorum tonunu nabizda canli tutmak.',
    districtTrustIntent: 'Istasyon erken vardiya guven notunu desteklemek.',
    districtMemoryIntent: 'Kontrol saatini istasyon hafizasina yazmak.',
    socialMentionIntent: 'Yolcu kisa yorumunu mention olarak tasimak.',
    resourceIntent: 'Kontrol sonrasi ek gorev ekip temposunu dusurebilir.',
    districtOperationKind: 'crowd_flow_istasyon',
    recommendedVariantKinds: ['normal', 'worsened', 'district_trust', 'resource_fatigue'],
    mapLayerIds: ['social_pulse', 'active_task_route', 'district_trust'],
    trustIntent: 'Erken vardiya kontrol yorum hizini olcmek.',
    memoryIntent: 'Erken vardiya saatini kaydetmek.',
    variantCopies: variants(
      'Bilet kontrol noktasinda satirlar yigildi; cevap penceresi dar.',
      { kind: 'worsened', text: 'Bekleme uzarsa ogle kontrolu sert baslar.' },
      { kind: 'district_trust', text: 'Net kontrol cevabi Istasyon notunu destekler.' },
      { kind: 'resource_fatigue', text: 'Ek kontrol gorevi ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Erken vardiyada once kontrol cevabi, sonra ritim.',
      'Bilet kontrol nabiz notu sabah ozetine eklendi.',
      'Yolcu: Kontrol noktasinda herkes yaziyor, net cevap istiyoruz.',
      'Aktif gorev katmaninda bilet kontrol noktasini goster.',
      'Yarin erken vardiyada satirlari erken oku.',
      'Bilet kontrol nabiz notu olculu kapanis verdi.',
    ),
    socialHints: socialHints(
      'Kontrol mentionini nabizda yolcu tonuyla yaz.',
      'Istasyon guven katmanini vurgula.',
      'Danisman tonu: kontrol onceligini acikla.',
      'Rapor tepkisi: yolcu ton yumusadi.',
    ),
  },
  {
    id: 'istasyon_peron_algisi_notu',
    title: 'Istasyon Kulube Algisi Notu',
    districtIds: ['istasyon'],
    domains: ['visible_service', 'social', 'district_trust'],
    affectedActor: 'kulube guvenlik ekibi',
    concreteScene: 'Kulube onunde gorunur duzen algisi yolcu notlarini artiriyor; ekip saha notu istiyor.',
    visibleOperationalProblem: 'Algi notu gecikirse aktarma guveni duser.',
    decisionTradeoff: 'Kulube mudahalesi aktarma penceresini keser; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Kulube onu ayni aksam algi notuyla yumusar.',
    carryOverConsequence: 'Not yoksa yarin sabah aktarmasinda algi tekrarlar.',
    socialTrustIntent: 'Kulube algi guven etkisini olcmek.',
    publicSentimentIntent: 'Yolcu algi tonunu nabizda izlemek.',
    districtTrustIntent: 'Istasyon kulube guven notunu desteklemek.',
    districtMemoryIntent: 'Algı saatini kulube hafizasina yazmak.',
    socialMentionIntent: 'Guvenlik ekibi kisa notunu mention yapmak.',
    resourceIntent: 'Kisa kulube gorevi ekip kapasitesini daraltir.',
    districtOperationKind: 'public_trust_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'carry_over', 'recovery'],
    mapLayerIds: ['social_pulse', 'resource_pressure', 'crisis_watch'],
    trustIntent: 'Kulube algı hizini olcmek.',
    memoryIntent: 'Algi not saatini kaydetmek.',
    variantCopies: variants(
      'Kulube onunde saha notu artti; net duzen adimi gerekli.',
      { kind: 'improved', text: 'Kisa duzen adimi saha notunu ayni aksam yumusatir.' },
      { kind: 'carry_over', text: 'Ertelenen kulube yarin sabah cevresinde geri gelir.' },
      { kind: 'recovery', text: 'Saha notu kapaninca kulube tonu duzelir.' },
    ),
    echoes: echoes(
      'Kulubede once saha notu, sonra ritim.',
      'Kulube saha notu gun sonu ozetine eklendi.',
      'Guvenlik: Saha notu sertlesti, kulube adimini netlestirelim.',
      'Haritada kulube onunu isaretle.',
      'Yarin sabah cevresinde saha notunu erken oku.',
      'Kulube saha notu olculu kapanis verdi.',
    ),
    socialHints: socialHints(
      'Algi mentionini nabizda guvenlik tonuyla yaz.',
      'Kulube guven katmanini vurgula.',
      'Danisman tonu: gorunur cep onceligi.',
      'Rapor tepkisi: yolcu algi tonu yumusadi.',
    ),
  },
  {
    id: 'istasyon_rota_koordinasyon_yankisi',
    title: 'Istasyon Bilgi Notu Yankisi',
    districtIds: ['istasyon'],
    domains: ['district_operation', 'crisis_adjacent', 'reward_recovery'],
    affectedActor: 'istasyon yolcu bilgilendirme masasi',
    concreteScene: 'Gecici yogunluk sonrasi masa levhasi yolcu yorumlarina yansidi; nabizda canli.',
    visibleOperationalProblem: 'Masa levhasi gecikirse yorumlar mesaji sorgular.',
    decisionTradeoff: 'Masa cevabi diger hatlari bekletir; sessiz gecis yorumu artirir.',
    shortTermEffect: 'Bilgilendirme masasi ayni aksam levha cevabiyla yumusar.',
    carryOverConsequence: 'Levha yoksa yarin masada yorum tekrarlar.',
    socialTrustIntent: 'Masa levhasi guven etkisini olcmek.',
    publicSentimentIntent: 'Yolcu yorum tonunu nabizda tutmak.',
    districtTrustIntent: 'Istasyon masa guvenini desteklemek.',
    districtMemoryIntent: 'Yogunluk sonrasi saati masa hafizasina yazmak.',
    socialMentionIntent: 'Gorevli kisa yorumunu mention olarak tasimak.',
    districtOperationKind: 'crisis_prevention_istasyon',
    recommendedVariantKinds: ['normal', 'reward', 'player_adaptive', 'crisis_adjacent'],
    mapLayerIds: ['active_task_route', 'social_pulse', 'district_trust'],
    trustIntent: 'Bilgi notu hizini olcmek.',
    memoryIntent: 'Yogunluk sonrasi penceresini kaydetmek.',
    crisisAdjacency: 'Yorum artarsa kontrollu bilgi notu; aceleci anlatim yok.',
    variantCopies: variants(
      'Masa levhasi yolcu yorumlarina dustu; net mesaj gerekli.',
      { kind: 'reward', text: 'Planli levha cevabi yorum tonunu ayni aksam yumusatir.' },
      { kind: 'player_adaptive', text: 'Kisa mesaj bugun icin yeterli olabilir.' },
      { kind: 'crisis_adjacent', text: 'Artan yorum kontrollu levha satirina duser.' },
    ),
    echoes: echoes(
      'Masada once levha cevabi, sonra ritim.',
      'Masa levha yankisi gun sonu satirina dustu.',
      'Gorevli: Yolcu mesaji anlamadi, net levha istiyoruz.',
      'Aktif gorev katmaninda bilgilendirme masasini goster.',
      'Yarin masada levha cevabini erken ac.',
      'Masa levha yankisi olculu kapanis verdi.',
    ),
    socialHints: socialHints(
      'Masa mentionini nabizda canli tut.',
      'Istasyon guven katmanini vurgula.',
      'Danisman tonu: mesaj onceligi.',
      'Rapor tepkisi: yolcu ton yumusadi.',
    ),
  },
  {
    id: 'sanayi_isyeri_onu_algisi',
    title: 'Sanayi Isyeri Onu Algisi',
    districtIds: ['sanayi'],
    domains: ['visible_service', 'social_trust', 'container'],
    affectedActor: 'is yeri onu calisanlari',
    concreteScene: 'Is yeri onunde gorunur aksaklik yorumu: vardiya cikisi temiz gorunmuyor.',
    visibleOperationalProblem: 'Algı notu gecikirse calisan yorumlari cogalir.',
    decisionTradeoff: 'Onu mudahalesi vardiya cikisini geciktirir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Is yeri onu ayni vardiya sonunda algı notuyla yumusar.',
    carryOverConsequence: 'Not yoksa yarin vardiya cikisinda yorum tekrarlar.',
    socialTrustIntent: 'Is yeri onu guven etkisini olcmek.',
    publicSentimentIntent: 'Calisan yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Sanayi is yeri guven notunu desteklemek.',
    districtMemoryIntent: 'Vardiya cikis saatini is yeri hafizasina yazmak.',
    socialMentionIntent: 'Calisan kisa yorumunu mention olarak tasimak.',
    resourceIntent: 'Vardiya sonu ek gorev kapasiteyi daraltir.',
    districtOperationKind: 'route_shift_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'worsened', 'resource_fatigue'],
    mapLayerIds: ['social_pulse', 'resource_fatigue', 'district_trust'],
    trustIntent: 'Is yeri algı hizini olcmek.',
    memoryIntent: 'Vardiya cikis penceresini kaydetmek.',
    variantCopies: variants(
      'Is yeri onunda algı notu artti; gorunur mudahale gerekli.',
      { kind: 'improved', text: 'Kisa mudahale calisan tonunu ayni vardiya yumusatir.' },
      { kind: 'worsened', text: 'Bekleme uzarsa vardiya cikisi yorumlari cogalir.' },
      { kind: 'resource_fatigue', text: 'Vardiya sonu ek gorev ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Is yeri onunda once algı, sonra vardiya.',
      'Isyeri onu algisi bugun Sanayi raporunda.',
      'Calisan: Cikista duzen gorunmuyor, onu notu net olsun.',
      'Kaynak yorgunlugu katmaninda is yeri onunu goster.',
      'Yarin vardiya cikisinda algı notunu erken oku.',
      'Sanayi isyeri onu algisi kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Is yeri mentionini nabizda calisan tonuyla yaz.',
      'Sanayi guven katmanini vurgula.',
      'Danisman tonu: gorunur onu onceligi.',
      'Rapor tepkisi: calisan ton yumusadi.',
    ),
  },
  {
    id: 'sanayi_vardiya_cikis_yorumu',
    title: 'Sanayi Vardiya Cikis Nabiz Notu',
    districtIds: ['sanayi'],
    domains: ['citizen_feedback', 'district_trust', 'social'],
    affectedActor: 'vardiya cikis esnafi',
    concreteScene: 'Vardiya cikisinda esnaf nabiz notu: gecikme onunde duzen algisini dusuruyor.',
    visibleOperationalProblem: 'Yorumlar artarken guven onarim penceresi daraliyor.',
    decisionTradeoff: 'Cikisi oncelemek yan hatlari bekletir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Vardiya cikisi ayni aksam sinirli cevapla yumusar.',
    carryOverConsequence: 'Cevap yoksa yarin cikis saatinde yorum tekrarlar.',
    socialTrustIntent: 'Vardiya cikis guven etkisini olcmek.',
    publicSentimentIntent: 'Esnaf yorum tonunu nabizda izlemek.',
    districtTrustIntent: 'Sanayi cikis guven notunu desteklemek.',
    districtMemoryIntent: 'Cikis yogunlugunu esnaf hafizasina yazmak.',
    socialMentionIntent: 'Esnaf kisa yorumunu mention olarak tasimak.',
    resourceIntent: 'Rota gecikmesi esnaf algisini zayiflatir.',
    districtOperationKind: 'route_shift_sanayi',
    recommendedVariantKinds: ['normal', 'comeback', 'district_trust', 'recovery'],
    mapLayerIds: ['district_trust', 'resource_pressure', 'social_pulse'],
    trustIntent: 'Vardiya cikis yorum hizini olcmek.',
    memoryIntent: 'Cikis yogun saatini kaydetmek.',
    variantCopies: variants(
      'Vardiya cikisinda esnaf yorumu artti; gorunur cevap gerekli.',
      { kind: 'comeback', text: 'Kisa cevap cikis tonunu aksam sonuna toparlar.' },
      { kind: 'district_trust', text: 'Gorunur cevap Sanayi guvenini destekler.' },
      { kind: 'recovery', text: 'Cevap oturunca esnaf tonu yavaslar.' },
    ),
    echoes: echoes(
      'Vardiya cikisinda once yorum cevabi, sonra hat.',
      'Vardiya cikis yorumu bugun Sanayi raporunda.',
      'Esnaf: Rota gecikmesi onumuzde duzensiz gorunuyor, net cevap istiyoruz.',
      'Sosyal nabiz katmaninda vardiya cikisini goster.',
      'Yarin cikis saatinde yorumlari erken oku.',
      'Sanayi vardiya cikis yorumu kontrollu kapandi.',
    ),
    socialHints: socialHints(
      'Cikis mentionini nabizda esnaf tonuyla yaz.',
      'Sanayi guven katmanini vurgula.',
      'Danisman tonu: cevap onceligini acikla.',
      'Rapor tepkisi: esnaf ton yumusadi.',
    ),
  },
] as const;

const SOCIAL_TRUST_PACK_ONE_EXTRA_ERAS_BY_FAMILY: Record<string, readonly string[]> = {
  cumhuriyet_apartman_onu_defter_notu: ['container_network_era'],
  cumhuriyet_sohbet_grubu_guven_notu: ['crisis_recovery_era'],
  cumhuriyet_tekrar_baski_yumusatma: ['crisis_recovery_era'],
  merkez_aksam_yogunluk_tepkisi: ['crisis_recovery_era'],
  merkez_resmi_hat_mudahale_izi: ['route_maintenance_era'],
  istasyon_rota_koordinasyon_yankisi: ['route_maintenance_era'],
  sanayi_vardiya_cikis_yorumu: ['route_maintenance_era'],
};

function mapEchoCopyBlocks(family: SocialTrustPackOneFamily): CreviaContentCopyBlock[] {
  const echoSurfaceMap: Record<SocialTrustPackOneEchoSurface, CreviaContentProductionSurface> = {
    advisor: 'advisor_echo',
    report: 'report_echo',
    social: 'social_echo',
    map: 'map_hint',
    tomorrow_preview: 'tomorrow_preview',
    result: 'operation_result',
  };

  return Object.entries(family.echoes).map(([surface, text]) => ({
    id: `${family.id}_echo_${surface}`,
    surface: echoSurfaceMap[surface as SocialTrustPackOneEchoSurface],
    text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapVariantCopyBlocks(family: SocialTrustPackOneFamily): CreviaContentCopyBlock[] {
  return family.variantCopies.map((copy) => ({
    id: `${family.id}_variant_${copy.kind}`,
    surface: 'event_variant',
    text: copy.text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEventFamilyCopyBlocks(family: SocialTrustPackOneFamily): CreviaContentCopyBlock[] {
  const blocks: Array<[string, string]> = [
    ['scene', family.concreteScene],
    ['problem', family.visibleOperationalProblem],
    ['tradeoff', family.decisionTradeoff],
    ['carry_over', family.carryOverConsequence],
    ['social_trust', family.socialTrustIntent],
    ['public_sentiment', family.publicSentimentIntent],
    ['district_trust', family.districtTrustIntent],
    ['district_memory', family.districtMemoryIntent],
    ['social_mention', family.socialMentionIntent],
  ];
  if (family.resourceIntent) {
    blocks.push(['resource', family.resourceIntent]);
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

function mapSocialHintCopyBlocks(family: SocialTrustPackOneFamily): CreviaContentCopyBlock[] {
  const hintMap: Array<[string, string]> = [
    ['social_mention_hint', family.socialHints.socialMentionHint],
    ['district_trust_hint', family.socialHints.districtTrustHint],
    ['advisor_tone_hint', family.socialHints.advisorToneHint],
    ['report_public_reaction_hint', family.socialHints.reportPublicReactionHint],
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

function toContentPackItem(family: SocialTrustPackOneFamily): CreviaContentPackItem {
  const variantKinds = family.variantCopies.map((copy) => copy.kind);
  const conceptTags = [
    `district_operation_${family.districtOperationKind}`,
    variantKinds.includes('carry_over') ? `carry_over_${family.id}` : `st_memory_${family.id}`,
    variantKinds.some((kind) => ['reward', 'comeback', 'recovery'].includes(kind))
      ? `reward_recovery_${family.id}`
      : `st_balance_${family.id}`,
    `st_pack_${family.id}`,
  ];

  return {
    id: `cp_social_trust_pack_one_${family.id}`,
    packId: SOCIAL_TRUST_PACK_ONE_ID,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    operationEraIds: [
      SOCIAL_TRUST_PACK_ONE_ERA_BY_DISTRICT[family.districtIds[0]!],
      ...(SOCIAL_TRUST_PACK_ONE_EXTRA_ERAS_BY_FAMILY[family.id] ?? []),
      ...(family.id === 'yesilvadi_duzeli_takip_guveni' ? (['city_growth_preview_era'] as const) : []),
    ],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces: [...SOCIAL_TRUST_PACK_ONE_REQUIRED_ECHO_SURFACES],
    mapLayerIds: [...family.mapLayerIds],
    rankPermissionIds: ['district_trust_preview', 'map_resource_layer'],
    tags: [family.districtOperationKind, ...conceptTags],
    copyBlocks: [
      ...mapEventFamilyCopyBlocks(family),
      ...mapVariantCopyBlocks(family),
      ...mapEchoCopyBlocks(family),
      ...mapSocialHintCopyBlocks(family),
    ],
    metadata: {
      affectedActor: family.affectedActor,
      concreteScene: family.concreteScene,
      visibleOperationalProblem: family.visibleOperationalProblem,
      decisionTradeoff: family.decisionTradeoff,
      shortTermEffect: family.shortTermEffect,
      carryOverConsequence: family.carryOverConsequence,
      socialTrustIntent: family.socialTrustIntent,
      publicSentimentIntent: family.publicSentimentIntent,
      districtTrustIntent: family.districtTrustIntent,
      districtMemoryIntent: family.districtMemoryIntent,
      socialMentionIntent: family.socialMentionIntent,
      resourceIntent: family.resourceIntent ?? '',
      districtOperationKind: family.districtOperationKind,
      trustIntent: family.trustIntent,
      memoryIntent: family.memoryIntent,
      crisisAdjacency: family.crisisAdjacency ?? '',
      socialMentionHint: family.socialHints.socialMentionHint,
      districtTrustHint: family.socialHints.districtTrustHint,
      advisorToneHint: family.socialHints.advisorToneHint,
      reportPublicReactionHint: family.socialHints.reportPublicReactionHint,
      variantCopyCount: family.variantCopies.length,
      echoSurfaceCount: Object.keys(family.echoes).length,
      source: 'social_trust_pack_one_authoring',
    },
  };
}

export const SOCIAL_TRUST_PACK_ONE_ITEMS: readonly CreviaContentPackItem[] =
  SOCIAL_TRUST_PACK_ONE_FAMILIES.map(toContentPackItem);

export const SOCIAL_TRUST_PACK_ONE_CONTENT_PACK: CreviaContentPackDefinition = {
  id: SOCIAL_TRUST_PACK_ONE_ID,
  title: 'Social Trust Pack One',
  description:
    'Authoring-only social trust, public sentiment, district trust, and citizen feedback content for Cumhuriyet, Merkez, and Yesilvadi.',
  kind: 'event_family_pack',
  status: 'qa',
  version: '1.0.0',
  owner: 'content_authoring',
  targetDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
  targetDomains: [
    'social_trust',
    'public_sentiment',
    'district_trust',
    'district_memory',
    'visible_service',
    'citizen_feedback',
    'district_operation',
    'carry_over',
    'reward_recovery',
    'crisis_adjacent',
    'container',
    'vehicle_route',
    'personnel',
    'social',
    'district_balance',
    'resource_recovery',
    'authority_milestone',
    'operation_era',
    'generic_operation',
  ],
  targetOperationEraIds: [
    ...SOCIAL_TRUST_PACK_ONE_OPERATION_ERA_IDS,
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
  relatedRankPermissionIds: ['district_trust_preview', 'map_resource_layer'],
  relatedMapLayerIds: [
    'social_pulse',
    'district_trust',
    'district_memory',
    'resource_pressure',
    'resource_fatigue',
    'crisis_watch',
    'event_family_signal',
    'active_task_route',
  ],
  releaseNotes:
    'Authoring-only social trust pack. Not linked to runtime activation, social pulse engine, or UI.',
  createdForPhase: 'content_pack_authoring_social_trust_pack_one',
  isRuntimeLinked: false,
  isFutureOnly: false,
  items: [...SOCIAL_TRUST_PACK_ONE_ITEMS],
};

export function getSocialTrustPackOneFamiliesByDistrict(): Record<
  SocialTrustPackOneDistrictId,
  SocialTrustPackOneFamily[]
> {
  return SOCIAL_TRUST_PACK_ONE_FAMILIES.reduce(
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
    } as Record<SocialTrustPackOneDistrictId, SocialTrustPackOneFamily[]>,
  );
}

export function getSocialTrustPackOneVariantCoverage(): Record<
  SocialTrustPackOneVariantKind,
  number
> {
  return SOCIAL_TRUST_PACK_ONE_FAMILIES.reduce(
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
      district_trust: 0,
      recovery: 0,
      player_adaptive: 0,
      crisis_adjacent: 0,
      resource_fatigue: 0,
    } as Record<SocialTrustPackOneVariantKind, number>,
  );
}

export function getSocialTrustPackOneEchoSurfaceCoverage(): Record<
  SocialTrustPackOneEchoSurface,
  number
> {
  return SOCIAL_TRUST_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const surface of Object.keys(family.echoes) as SocialTrustPackOneEchoSurface[]) {
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
    } as Record<SocialTrustPackOneEchoSurface, number>,
  );
}
