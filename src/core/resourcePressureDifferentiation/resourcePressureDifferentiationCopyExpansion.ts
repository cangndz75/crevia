import type { ResourcePressureDomain } from './resourcePressureDifferentiationTypes';

export const DOMAIN_REASON_EXPANSION: Partial<Record<ResourcePressureDomain, string[]>> = {
  general_resource: [
    'Kaynak ve ekip dengesini koruyan secimler bugun daha guvenli.',
    'Genel baski hem butce hem ekip paylasimini etkiler.',
    'Kapasite dagilimi bugunun karar sinirini belirler.',
    'Butce ve ekip ayni anda yoruluyorsa siralama kritik.',
  ],
  route_pressure: [
    'Rota karari arac ve zaman yukunu dogrudan tasir.',
    'Ulasim baskisi hiz ve esnekligi sinirlar.',
    'Arac hatti erken okunmazsa yarin maliyet artabilir.',
    'Rota secimi ekip ve arac paylasimini birlikte etkiler.',
  ],
  container_pressure: [
    'Konteyner hatti gelecekte daha pahali hale gelebilir.',
    'Hat baskisi ekip ve guven paylasimiyla buyur.',
    'Lojistik sinyali tek noktada kalmayabilir.',
    'Cevre baskisi kucuk gorunse de bolge etkisi yaratir.',
  ],
  social_trust_pressure: [
    'Sosyal guven baskisi dikkat ve guven ekseninde okunur.',
    'Bu secim sosyal etkiyi erken yumusatabilir.',
    'Iletisim tonu maliyeti dogrudan kaynak degil dikkat ekseninde.',
    'Guven hassasiyeti gorunur takip ister.',
  ],
  district_neglect_pressure: [
    'Ertelenen mahalle yarin daha sert geri donebilir.',
    'Bolge odagi ertelenirse risk birikir.',
    'Mahalle sinyali kucuk gorunse de yarin onceligi degistirir.',
    'Kisa kontrol, biriken baskiyi erken gorunur kilar.',
  ],
  recovery_opportunity: [
    'Toparlanma firsati kriz mudahalesinden daha hafif maliyet tasir.',
    'Kucuk hamle gelecek riskini dusurebilir.',
    'Iyilesme penceresi dusuk maliyetle korunabilir.',
    'Olumlu donus, buyuk operasyondan once degerli olabilir.',
  ],
  follow_up_pressure: [
    'Takip dusuk maliyetli ama hafiza etkisi tasir.',
    'Kisa takip hamlesi tam operasyondan daha ucuz hissedilir.',
    'Devam notu yarin kararini netlestirir.',
    'Kucuk adim, sehir hafizasinda kalici iz birakabilir.',
  ],
  risk_signal: [
    'Erken sinyal dogrudan kaynak harcamaz; dikkat ve yarin riski tasir.',
    'Izleme maliyeti kaynak yerine dikkat ekseninde okunur.',
    'Kucuk uyari buyumeden okunursa maliyet dusuk kalir.',
    'Sinyal takibi, mudahaleden once daha guvenli adimdir.',
  ],
  team_capacity_pressure: [
    'Ekip kapasitesi bugun dar; dagitim dikkat ister.',
    'Ekip yuku zaman ve dikkat paylasimini zorlar.',
    'Sinirli ekip ile oncelik secimi kritik.',
    'Ekip dagilimi yanlis olursa yarin yuku artar.',
  ],
  vehicle_strain_pressure: [
    'Arac yuku rota ve bakim maliyetini birlikte buyutur.',
    'Arac baskisi zaman ve arac ekseninde yogunlasir.',
    'Filo yuku erken okunmazsa operasyon alani daralir.',
    'Arac ve rota birlikte bugunun sinirini cizer.',
  ],
  safe_watch: [
    'Guvenli izleme bugun yeterli; zorlayici maliyet yok.',
    'Dusuk baski; acele karar gerektirmez.',
    'Kapasiteyi korumak bugun en iyi strateji olabilir.',
    'Sakin mod, yarin icin temiz karar alani birakir.',
  ],
  fallback: [
    'Sehir sakin; net baski sinyali henuz yok.',
    'Hafif izleme modu yeterli.',
    'Ilk okuma tamamlaninca maliyet tablosu netlesir.',
    'Dusuk veriyle guvenli izleme oneriliyor.',
  ],
};

export const DOMAIN_OPPORTUNITY_EXPANSION: Partial<
  Record<ResourcePressureDomain, string[]>
