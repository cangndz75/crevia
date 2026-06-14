import type { CityMemoryVisibilityKind } from './cityMemoryVisibilityTypes';

export const CITY_MEMORY_VISIBILITY_COPY_EXPANSION: Partial<
  Record<CityMemoryVisibilityKind, string[]>
> = {
  decision_trace: [
    'Bu karar sehirde kucuk bir iz birakabilir.',
    'Sonuc sadece kapanis ekraninda kalmayabilir.',
    'Karar izi sonraki gunlerde tekrar okunabilir.',
  ],
  district_trace: [
    'Mahalle onceki kararlarla yeniden anlam kazaniyor.',
    'Bolge sinyali gecmis izlerle birlikte okunmali.',
    'Bu mahalledeki izler tek gunluk gorunmuyor.',
  ],
  story_chain_trace: [
    'Olay zinciri sehir hafizasinda ilerliyor.',
    'Ayni hikaye baska mahallede tekrar ses verebilir.',
    'Zincir sonraki gunlerde yeniden acilabilir.',
  ],
  carry_over_trace: [
    'Onceki kararin etkisi bugune tasinmis olabilir.',
    'Dunku secim bugunku onceligi etkiliyor.',
    'Bu iz kisa vadeli ama takip edilmeye deger.',
  ],
  butterfly_trace: [
    'Kucuk kararlar sehirde beklenmedik izler birakabilir.',
    'Etki dogrudan gorunmese de sonraki sinyalleri etkileyebilir.',
    'Sehir bazen kucuk kararlari daha sonra hatirlar.',
  ],
  report_memory_note: [
    'Rapor sehir hafizasindaki son izi ozetliyor.',
    'Bugunun sonucu kisa bir iz birakmis olabilir.',
    'Yarin bu izi tekrar okuyacagiz.',
  ],
  map_memory_hint: [
    'Haritadaki iz onceki kararin karsiligi.',
    'Bu nokta sadece konum degil, karar hafizasi tasiyor.',
    'Bolgeyi haritada tekrar okumak iyi olur.',
  ],
  hub_continuation_hint: [
    'Devam odagi sehir hafizasindaki en net izi takip ediyor.',
    'Bu izi okumak yarin kararini kolaylastirabilir.',
    'Sehir hafizasi yeni oncelik veriyor.',
  ],
  ece_memory_hint: [
    'Ece sehir hafizasindaki izi kisa notla hatirlatiyor.',
    'Bu iz bugunku kararlarla birlikte okunmali.',
    'Hafiza sakin ama takip edilmeye deger.',
  ],
  safe_summary: [
    'Sehir sinyalleri sakin; yeni izler raporda netlesecek.',
    'Hafiza sakin; aktif odaga devam et.',
    'Yeni kararlar sehir hafizasini zamanla sekillendirir.',
  ],
  fallback: [
    'Bugunku kararin etkisini raporda goreceksin.',
    'Sehir hafizasi ilk gunlerde sakin ilerler.',
    'Kararlarin izi zamanla daha net okunur.',
  ],
};
