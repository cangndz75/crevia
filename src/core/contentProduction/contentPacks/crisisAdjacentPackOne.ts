import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';

import type {
  CreviaContentCopyBlock,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
} from '../contentProductionTypes';

export const CRISIS_ADJACENT_PACK_ONE_ID = 'crisis_adjacent_pack_one';

export type CrisisAdjacentPackOneDistrictId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type CrisisAdjacentPackOneEchoSurface =
  | 'advisor'
  | 'report'
  | 'social'
  | 'map'
  | 'tomorrow_preview'
  | 'result';

export type CrisisAdjacentPackOneVariantKind =
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

export type CrisisAdjacentPackOneDomain =
  | 'crisis_adjacent'
  | 'crisis_watch'
  | 'prevention'
  | 'recovery'
  | 'resource_pressure'
  | 'social_trust'
  | 'vehicle_route'
  | 'container_network'
  | 'district_memory'
  | 'district_operation'
  | 'carry_over'
  | 'district_trust'
  | 'resource_recovery'
  | 'authority_milestone'
  | 'operation_era'
  | 'generic_operation'
  | 'container'
  | 'personnel'
  | 'social'
  | 'district_balance';

export type CrisisAdjacentPackOneVariantCopy = {
  kind: CrisisAdjacentPackOneVariantKind;
  text: string;
};

export type CrisisAdjacentPackOneCrisisHints = {
  crisisWatchHint: string;
  preventionHint: string;
  recoveryHint: string;
  advisorRiskToneHint: string;
  reportRiskSummaryHint: string;
};

export type CrisisAdjacentPackOneFamily = {
  id: string;
  title: string;
  districtIds: CrisisAdjacentPackOneDistrictId[];
  domains: CrisisAdjacentPackOneDomain[];
  affectedActor: string;
  concreteScene: string;
  visibleOperationalProblem: string;
  decisionTradeoff: string;
  shortTermEffect: string;
  carryOverConsequence: string;
  crisisWatchIntent: string;
  preventionIntent: string;
  recoveryIntent: string;
  resourcePressureIntent: string;
  districtTrustIntent: string;
  districtMemoryIntent: string;
  resourceIntent?: string;
  districtOperationKind: string;
  recommendedVariantKinds: CrisisAdjacentPackOneVariantKind[];
  mapLayerIds: CreviaMapLayerId[];
  trustIntent: string;
  memoryIntent: string;
  variantCopies: CrisisAdjacentPackOneVariantCopy[];
  echoes: Record<CrisisAdjacentPackOneEchoSurface, string>;
  crisisHints: CrisisAdjacentPackOneCrisisHints;
};

export const CRISIS_ADJACENT_PACK_ONE_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] =
  [
    'advisor_echo',
    'report_echo',
    'social_echo',
    'map_hint',
    'tomorrow_preview',
    'operation_result',
  ] as const;

const CRISIS_ADJACENT_PACK_ONE_OPERATION_ERA_IDS = [
  'core_city_operations',
  'container_network_era',
  'crisis_recovery_era',
  'social_pulse_era',
  'route_maintenance_era',
] as const;

const CRISIS_ADJACENT_PACK_ONE_ERA_BY_DISTRICT: Record<
  CrisisAdjacentPackOneDistrictId,
  (typeof CRISIS_ADJACENT_PACK_ONE_OPERATION_ERA_IDS)[number]
> = {
  cumhuriyet: 'crisis_recovery_era',
  merkez: 'core_city_operations',
  yesilvadi: 'crisis_recovery_era',
  istasyon: 'social_pulse_era',
  sanayi: 'route_maintenance_era',
};

function echoes(
  advisor: string,
  report: string,
  social: string,
  map: string,
  tomorrowPreview: string,
  result: string,
): Record<CrisisAdjacentPackOneEchoSurface, string> {
  return {
    advisor,
    report,
    social,
    map,
    tomorrow_preview: tomorrowPreview,
    result,
  };
}

function crisisHints(
  crisisWatchHint: string,
  preventionHint: string,
  recoveryHint: string,
  advisorRiskToneHint: string,
  reportRiskSummaryHint: string,
): CrisisAdjacentPackOneCrisisHints {
  return { crisisWatchHint, preventionHint, recoveryHint, advisorRiskToneHint, reportRiskSummaryHint };
}

function variants(
  normal: string,
  second: CrisisAdjacentPackOneVariantCopy,
  third: CrisisAdjacentPackOneVariantCopy,
  fourth: CrisisAdjacentPackOneVariantCopy,
): CrisisAdjacentPackOneVariantCopy[] {
  return [{ kind: 'normal', text: normal }, second, third, fourth];
}