> = {
  general_resource: [
    'Dogru oncelik bugun kaynak yukunu yarin azaltabilir.',
    'Kucuk denge hamlesi butce alanini genisletir.',
    'Erken siralama, daginik harcamayi onler.',
  ],
  route_pressure: [
    'Erteleme rota yukunu yarina tasiyabilir.',
    'Kisa rota kontrolu yarin operasyon alanini acar.',
    'Erken mudahale arac yukunu dusurebilir.',
  ],
  container_pressure: [
    'Hat izlenmezse gelecek maliyet artabilir.',
    'Erken kontrol cevre baskisini sinirlar.',
    'Kucuk hat duzeltmesi bolge etkisini azaltir.',
  ],
  social_trust_pressure: [
    'Guven zayiflarsa sosyal maliyet buyur.',
    'Sakin iletisim yarin baskiyi hafifletir.',
    'Erken gorunurluk guven maliyetini dusurur.',
  ],
  district_neglect_pressure: [
    'Kisa mahalle kontrolu yarin riskini dusurur.',
    'Erken okuma biriken baskiyi sinirlar.',
    'Kucuk takip bolge guvenini koruyabilir.',
  ],
  recovery_opportunity: [
    'Kucuk hamle yarin riskini dusurebilir.',
    'Firsat penceresi dusuk maliyetle korunabilir.',
    'Erken destek toparlanmayi hizlandirabilir.',
  ],
  follow_up_pressure: [
    'Takip edilmezse iz kalicilasabilir.',
    'Kucuk devam notu yarin kararini kolaylastirir.',
    'Erken takip tam operasyondan ucuz kalir.',
  ],
  risk_signal: [
    'Sinyal gorulmezse yarin riski artar.',
    'Erken izleme mudahale maliyetini dusurur.',
    'Kucuk uyari buyuk yuku onleyebilir.',
  ],
  team_capacity_pressure: [
    'Ekip dagilimi duzeltilirse yarin yuku azalir.',
    'Erken siralama ekip yorgunlugunu sinirlar.',
    'Kucuk dengeleme kapasite alani acar.',
  ],
  vehicle_strain_pressure: [
    'Arac yuku erken okunursa bakim maliyeti dusuk kalir.',
    'Rota duzeltmesi filo yukunu hafifletir.',
    'Kisa kontrol yarin operasyon alanini korur.',
  ],
  safe_watch: [
    'Sakin izleme kapasiteyi yarin icin korur.',
    'Acele etmemek gereksiz maliyeti onler.',
    'Dusuk baskida kucuk not yeterli olabilir.',
  ],
  fallback: [
    'Net sinyal gelince maliyet tablosu guncellenir.',
    'Erken okuma yarin kararini kolaylastirir.',
    'Sakin mod gereksiz harcamayi engeller.',
  ],
};

export const DOMAIN_CAUTION_EXPANSION: Partial<
  Record<ResourcePressureDomain, string[]>
> = {
  general_resource: [
    'Ayni anda cok is secmek butce ve ekip yukunu artirir.',
    'Kaynak daginik harcanirsa yarin alan daralir.',
    'Hizli secimler kapasite dengesini bozabilir.',
  ],
  route_pressure: [
    'Rota ertelenirse arac ve zaman maliyeti buyur.',
    'Filo yuku kontrol edilmezse operasyon alani daralir.',
    'Ulasim baskisi sessizce birikebilir.',
  ],
  container_pressure: [
    'Hat izlenmezse cevre baskisi bolgeye yayilir.',
    'Tek nokta mudahalesi hat genelini cozmeyebilir.',
    'Lojistik gecikme guven maliyetini de artirir.',
  ],
  social_trust_pressure: [
    'Sosyal sinyal gec okunursa guven maliyeti artar.',
    'Gorunursuzluk mahalle algisini zorlayabilir.',
    'Iletisim tonu yanlis secilirse etki tersine donebilir.',
  ],
  district_neglect_pressure: [
    'Mahalle uzun sure pas gecilirse risk birikir.',
    'Kucuk sinyal buyumeden okunmazsa maliyet artar.',
    'Bolge odagi ertelenirse yarin oncelik degisir.',
  ],
  recovery_opportunity: [
    'Firsat penceresi kapanmadan hareket etmek gerekir.',
    'Gec kalinan toparlanma daha pahali mudahale ister.',
    'Kucuk destek ertelenirse momentum kaybolabilir.',
  ],
  follow_up_pressure: [
    'Takip notu kaybolursa ayni baski tekrar gelir.',
    'Devam ertelenirse hafiza izi sertlesir.',
    'Kucuk adim atlanirsa tam operasyon gerekebilir.',
  ],
  risk_signal: [
    'Erken uyari gormezden gelinirse yuk buyur.',
    'Izleme ertelenirse mudahale maliyeti artar.',
    'Kucuk sinyal sessizce kritik hale gelebilir.',
  ],
  team_capacity_pressure: [
    'Ekip asiri dagitilirsa verim duser.',
    'Kapasite sinirini asmak yarin yorgunluk birakir.',
    'Hizli secimler ekip dengesini bozabilir.',
  ],
  vehicle_strain_pressure: [
    'Arac yuku kontrol edilmezse bakim maliyeti artar.',
    'Rota baskisi birikirse filo daralir.',
    'Gec mudahale operasyon alanini kisaltir.',
  ],
  safe_watch: [
    'Asiri pasiflik sinyali kacirmana yol acabilir.',
    'Tamamen bekleme de kucuk risk biriktirebilir.',
    'Izleme notu alinmazsa yarin okuma zorlasir.',
  ],
  fallback: [
    'Veri sinirliyken agresif secim riskli olabilir.',
    'Net sinyal gelmeden buyuk hamle maliyetli.',
    'Acele karar dusuk veriyle yaniltici olabilir.',
  ],
};
