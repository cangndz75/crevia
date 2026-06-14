import type { Day8OperationFeedBiasKind } from './day8OperationFeedBindingTypes';

export const DAY8_OPERATION_FEED_BINDING_COPY_EXPANSION: Partial<
  Record<Day8OperationFeedBiasKind, string[]>
> = {
  district_neglect_bias: [
    'Mahalle sinyali bugun bu adayi one tasiyor.',
    'Ertelenen bolge izi, listenin ust siralarina yakin duruyor.',
    'Gunun ritmi bu mahalleyi daha gorunur kiliyor.',
    'Bolge takibi bugun stratejik oneri olarak one cikiyor.',
    'Kisa mahalle kontrolu bu adayla uyumlu gorunuyor.',
  ],
  district_recovery_bias: [
    'Toparlanma firsati bu adayi daha degerli gosteriyor.',
    'Iyilesme penceresi listenin ust kisminda duruyor.',
    'Mahalle toparlanmasi bugun bu secenekte okunuyor.',
    'Olumlu donus sinyali bu adayi one cikariyor.',
    'Dusuk maliyetli iyilesme bu adayla uyumlu.',
  ],
  positive_comeback_bias: [
    'Olumlu donus penceresi bu adayi guclendiriyor.',
    'Kucuk kazanim firsati listenin ust sirasinda.',
    'Toparlanma ivmesi bu secenegi daha anlamli kiliyor.',
    'Sehir bugun iyiye giden bir iz gosteriyor; bu aday uyumlu.',
    'Firsat penceresi kapanmadan bu aday one cikiyor.',
  ],
  follow_up_bias: [
    'Dunku kararin takibi bu adayla uyumlu gorunuyor.',
    'Kucuk takip etkisi bu secenegi one tasiyor.',
    'Devam hamlesi bugun bu adayda okunuyor.',
    'Takip notu listenin ust kisminda bu secenegi isaretliyor.',
    'Dusuk maliyetli devam bu adayla eslesiyor.',
  ],
  memory_trace_bias: [
    'Sehir hafizasi bu bolgeyi yeniden gorunur yapti.',
    'Hafiza izi bu adayi bugun daha anlamli kiliyor.',
    'Gecmis karar yankisi listenin ust sirasinda duruyor.',
    'Eski iz bugunku oncelikle bu adayda bulusuyor.',
    'Karar hafizasi bu secenegi one cikariyor.',
  ],
  resource_pressure_bias: [
    'Kaynak baskisi bugun bu adayi one tasiyor.',
    'Kapasiteyi dogru yere koymak icin bu secenek one cikiyor.',
    'Kaynak dengesi listenin ust kisminda bu adayi isaretliyor.',
    'Butce ve ekip sinyali bu adayla uyumlu.',
    'Pahali gorunen yuk, bu adayda daha kontrollu okunuyor.',
  ],
  route_pressure_bias: [
    'Ertelenen rota baskisi bu adayi one tasiyor.',
    'Rota yuku bugun bu secenegi daha degerli gosteriyor.',
    'Ulasim sinyali listenin ust sirasinda bu adayi isaretliyor.',
    'Arac ve ekip hatti bu adayla uyumlu gorunuyor.',
    'Rota kontrolu bugun bu secenegi one cikariyor.',
  ],
  container_pressure_bias: [
    'Konteyner hatti baskisi bu adayi one tasiyor.',
    'Hat izleme ihtiyaci bu secenegi one cikariyor.',
    'Lojistik sinyali bugun bu adayda okunuyor.',
    'Cevre baskisi listenin ust kisminda bu adayi isaretliyor.',
    'Konteyner agi bu adayla uyumlu gorunuyor.',
  ],
  social_trust_bias: [
    'Guven hassasiyeti bu adayi bugun one cikariyor.',
    'Sosyal nabiz bu secenegi daha anlamli kiliyor.',
    'Gorunur takip ihtiyaci listenin ust sirasinda.',
    'Iletisim tonu bu adayla uyumlu gorunuyor.',
    'Mahalle guveni bugun bu secenegi one tasiyor.',
  ],
  defer_risk_bias: [
    'Ertelenen risk bu adayi one tasiyor.',
    'Yarin buyuyebilecek baski bu secenegi guclendiriyor.',
    'Erteleme maliyeti listenin ust sirasinda okunuyor.',
    'Pas gecilen sinyal bugun bu adayda gorunur.',
    'Yarin onceligi bu secenekle daha net hale gelebilir.',
  ],
  city_rhythm_bias: [
    'Gunun sehir ritmi bu adayi one cikariyor.',
    'Ritim dengesi bu secenegi daha anlamli kiliyor.',
    'Karisik gundem bugun bu adayda toplaniyor.',
    'Sehir nabzi listenin ust sirasinda bu secenegi isaretliyor.',
    'Gunun odagi bu adayla uyumlu gorunuyor.',
  ],
  safe_watch_bias: [
    'Sakin izleme gununde bu aday dengeli duruyor.',
    'Asiri zorlamadan bu secenek uyumlu gorunuyor.',
    'Dusuk baskili gunde bu aday yeterli izleme sunuyor.',
    'Kapasiteyi koruyan secenek listenin ust sirasinda.',
    'Guvenli tempo bugun bu adayla eslesiyor.',
  ],
  fallback: [
    'Mevcut sinyallere gore liste siralaniyor.',
    'Net oncelik henuz belirgin degil; sakin okuma yeterli.',
    'Ilk okuma tamamlaninca adaylar daha net siralanacak.',
    'Dusuk veriyle liste guvenli modda kuruluyor.',
    'Stratejik sinyal gelene kadar dengeli sirala.',
    'Bugun icin mevcut adaylar sinyal yogunluguna gore diziliyor.',
    'On secim yapmadan once tabloyu bir kez daha oku.',
  ],
};