export const CRISIS_ADJACENT_PACK_ONE_FAMILIES: readonly CrisisAdjacentPackOneFamily[] = [
  {
    id: 'cumhuriyet_konteyner_cevresi_baski_izleme',
    title: 'Blok Dortlu Set Baski Izleme',
    districtIds: ['cumhuriyet'],
    domains: ['crisis_watch', 'prevention', 'resource_pressure', 'container'],
    affectedActor: 'dortlu set lojistik temsilcisi',
    concreteScene: 'Dortlu set onunde tekrarlayan malzeme izi blok kapisi saha satirini uzatti.',
    visibleOperationalProblem: 'Izleme gecikirse malzeme hatti ogle oncesine kayar.',
    decisionTradeoff: 'Set onunu oncelemek ic hat sirasini kisaltir; kisa izleme notu tonu yumusatir ama iz birakir.',
    shortTermEffect: 'Blok kapisi ayni sabah sinirli izleme turu ile sakinlesir.',
    carryOverConsequence: 'Tur tutmazsa yarin ayni noktada baski satiri geri gelir.',
    crisisWatchIntent: 'Malzeme izi baskisini izleme katmaninda tutmak.',
    preventionIntent: 'Tekrarlayan set onunde onleyici izleme turu planlamak.',
    recoveryIntent: 'Malzeme izi sonrasi toparlanma penceresi acmak.',
    resourcePressureIntent: 'Ust uste set gorevi ekip temposunu daraltir.',
    districtTrustIntent: 'Blok kapisi guven notunu korumak.',
    districtMemoryIntent: 'Malzeme izi saatini blok hafizasina yazmak.',
    resourceIntent: 'Izleme turu diger blok duraklarini bekletebilir.',
    districtOperationKind: 'container_network_cumhuriyet',
    recommendedVariantKinds: ['normal', 'improved', 'worsened', 'carry_over'],
    mapLayerIds: ['crisis_watch', 'resource_pressure', 'district_trust'],
    trustIntent: 'Malzeme izi algisini olcmek.',
    memoryIntent: 'Izleme tur saatini kaydetmek.',
    variantCopies: variants(
      'Dortlu set onunde malzeme izi baskisi artiyor; izleme turu gerekli.',
      { kind: 'improved', text: 'Erken izleme turu baski tonunu ayni sabah yumusatir.' },
      { kind: 'worsened', text: 'Bekleme uzarsa ogle malzeme notu sertlesir.' },
      { kind: 'carry_over', text: 'Acik baski satiri yarin set turunda ilk durak olur.' },
    ),
    echoes: echoes(
      'Set onunda once izleme, sonra rutin hat.',
      'Dortlu set baski izleme bugun gun sonu satirina dustu.',
      'Lojistik: Malzeme hatti daraldi, kisa mudahale alani istiyoruz.',
      'Crisis watch katmaninda dortlu set onunu goster.',
      'Yarin set turunda malzeme izini erken oku.',
      'Blok dortlu set baski izleme olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Malzeme izini watch katmaninda kisa tut.',
      'Onleyici izleme onceligini netlestir.',
      'Toparlanma penceresini yarina birak.',
      'Danisman tonu: sakin, net plan.',
      'Rapor ozeti: malzeme izi izleniyor.',
    ),
  },
  {
    id: 'cumhuriyet_apartman_sikayet_yumusatma',
    title: 'Cumhuriyet Bahce Sinir Cizgisi',
    districtIds: ['cumhuriyet'],
    domains: ['prevention', 'social_trust', 'personnel', 'social'],
    affectedActor: 'bahce sinir gorevlisi',
    concreteScene: 'Bahce sinir cizgisindeki kalem satiri buyumeden once gorevli kisa mudahale istiyor.',
    visibleOperationalProblem: 'Mudahale gecikirse kalem satiri ogle defterine tasinir.',
    decisionTradeoff: 'Sinir cizgisini oncelemek diger bloklari bekletir; kismi bilgi notu tonu duser.',
    shortTermEffect: 'Bahce hatti ayni ogle sinirli mudahale ile sakinlesir.',
    carryOverConsequence: 'Mudahale yoksa yarin ayni cizgide satir tekrarlar.',
    crisisWatchIntent: 'Kalem satirini watch listesinde izlemek.',
    preventionIntent: 'Sinir cizgisini buyumeden mudahale ile sinirlamak.',
    recoveryIntent: 'Mudahale sonrasi kisa toparlanma alani acmak.',
    resourcePressureIntent: 'Ek sinir gorevi saha ekibini daraltir.',
    districtTrustIntent: 'Bahce hatti guven notunu korumak.',
    districtMemoryIntent: 'Kalem saatini bahce hafizasina yazmak.',
    districtOperationKind: 'trust_repair_cumhuriyet',
    recommendedVariantKinds: ['normal', 'recovery', 'crisis_adjacent', 'district_trust'],
    mapLayerIds: ['social_pulse', 'crisis_watch', 'district_memory'],
    trustIntent: 'Bahce sinir mudahale etkisini olcmek.',
    memoryIntent: 'Mudahale saatini hafizaya almak.',
    variantCopies: variants(
      'Bahce sinirinda kalem satiri buyuyor; onleyici mudahale gerekli.',
      { kind: 'recovery', text: 'Erken mudahale gorevli tonunu ayni ogle duzeltir.' },
      { kind: 'crisis_adjacent', text: 'Artan satir kontrollu mudahale satirina duser.' },
      { kind: 'district_trust', text: 'Gorunur mudahale bahce guvenini destekler.' },
    ),
    echoes: echoes(
      'Bahce hattinda once mudahale, sonra rutin.',
      'Sinir cizgisi mudahalesi gun sonu defterine dustu.',
      'Gorevli: Kalem satiri buyumeden kisa adim istiyoruz.',
      'Mahalle guveni katmaninda bahce sinirini goster.',
      'Yarin sinir cizgisini plan oncesi oku.',
      'Cumhuriyet bahce sinir cizgisi olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Kalem satirini watch listesinde tut.',
      'Onleyici mudahale secenegini acikla.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: yumusak ama net.',
      'Rapor ozeti: sinir cizgisi izleniyor.',
    ),
  },
  {
    id: 'cumhuriyet_guven_toparlanma_penceresi',
    title: 'Cumhuriyet Temsilci Not Penceresi',
    districtIds: ['cumhuriyet'],
    domains: ['recovery', 'district_memory', 'resource_recovery', 'district_balance'],
    affectedActor: 'mahalle temsilcisi',
    concreteScene: 'Son iki gunluk gecikme notu temsilci guven penceresini daraltiyor.',
    visibleOperationalProblem: 'Pencere kapanmazsa nabizdaki eski notlar acik kalir.',
    decisionTradeoff: 'Toparlanma turu kaynak ister; kisa bilgi notu tonu duser ama iz birakir.',
    shortTermEffect: 'Mahalle ayni hafta sinirli toparlanma turu ile yumusar.',
    carryOverConsequence: 'Tur tutmazsa yarin guven notu duser.',
    crisisWatchIntent: 'Guven notu dususunu watch katmaninda izlemek.',
    preventionIntent: 'Eski notlarin yeni baskiya donmesini onlemek.',
    recoveryIntent: 'Toparlanma penceresini gorunur kapatmak.',
    resourcePressureIntent: 'Toparlanma turu diger duraklari bekletir.',
    districtTrustIntent: 'Cumhuriyet guven toparlanmasini desteklemek.',
    districtMemoryIntent: 'Toparlanma saatini mahalle hafizasina yazmak.',
    resourceIntent: 'Ek toparlanma gorevi ekip kapasitesini daraltir.',
    districtOperationKind: 'apartment_container_cumhuriyet',
    recommendedVariantKinds: ['normal', 'comeback', 'reward', 'resource_fatigue'],
    mapLayerIds: ['district_trust', 'district_memory', 'crisis_watch'],
    trustIntent: 'Temsilci penceresi etkisini olcmek.',
    memoryIntent: 'Pencere kapanis saatini kaydetmek.',
    variantCopies: variants(
      'Guven toparlanma penceresi daraldi; kisa tur gerekli.',
      { kind: 'comeback', text: 'Kisa tur guven tonunu hafta sonuna toparlar.' },
      { kind: 'reward', text: 'Planli toparlanma nabizdaki eski notlari kapatir.' },
      { kind: 'resource_fatigue', text: 'Ust uste toparlanma gorevi ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Mahallede once toparlanma, sonra rutin.',
      'Guven toparlanma penceresi Cumhuriyet ozetine eklendi.',
      'Gonullu: Eski notlar acik, pencere net kapanmali.',
      'Mahalle hafizasi katmaninda toparlanma saatini goster.',
      'Yarin guven notunu plan oncesi oku.',
      'Cumhuriyet guven toparlanma penceresi olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Guven dususunu watch katmaninda izle.',
      'Eski notlarin donmesini onle.',
      'Toparlanma penceresini one al.',
      'Danisman tonu: sakin toparlanma.',
      'Rapor ozeti: guven penceresi izleniyor.',
    ),
  },
  {
    id: 'sanayi_vardiya_rota_dengeleme',
    title: 'Sanayi Uretim Bandi Filo Dengeleme',
    districtIds: ['sanayi'],
    domains: ['vehicle_route', 'crisis_watch', 'personnel'],
    affectedActor: 'uretim bandi cikis koordinatoru',
    concreteScene: 'Uretim bandi cikisinda filo baskisi hat kaydirmasini zorluyor; onleyici denge gerekli.',
    visibleOperationalProblem: 'Denge gecikirse is yeri onu yogunlugu artar.',
    decisionTradeoff: 'Rotayi kaydirmak yan hatlari bekletir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Vardiya cikisi ayni aksam sinirli denge ile sakinlesir.',
    carryOverConsequence: 'Denge tutmazsa yarin cikis saatinde baski tekrarlar.',
    crisisWatchIntent: 'Arac baskisini rota watch katmaninda izlemek.',
    preventionIntent: 'Vardiya cikisinda onleyici rota kaydirmasi planlamak.',
    recoveryIntent: 'Denge sonrasi is yeri onu toparlanma penceresi acmak.',
    resourcePressureIntent: 'Kaydirma gecikmesi ekip temposunu daraltir.',
    districtTrustIntent: 'Sanayi vardiya guven notunu korumak.',
    districtMemoryIntent: 'Denge saatini vardiya hafizasina yazmak.',
    districtOperationKind: 'vehicle_resource_sanayi',
    recommendedVariantKinds: ['normal', 'improved', 'recovery', 'carry_over'],
    mapLayerIds: ['active_task_route', 'resource_pressure', 'crisis_watch'],
    trustIntent: 'Filo hat kaydirma etkisini olcmek.',
    memoryIntent: 'Kaydirma penceresini kaydetmek.',
    variantCopies: variants(
      'Vardiya cikisinda arac baskisi artti; rota dengeleme gerekli.',
      { kind: 'improved', text: 'Erken kaydirma cikis tonunu ayni aksam yumusatir.' },
      { kind: 'recovery', text: 'Denge oturunca is yeri onu toparlanir.' },
      { kind: 'carry_over', text: 'Eksik denge yarin cikis saatinde geri gelir.' },
    ),
    echoes: echoes(
      'Vardiyada once denge, sonra hat.',
      'Rota dengeleme notu Sanayi ozetine eklendi.',
      'Koordinator: Cikis baskisi buyuyor, kisa kaydirma istiyoruz.',
      'Aktif rota katmaninda vardiya cikisini goster.',
      'Yarin cikis saatinde denge planini ac.',
      'Sanayi vardiya rota dengeleme olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Arac baskisini watch katmaninda tut.',
      'Onleyici kaydirmayi netlestir.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: operasyonel denge.',
      'Rapor ozeti: rota baskisi izleniyor.',
    ),
  },
  {
    id: 'sanayi_atik_noktasi_onleyici_takip',
    title: 'Sanayi Ayristirma Bandi Takibi',
    districtIds: ['sanayi'],
    domains: ['crisis_adjacent', 'district_operation', 'authority_milestone'],
    affectedActor: 'ayristirma bandi sorumlusu',
    concreteScene: 'Ayristirma bandinda birikim hizi artiyor; onleyici takip listesi guncellenmeli.',
    visibleOperationalProblem: 'Takip gecikirse nokta cevresi gorunur yogunlasir.',
    decisionTradeoff: 'Noktayi oncelemek uretim bandini bekletir; kisa izleme notu tonu duser.',
    shortTermEffect: 'Atik noktasi ayni vardiya sinirli takiple sakinlesir.',
    carryOverConsequence: 'Takip tutmazsa yarin band cevresinde baski tekrarlar.',
    crisisWatchIntent: 'Birikim hizini watch katmaninda izlemek.',
    preventionIntent: 'Atik noktasinda onleyici takip dongusu kurmak.',
    recoveryIntent: 'Takip sonrasi nokta cevresi toparlanma penceresi acmak.',
    resourcePressureIntent: 'Ek takip gorevi ekip kapasitesini daraltir.',
    districtTrustIntent: 'Sanayi atik noktasi guven notunu korumak.',
    districtMemoryIntent: 'Birikim saatini nokta hafizasina yazmak.',
    districtOperationKind: 'crisis_prevention_sanayi',
    recommendedVariantKinds: ['normal', 'worsened', 'crisis_adjacent', 'comeback'],
    mapLayerIds: ['crisis_watch', 'resource_pressure', 'district_trust'],
    trustIntent: 'Atik noktasi takip etkisini olcmek.',
    memoryIntent: 'Takip dongusunu kaydetmek.',
    variantCopies: variants(
      'Atik noktasinda birikim hizi artti; onleyici takip gerekli.',
      { kind: 'worsened', text: 'Bekleme uzarsa band cevresi yogunlasir.' },
      { kind: 'crisis_adjacent', text: 'Artan birikim kontrollu takip satirina duser.' },
      { kind: 'comeback', text: 'Kisa takip turu aksam sonuna yetisirse ton toparlanir.' },
    ),
    echoes: echoes(
      'Noktada once takip, sonra uretim.',
      'Atik noktasi takibi Sanayi ozetine eklendi.',
      'Sorumlu: Birikim hizi yukseldi, onleyici liste istiyoruz.',
      'Crisis watch katmaninda atik noktasini goster.',
      'Yarin band cevresinde takip listesini ac.',
      'Sanayi atik noktasi onleyici takip olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Birikim hizini watch katmaninda izle.',
      'Onleyici takip dongusunu acikla.',
      'Toparlanma penceresini planla.',
      'Danisman tonu: teknik, sakin.',
      'Rapor ozeti: nokta baskisi izleniyor.',
    ),
  },
  {
    id: 'sanayi_arac_yorgunluk_ekip_plani',
    title: 'Sanayi Arac Yorgunluk Ekip Plani',
    districtIds: ['sanayi'],
    domains: ['resource_pressure', 'generic_operation', 'carry_over'],
    affectedActor: 'sanayi bakim plan sorumlusu',
    concreteScene: 'Ucuncu ardisik gorev bakim penceresi planini zorluyor; kaynak baskisi izleniyor.',
    visibleOperationalProblem: 'Plan guncellenmezse vardiya sonu gecikmesi buyur.',
    decisionTradeoff: 'Ekibi dinlendirmek hatlari bekletir; kisa devam notu yorgunlugu artirir.',
    shortTermEffect: 'Filo ayni vardiya sinirli plan ile sakinlesir.',
    carryOverConsequence: 'Plan tutmazsa yarin filo notu sertlesir.',
    crisisWatchIntent: 'Ekip yorgunlugunu watch katmaninda izlemek.',
    preventionIntent: 'Ardisik gorev zincirini onleyici planla kesmek.',
    recoveryIntent: 'Yorgunluk sonrasi vardiya toparlanma penceresi acmak.',
    resourcePressureIntent: 'Yorgunluk baskisi ekip kapasitesini daraltir.',
    districtTrustIntent: 'Sanayi filo guven notunu korumak.',
    districtMemoryIntent: 'Yorgunluk saatini filo hafizasina yazmak.',
    resourceIntent: 'Plan degisikligi diger hat gecikmelerini buyutebilir.',
    districtOperationKind: 'route_discipline_sanayi',
    recommendedVariantKinds: ['normal', 'district_trust', 'reward', 'resource_fatigue'],
    mapLayerIds: ['resource_fatigue', 'resource_pressure', 'crisis_watch'],
    trustIntent: 'Bakim penceresi plan etkisini olcmek.',
    memoryIntent: 'Plan guncelleme saatini kaydetmek.',
    variantCopies: variants(
      'Ekip yorgunluk plani zorlaniyor; kaynak baskisi izleniyor.',
      { kind: 'district_trust', text: 'Gorunur plan guncellemesi filo guvenini destekler.' },
      { kind: 'reward', text: 'Planli dinlenme vardiya tonunu ayni gun yumusatir.' },
      { kind: 'resource_fatigue', text: 'Ucuncu ardisik gorev ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Filoda once plan, sonra gorev.',
      'Arac yorgunluk plani Sanayi ozetine eklendi.',
      'Sorumlu: Ucuncu gorev zinciri uzadi, plan guncellemesi istiyoruz.',
      'Kaynak yorgunlugu katmaninda filoyu goster.',
      'Yarin vardiya basinda plani erken oku.',
      'Sanayi arac yorgunluk ekip plani olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Yorgunlugu watch katmaninda izle.',
      'Onleyici plan kesmesini acikla.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: kaynak odakli.',
      'Rapor ozeti: filo baskisi izleniyor.',
    ),
  },
  {
    id: 'istasyon_aktarma_yogunluk_onlemi',
    title: 'Istasyon Salon Gecis Onlemi',
    districtIds: ['istasyon'],
    domains: ['crisis_watch', 'vehicle_route', 'prevention'],
    affectedActor: 'salon gecis gorevlileri',
    concreteScene: 'Sabah salon dalgasinda yolcu yogunlugu gecis penceresini daraltiyor.',
    visibleOperationalProblem: 'Onlem gecikirse salon kuyrugu ogle oncesine kayar.',
    decisionTradeoff: 'Salonu oncelemek ara hatlari bekletir; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Aktarma salonu ayni sabah sinirli onlem ile sakinlesir.',
    carryOverConsequence: 'Onlem yoksa yarin sabah dalgasi sert baslar.',
    crisisWatchIntent: 'Aktarma yogunlugunu watch katmaninda izlemek.',
    preventionIntent: 'Sabah dalgasinda onleyici gecis penceresi acmak.',
    recoveryIntent: 'Yogunluk sonrasi salon toparlanma penceresi acmak.',
    resourcePressureIntent: 'Ek salon gorevi ekip temposunu daraltir.',
    districtTrustIntent: 'Istasyon aktarma guven notunu korumak.',
    districtMemoryIntent: 'Yogunluk saatini salon hafizasina yazmak.',
    districtOperationKind: 'crowd_flow_istasyon',
    recommendedVariantKinds: ['normal', 'improved', 'crisis_adjacent', 'recovery'],
    mapLayerIds: ['crisis_watch', 'active_task_route', 'social_pulse'],
    trustIntent: 'Salon gecis onlem etkisini olcmek.',
    memoryIntent: 'Dalga saatini kaydetmek.',
    variantCopies: variants(
      'Sabah aktarma yogunlugu artti; kisa onlem penceresi gerekli.',
      { kind: 'improved', text: 'Erken gecis penceresi salon tonunu ayni sabah yumusatir.' },
      { kind: 'crisis_adjacent', text: 'Artan yogunluk kontrollu onlem satirina duser.' },
      { kind: 'recovery', text: 'Onlem oturunca ogle kuyrugu yavaslar.' },
    ),
    echoes: echoes(
      'Salonda once onlem, sonra ritim.',
      'Aktarma yogunluk onlemi Istasyon ozetine eklendi.',
      'Gorevli: Sabah dalgasi sikisti, kisa gecis penceresi istiyoruz.',
      'Crisis watch katmaninda aktarma salonunu goster.',
      'Yarin sabah dalgasini plan oncesi oku.',
      'Istasyon aktarma yogunluk onlemi olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Yogunlugu watch katmaninda izle.',
      'Onleyici gecis penceresini netlestir.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: akis odakli.',
      'Rapor ozeti: salon baskisi izleniyor.',
    ),
  },
  {
    id: 'istasyon_yaya_peron_baski_izleme',
    title: 'Kavsak Dort Yon Akisi',
    districtIds: ['istasyon'],
    domains: ['social_trust', 'resource_pressure', 'crisis_adjacent'],
    affectedActor: 'dort yon signal ekibi',
    concreteScene: 'Dort yonlu kavsakta aksam yogunlugu sensor satirini uzatti; dort yon ekibi kisa plan istiyor.',
    visibleOperationalProblem: 'Plan gecikirse dort yon gecisi dar kalir.',
    decisionTradeoff: 'Kavsagi one almak salon hatlarini bekletir; kisa sensor notu iz birakir.',
    shortTermEffect: 'Dort yon cikisi planli sensor turuyla rahatlar.',
    carryOverConsequence: 'Plan tutmazsa ertesi aksam sensor satiri geri gelir.',
    crisisWatchIntent: 'Dort yon sensor satirini izleme listesinde tutmak.',
    preventionIntent: 'Kavsak dort yonunde kisa gecis plani kurmak.',
    recoveryIntent: 'Yogunluk sonrasi dort yon duzen penceresi acmak.',
    resourcePressureIntent: 'Ek sensor gorevi dort yon ekibini daraltir.',
    districtTrustIntent: 'Dort yon guven notunu korumak.',
    districtMemoryIntent: 'Sensor saatini dort yon hafizasina yazmak.',
    districtOperationKind: 'transfer_route_istasyon',
    recommendedVariantKinds: ['normal', 'carry_over', 'comeback', 'district_trust'],
    mapLayerIds: ['social_pulse', 'crisis_watch', 'resource_pressure'],
    trustIntent: 'Dort yon sensor etkisini olcmek.',
    memoryIntent: 'Gecis plan saatini kaydetmek.',
    variantCopies: variants(
      'Dort yon sensoru yogunluk uyarisi veriyor; kisa plan sart.',
      { kind: 'carry_over', text: 'Eksik plan ertesi aksam sensor satirina doner.' },
      { kind: 'comeback', text: 'Kisa dort yon turu aksam sonuna yetisirse akis duzelir.' },
      { kind: 'district_trust', text: 'Gorunur sensor turu dort yon guvenini destekler.' },
    ),
    echoes: echoes(
      'Dort yonda once sensor, sonra hat.',
      'Kavsak dort yon akisi bugun rapor sensor satirinda.',
      'Signal ekibi: Dort yon daraldi, kisa plan lazim.',
      'Haritada dort yon cikisini one cikar.',
      'Ertesi aksam sensor satirini plan oncesi oku.',
      'Kavsak dort yon akisi kontrollu bitti.',
    ),
    crisisHints: crisisHints(
      'Sensor satirini izleme listesinde tut.',
      'Dort yon gecis planini netlestir.',
      'Duzen penceresini vurgula.',
      'Danisman tonu: dort yon odakli.',
      'Rapor ozeti: sensor yogunlugu izleniyor.',
    ),
  },
  {
    id: 'istasyon_kirlilik_sosyal_etki_onleme',
    title: 'Istasyon Tavan Damlasi Mudahale',
    districtIds: ['istasyon'],
    domains: ['recovery', 'personnel', 'generic_operation'],
    affectedActor: 'salon tavan bakim ekibi',
    concreteScene: 'Salon tavanindaki kisa damla izi yolcu notuna donmeden once bakim ekibi mudahale istiyor.',
    visibleOperationalProblem: 'Mudahale gecikirse damla izi gorunurluk satirina donusur.',
    decisionTradeoff: 'Tavan noktasini oncelemek salon gecisini keser; kisa bilgi notu tonu duser.',
    shortTermEffect: 'Salon tavan hatti ayni aksam sinirli mudahale ile sakinlesir.',
    carryOverConsequence: 'Mudahale yoksa yarin sabah tavanda iz satiri tekrarlar.',
    crisisWatchIntent: 'Tavan damla izini watch katmaninda izlemek.',
    preventionIntent: 'Kisa damlanin gorunurluk satirina donmesini onlemek.',
    recoveryIntent: 'Mudahale sonrasi tavan toparlanma penceresi acmak.',
    resourcePressureIntent: 'Kisa mudahale ekip kapasitesini daraltir.',
    districtTrustIntent: 'Salon tavan duzen notunu korumak.',
    districtMemoryIntent: 'Damla saatini tavan hafizasina yazmak.',
    districtOperationKind: 'pocket_cleanup_istasyon',
    recommendedVariantKinds: ['normal', 'worsened', 'reward', 'resource_fatigue'],
    mapLayerIds: ['crisis_watch', 'district_memory', 'resource_pressure'],
    trustIntent: 'Tavan damla mudahale etkisini olcmek.',
    memoryIntent: 'Mudahale penceresini kaydetmek.',
    variantCopies: variants(
      'Salon tavaninda kisa damla izi gorunur; mudahale penceresi gerekli.',
      { kind: 'worsened', text: 'Bekleme uzarsa gorunurluk satiri uretir.' },
      { kind: 'reward', text: 'Planli mudahale tavan tonunu ayni aksam yumusatir.' },
      { kind: 'resource_fatigue', text: 'Ek tavan gorevi ekip temposunu dusurur.' },
    ),
    echoes: echoes(
      'Tavanda once mudahale, sonra ritim.',
      'Tavan damla mudahalesi gun sonu satirina dustu.',
      'Ekip: Kisa damla gorunur, iz buyumeden mudahale istiyoruz.',
      'Crisis watch katmaninda salon tavan hattini goster.',
      'Yarin sabah tavan iz satirini erken oku.',
      'Istasyon tavan damla mudahalesi olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Tavan damla izini watch katmaninda izle.',
      'Gorunurluk donusunu onle.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: hizli ama sakin.',
      'Rapor ozeti: tavan izi izleniyor.',
    ),
  },
  {
    id: 'merkez_hizmet_alani_baski_kontrolu',
    title: 'Merkez Aydinlatma Bolgesi Kontrolu',
    districtIds: ['merkez'],
    domains: ['personnel', 'resource_pressure', 'generic_operation'],
    affectedActor: 'aydinlatma bolgesi saha ekibi',
    concreteScene: 'Vitrin hatti cevresinde hizmet baskisi buyumeden aydinlatma bolgesi kontrolu gerekli.',
    visibleOperationalProblem: 'Kontrol gecikirse yaya akisi yogunlasir.',
    decisionTradeoff: 'Bolgeyi oncelemek ic hatlari bekletir; kisa kontrol notu tonu duser.',
    shortTermEffect: 'Aydinlatma bolgesi ayni ogle sinirli kontrol ile sakinlesir.',
    carryOverConsequence: 'Kontrol tutmazsa yarin vitrin acilisinda baski tekrarlar.',
    crisisWatchIntent: 'Bolge baskisini watch katmaninda izlemek.',
    preventionIntent: 'Aydinlatma bolgesinde onleyici kontrol dongusu kurmak.',
    recoveryIntent: 'Kontrol sonrasi bolge toparlanma penceresi acmak.',
    resourcePressureIntent: 'Ek kontrol gorevi ekip temposunu daraltir.',
    districtTrustIntent: 'Vitrin hatti algisini korumak.',
    districtMemoryIntent: 'Baski saatini bolge hafizasina yazmak.',
    districtOperationKind: 'resource_balance_merkez',
    recommendedVariantKinds: ['normal', 'improved', 'crisis_adjacent', 'recovery'],
    mapLayerIds: ['crisis_watch', 'resource_pressure', 'district_trust'],
    trustIntent: 'Aydinlatma bolgesi kontrol etkisini olcmek.',
    memoryIntent: 'Kontrol dongusunu kaydetmek.',
    variantCopies: variants(
      'Aydinlatma bolgesinde baski artiyor; saha kontrolu gerekli.',
      { kind: 'improved', text: 'Erken kontrol bolge tonunu ayni ogle yumusatir.' },
      { kind: 'crisis_adjacent', text: 'Artan baski kontrollu kontrol satirina duser.' },
      { kind: 'recovery', text: 'Kontrol oturunca aksam yogunlugu yavaslar.' },
    ),
    echoes: echoes(
      'Vitrin hattinda once kontrol, sonra hat.',
      'Aydinlatma bolgesi kontrolu gun sonu satirina dustu.',
      'Ekip: Yaya akisi yogun, kisa kontrol istiyoruz.',
      'Crisis watch katmaninda aydinlatma bolgesini goster.',
      'Yarin vitrin acilisinda baski notunu erken oku.',
      'Merkez aydinlatma bolgesi kontrolu olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Bolge baskisini watch katmaninda tut.',
      'Onleyici kontrol dongusunu acikla.',
      'Toparlanma penceresini planla.',
      'Danisman tonu: gorunur vitrin.',
      'Rapor ozeti: bolge baskisi izleniyor.',
    ),
  },
  {
    id: 'merkez_resmi_hat_hassas_takip',
    title: 'Merkez Kurum Kapisi Kontrol Hatti',
    districtIds: ['merkez'],
    domains: ['crisis_watch', 'prevention', 'vehicle_route'],
    affectedActor: 'kurum kapisi guvenlik ekibi',
    concreteScene: 'Kurum kapisi giris holunde ziyaretci akisi baskisi kontrol listesini guncellemeyi zorluyor.',
    visibleOperationalProblem: 'Liste gecikirse giris holu gecisi daralir.',
    decisionTradeoff: 'Kapiyi oncelemek ara sokagi bekletir; kisa kontrol notu tonu duser.',
    shortTermEffect: 'Giris holu ayni ogle sinirli kontrol ile sakinlesir.',
    carryOverConsequence: 'Kontrol tutmazsa yarin ayni saatte baski tekrarlar.',
    crisisWatchIntent: 'Giris holu baskisini watch katmaninda izlemek.',
    preventionIntent: 'Kurum kapisi onunde onleyici kontrol hatti uygulamak.',
    recoveryIntent: 'Kontrol sonrasi giris holu toparlanma penceresi acmak.',
    resourcePressureIntent: 'Kontrol hatti ekip kapasitesini daraltir.',
    districtTrustIntent: 'Kurum kapisi guven notunu korumak.',
    districtMemoryIntent: 'Kontrol saatini giris holu hafizasina yazmak.',
    districtOperationKind: 'route_recovery_merkez',
    recommendedVariantKinds: ['normal', 'carry_over', 'comeback', 'district_trust'],
    mapLayerIds: ['crisis_watch', 'district_memory', 'active_task_route'],
    trustIntent: 'Giris holu kontrol etkisini olcmek.',
    memoryIntent: 'Kontrol listesi saatini kaydetmek.',
    variantCopies: variants(
      'Kurum kapısinda ziyaretci baskisi artti; kontrol hatti gerekli.',
      { kind: 'carry_over', text: 'Eksik kontrol yarin giris holu turunda geri gelir.' },
      { kind: 'comeback', text: 'Kisa kontrol turu aksam sonuna yetisirse ton toparlanir.' },
      { kind: 'district_trust', text: 'Gorunur kontrol kurum guvenini destekler.' },
    ),
    echoes: echoes(
      'Giris holunde once kontrol, sonra hiz.',
      'Kurum kapisi kontrol hatti gun sonu satirina dustu.',
      'Guvenlik: Ziyaretci akisi daraldi, liste guncellemesi istiyoruz.',
      'Aktif rota katmaninda giris holunu goster.',
      'Yarin ayni ogle saatinde kontrol listesini ac.',
      'Merkez kurum kapisi kontrol hatti olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Giris holu baskisini watch katmaninda izle.',
      'Kontrol hatti listesini netlestir.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: kurum kapisi odakli.',
      'Rapor ozeti: giris holu baskisi izleniyor.',
    ),
  },
  {
    id: 'merkez_mudahale_guven_koruma',
    title: 'Merkez Lobi Iz Koruma',
    districtIds: ['merkez'],
    domains: ['recovery', 'social_trust', 'carry_over', 'operation_era'],
    affectedActor: 'lobi iz koordinasyon ekibi',
    concreteScene: 'Lobi temizligi sonrasi gorunur iz satiri kaybolursa ziyaretci yorumlari sertlesir.',
    visibleOperationalProblem: 'Iz satiri gecikirse lobi algisi zayif kalir.',
    decisionTradeoff: 'Uzun durak guveni artirir; hizli gecis yorumu sertlestirir.',
    shortTermEffect: 'Lobi ayni ogle gorunur iz satiriyla yumusar.',
    carryOverConsequence: 'Iz yoksa yarin ayni saatte yorum tekrarlar.',
    crisisWatchIntent: 'Lobi iz satirini watch katmaninda izlemek.',
    preventionIntent: 'Iz satirinin zayiflamasini onlemek.',
    recoveryIntent: 'Temizlik sonrasi lobi toparlanma penceresi acmak.',
    resourcePressureIntent: 'Uzun durak diger hatlari bekletir.',
    districtTrustIntent: 'Lobi guven notunu korumak.',
    districtMemoryIntent: 'Iz saatini lobi hafizasina yazmak.',
    districtOperationKind: 'route_recovery_merkez',
    recommendedVariantKinds: ['normal', 'worsened', 'recovery', 'reward'],
    mapLayerIds: ['district_trust', 'crisis_watch', 'social_pulse'],
    trustIntent: 'Lobi iz satiri etkisini olcmek.',
    memoryIntent: 'Iz penceresini kaydetmek.',
    variantCopies: variants(
      'Lobi iz satiri zayif; gorunur koruma gerekli.',
      { kind: 'worsened', text: 'Bekleme uzarsa ziyaretci yorumlari sertlesir.' },
      { kind: 'recovery', text: 'Gorunur iz satiri ayni ogle tonu yumusatir.' },
      { kind: 'reward', text: 'Planli iz lobiyi ayni gun toparlar.' },
    ),
    echoes: echoes(
      'Lobide once iz satiri, sonra hiz.',
      'Lobi iz koruma gun sonu satirina dustu.',
      'Ziyaretci: Temizlik oldu ama izi goremedik, kisa adim istiyoruz.',
      'Mahalle guveni katmaninda lobi girisini goster.',
      'Yarin ayni ogle saatinde iz planini ac.',
      'Merkez lobi iz koruma olculu kapandi.',
    ),
    crisisHints: crisisHints(
      'Lobi iz satirini watch katmaninda tut.',
      'Iz zayiflamasini onle.',
      'Toparlanma penceresini vurgula.',
      'Danisman tonu: gorunur adim.',
      'Rapor ozeti: lobi izi izleniyor.',
    ),
  },
  {
    id: 'yesilvadi_cevre_hassasiyet_plani',
    title: 'Yesilvadi Sessiz Sokak Plani',
    districtIds: ['yesilvadi'],
    domains: ['prevention', 'crisis_adjacent', 'recovery'],
    affectedActor: 'sessiz sokak plan ekibi',
    concreteScene: 'Sessiz sokakta dusuk gurultu plani gecikirse sakin yorumlari cogalir.',
    visibleOperationalProblem: 'Plan net degilse cift yorum uretilir.',
    decisionTradeoff: 'Yumusak plan yavaslatir; hizli gecis yorumu sertlestirir.',
    shortTermEffect: 'Agacli sokak ayni aksam plana uygun tamamlanir.',
    carryOverConsequence: 'Plan tutmazsa yarin ayni sokakta yorum tekrarlar.',
    crisisWatchIntent: 'Gurultu yorumlarini watch katmaninda izlemek.',
    preventionIntent: 'Sessiz sokak planini onleyici olarak netlestirmek.',
    recoveryIntent: 'Plan sonrasi sakin toparlanma penceresi acmak.',
    resourcePressureIntent: 'Yumusak plan diger duraklari bekletir.',
    districtTrustIntent: 'Yesilvadi sakin guven notunu korumak.',
    districtMemoryIntent: 'Plan saatini yesil rota hafizasina yazmak.',
    districtOperationKind: 'environmental_care_yesilvadi',
    recommendedVariantKinds: ['normal', 'improved', 'resource_fatigue', 'carry_over'],
    mapLayerIds: ['district_trust', 'crisis_watch', 'district_memory'],
    trustIntent: 'Cevre hassasiyet plan etkisini olcmek.',
    memoryIntent: 'Plan penceresini kaydetmek.',
    variantCopies: variants(
      'Dusuk gurultu plani gecikiyor; onleyici netlik gerekli.',
      { kind: 'improved', text: 'Yumusak plan sakin tonunu ayni aksam yumusatir.' },
      { kind: 'resource_fatigue', text: 'Uzun yumusak tur ekip temposunu dusurur.' },
      { kind: 'carry_over', text: 'Ertelenen plan yarin sokak basinda geri gelir.' },
    ),
    echoes: echoes(
      'Sessiz sokakta once ton, sonra hiz.',
      'Sessiz sokak plani gun sonu satirina dustu.',
      'Sakin: Gurultu plani net olsun, sesimiz kirilmasin istiyoruz.',
      'Mahalle guveni katmaninda sessiz sokagi goster.',
      'Yarin ayni sokak planini tekrar oku.',
      'Yesilvadi sessiz sokak plani yumusak kapandi.',
    ),
    crisisHints: crisisHints(
      'Gurultu yorumlarini watch katmaninda izle.',
      'Onleyici plan netligini vurgula.',
      'Toparlanma penceresini sakin tut.',
      'Danisman tonu: cevre hassasiyeti.',
      'Rapor ozeti: gurultu plani izleniyor.',
    ),
  },
  {
    id: 'yesilvadi_park_yogunluk_recovery',
    title: 'Yesilvadi Gol Kayasi Recovery',
    districtIds: ['yesilvadi'],
    domains: ['resource_recovery', 'carry_over', 'resource_pressure'],
    affectedActor: 'gol kayasi aileleri',
    concreteScene: 'Hafta sonu yogunlugu sonrasi gol kayasi toparlanma penceresi daraldi.',
    visibleOperationalProblem: 'Recovery gecikirse aile kullanimi azalir.',
    decisionTradeoff: 'Cubuk alanini oncelemek ana hat bekler; kismi recovery tonu duser.',
    shortTermEffect: 'Gol kayasi cubuk alani ayni hafta sinirli recovery ile yumusar.',
    carryOverConsequence: 'Recovery tutmazsa yarin cubuk alani acilisinda yorum tekrarlar.',
    crisisWatchIntent: 'Gol kayasi yogunlugunu watch katmaninda izlemek.',
    preventionIntent: 'Cubuk alani sonrasi tekrar baskiyi onlemek.',
    recoveryIntent: 'Gol kayasi toparlanma penceresini kapatmak.',
    resourcePressureIntent: 'Recovery turu diger yesil duraklari bekletir.',
    districtTrustIntent: 'Gol kayasi guven notunu korumak.',
    districtMemoryIntent: 'Yogunluk saatini gol kayasi hafizasina yazmak.',
    districtOperationKind: 'recovery_focus_yesilvadi',
    recommendedVariantKinds: ['normal', 'crisis_adjacent', 'comeback', 'district_trust'],
    mapLayerIds: ['district_memory', 'crisis_watch', 'resource_pressure'],
    trustIntent: 'Gol kayasi recovery etkisini olcmek.',
    memoryIntent: 'Yogunluk dongusunu kaydetmek.',
    variantCopies: variants(
      'Gol kayasinda yogunluk izi kaldi; recovery penceresi gerekli.',
      { kind: 'crisis_adjacent', text: 'Artan yorum kontrollu recovery satirina duser.' },
      { kind: 'comeback', text: 'Kisa recovery turu hafta sonuna yetisirse ton toparlanir.' },
      { kind: 'district_trust', text: 'Gorunur recovery gol kayasi guvenini destekler.' },
    ),
    echoes: echoes(
      'Gol kayasinda once recovery, sonra rutin.',
      'Gol kayasi recovery gun sonu satirina dustu.',
      'Aile: Cubuk alani duzeni toparlanmadi, kisa recovery istiyoruz.',
      'Mahalle hafizasi katmaninda gol kayasini goster.',
      'Yarin cubuk alani acilisinda recovery notunu erken oku.',
      'Yesilvadi gol kayasi recovery sakin kapandi.',
    ),
    crisisHints: crisisHints(
      'Gol kayasi yogunlugunu watch katmaninda izle.',
      'Tekrar baskiyi onleyici planla.',
      'Recovery penceresini one al.',
      'Danisman tonu: sakin toparlanma.',
      'Rapor ozeti: gol kayasi recovery izleniyor.',
    ),
  },
] as const;

const CRISIS_ADJACENT_PACK_ONE_EXTRA_ERAS_BY_FAMILY: Record<string, readonly string[]> = {
  cumhuriyet_konteyner_cevresi_baski_izleme: ['container_network_era'],
  cumhuriyet_guven_toparlanma_penceresi: ['district_trust_era'],
  sanayi_atik_noktasi_onleyici_takip: ['crisis_recovery_era'],
  istasyon_kirlilik_sosyal_etki_onleme: ['crisis_recovery_era'],
  merkez_hizmet_alani_baski_kontrolu: ['crisis_recovery_era'],
  yesilvadi_cevre_hassasiyet_plani: ['district_trust_era'],
  yesilvadi_park_yogunluk_recovery: ['district_trust_era'],
};

function mapEchoCopyBlocks(family: CrisisAdjacentPackOneFamily): CreviaContentCopyBlock[] {
  const echoSurfaceMap: Record<CrisisAdjacentPackOneEchoSurface, CreviaContentProductionSurface> = {
    advisor: 'advisor_echo',
    report: 'report_echo',
    social: 'social_echo',
    map: 'map_hint',
    tomorrow_preview: 'tomorrow_preview',
    result: 'operation_result',
  };

  return Object.entries(family.echoes).map(([surface, text]) => ({
    id: `${family.id}_echo_${surface}`,
    surface: echoSurfaceMap[surface as CrisisAdjacentPackOneEchoSurface],
    text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapVariantCopyBlocks(family: CrisisAdjacentPackOneFamily): CreviaContentCopyBlock[] {
  return family.variantCopies.map((copy) => ({
    id: `${family.id}_variant_${copy.kind}`,
    surface: 'event_variant',
    text: copy.text,
    maxRecommendedLength: 110,
    isPlayerFacing: true,
    language: 'tr',
  }));
}

function mapEventFamilyCopyBlocks(family: CrisisAdjacentPackOneFamily): CreviaContentCopyBlock[] {
  const blocks: Array<[string, string]> = [
    ['scene', family.concreteScene],
    ['problem', family.visibleOperationalProblem],
    ['tradeoff', family.decisionTradeoff],
    ['carry_over', family.carryOverConsequence],
    ['crisis_watch', family.crisisWatchIntent],
    ['prevention', family.preventionIntent],
    ['recovery', family.recoveryIntent],
    ['resource_pressure', family.resourcePressureIntent],
    ['district_trust', family.districtTrustIntent],
    ['district_memory', family.districtMemoryIntent],
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

function mapCrisisHintCopyBlocks(family: CrisisAdjacentPackOneFamily): CreviaContentCopyBlock[] {
  const hintMap: Array<[string, string]> = [
    ['crisis_watch_hint', family.crisisHints.crisisWatchHint],
    ['prevention_hint', family.crisisHints.preventionHint],
    ['recovery_hint', family.crisisHints.recoveryHint],
    ['advisor_risk_tone_hint', family.crisisHints.advisorRiskToneHint],
    ['report_risk_summary_hint', family.crisisHints.reportRiskSummaryHint],
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

function toContentPackItem(family: CrisisAdjacentPackOneFamily): CreviaContentPackItem {
  const variantKinds = family.variantCopies.map((copy) => copy.kind);
  const conceptTags = [
    `district_operation_${family.districtOperationKind}`,
    variantKinds.includes('carry_over') ? `carry_over_${family.id}` : `ca_memory_${family.id}`,
    variantKinds.some((kind) => ['reward', 'comeback', 'recovery'].includes(kind))
      ? `recovery_window_${family.id}`
      : `ca_balance_${family.id}`,
    `ca_pack_${family.id}`,
  ];

  return {
    id: `cp_crisis_adjacent_pack_one_${family.id}`,
    packId: CRISIS_ADJACENT_PACK_ONE_ID,
    surface: 'event_family',
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    operationEraIds: [
      CRISIS_ADJACENT_PACK_ONE_ERA_BY_DISTRICT[family.districtIds[0]!],
      ...(CRISIS_ADJACENT_PACK_ONE_EXTRA_ERAS_BY_FAMILY[family.id] ?? []),
    ],
    eventFamilyIds: [family.id],
    variantKinds,
    echoSurfaces: [...CRISIS_ADJACENT_PACK_ONE_REQUIRED_ECHO_SURFACES],
    mapLayerIds: [...family.mapLayerIds],
    rankPermissionIds: ['district_trust_preview', 'map_resource_layer'],
    tags: [family.districtOperationKind, ...conceptTags],
    copyBlocks: [
      ...mapEventFamilyCopyBlocks(family),
      ...mapVariantCopyBlocks(family),
      ...mapEchoCopyBlocks(family),
      ...mapCrisisHintCopyBlocks(family),
    ],
    metadata: {
      affectedActor: family.affectedActor,
      concreteScene: family.concreteScene,
      visibleOperationalProblem: family.visibleOperationalProblem,
      decisionTradeoff: family.decisionTradeoff,
      shortTermEffect: family.shortTermEffect,
      carryOverConsequence: family.carryOverConsequence,
      crisisWatchIntent: family.crisisWatchIntent,
      preventionIntent: family.preventionIntent,
      recoveryIntent: family.recoveryIntent,
      resourcePressureIntent: family.resourcePressureIntent,
      districtTrustIntent: family.districtTrustIntent,
      districtMemoryIntent: family.districtMemoryIntent,
      resourceIntent: family.resourceIntent ?? '',
      districtOperationKind: family.districtOperationKind,
      trustIntent: family.trustIntent,
      memoryIntent: family.memoryIntent,
      crisisWatchHint: family.crisisHints.crisisWatchHint,
      preventionHint: family.crisisHints.preventionHint,
      recoveryHint: family.crisisHints.recoveryHint,
      advisorRiskToneHint: family.crisisHints.advisorRiskToneHint,
      reportRiskSummaryHint: family.crisisHints.reportRiskSummaryHint,
      variantCopyCount: family.variantCopies.length,
      echoSurfaceCount: Object.keys(family.echoes).length,
      source: 'crisis_adjacent_pack_one_authoring',
    },
  };
}

export const CRISIS_ADJACENT_PACK_ONE_ITEMS: readonly CreviaContentPackItem[] =
  CRISIS_ADJACENT_PACK_ONE_FAMILIES.map(toContentPackItem);

export const CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK: CreviaContentPackDefinition = {
  id: CRISIS_ADJACENT_PACK_ONE_ID,
  title: 'Crisis Adjacent Pack One',
  description:
    'Authoring-only crisis-adjacent prevention, recovery, and resource pressure content for all five districts.',
  kind: 'event_family_pack',
  status: 'qa',
  version: '1.0.0',
  owner: 'content_authoring',
  targetDistrictIds: ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'],
  targetDomains: [
    'crisis_adjacent',
    'crisis_watch',
    'prevention',
    'recovery',
    'resource_pressure',
    'social_trust',
    'vehicle_route',
    'container_network',
    'district_memory',
    'district_operation',
    'carry_over',
    'district_trust',
    'resource_recovery',
    'authority_milestone',
    'operation_era',
    'generic_operation',
    'container',
    'personnel',
    'social',
    'district_balance',
    'resource_recovery',
    'authority_milestone',
    'operation_era',
    'generic_operation',
  ],
  targetOperationEraIds: [...CRISIS_ADJACENT_PACK_ONE_OPERATION_ERA_IDS],
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
    'crisis_watch',
    'resource_pressure',
    'resource_fatigue',
    'district_trust',
    'district_memory',
    'social_pulse',
    'active_task_route',
    'event_family_signal',
  ],
  releaseNotes:
    'Authoring-only crisis-adjacent pack. Not linked to runtime activation, crisis engine, or UI.',
  createdForPhase: 'content_pack_authoring_crisis_adjacent_pack_one',
  isRuntimeLinked: false,
  isFutureOnly: false,
  items: [...CRISIS_ADJACENT_PACK_ONE_ITEMS],
};

export function getCrisisAdjacentPackOneFamiliesByDistrict(): Record<
  CrisisAdjacentPackOneDistrictId,
  CrisisAdjacentPackOneFamily[]
> {
  return CRISIS_ADJACENT_PACK_ONE_FAMILIES.reduce(
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
    } as Record<CrisisAdjacentPackOneDistrictId, CrisisAdjacentPackOneFamily[]>,
  );
}

export function getCrisisAdjacentPackOneVariantCoverage(): Record<
  CrisisAdjacentPackOneVariantKind,
  number
> {
  return CRISIS_ADJACENT_PACK_ONE_FAMILIES.reduce(
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
    } as Record<CrisisAdjacentPackOneVariantKind, number>,
  );
}

export function getCrisisAdjacentPackOneEchoSurfaceCoverage(): Record<
  CrisisAdjacentPackOneEchoSurface,
  number
> {
  return CRISIS_ADJACENT_PACK_ONE_FAMILIES.reduce(
    (acc, family) => {
      for (const surface of Object.keys(family.echoes) as CrisisAdjacentPackOneEchoSurface[]) {
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
    } as Record<CrisisAdjacentPackOneEchoSurface, number>,
  );
}
