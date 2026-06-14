import type { EceStrategyLineKind, EceStrategyTone } from './eceStrategyLineTypes';
import { ECE_STRATEGY_LINE_CONTENT_PACK_EXPANSION } from './eceStrategyLineContentPackExpansion';

export type EceStrategyContentLine = {
  id: string;
  kind: EceStrategyLineKind;
  tone: EceStrategyTone;
  text: string;
};

const ECE_STRATEGY_LINE_CONTENT_PACK_BASE: EceStrategyContentLine[] = [
  {
    id: 'strategy-hub-1',
    kind: 'hub_strategy_hint',
    tone: 'strategic',
    text: 'Bugunku en net sinyal, tek hamleyle fazla alani sakinlestirebilecegin yeri gosteriyor.',
  },
  {
    id: 'strategy-hub-2',
    kind: 'hub_strategy_hint',
    tone: 'calm',
    text: 'Once baskiyi okumak, sonra operasyonu secmek bugun daha temiz sonuc verir.',
  },
  {
    id: 'strategy-hub-3',
    kind: 'hub_strategy_hint',
    tone: 'mentor',
    text: 'Her iyi hamle buyuk olmak zorunda degil; dogru yerde yapilan kucuk secim yeter.',
  },
  {
    id: 'strategy-hub-4',
    kind: 'hub_strategy_hint',
    tone: 'strategic',
    text: 'Merkezdeki tablo netlesmeden kaynak harcamak yerine bir sinyali takip edelim.',
  },
  {
    id: 'portfolio-1',
    kind: 'portfolio_tradeoff',
    tone: 'strategic',
    text: 'Bugun secmedigin isler de hafizada kalir; portfoy dengesi yarinin baskisini belirler.',
  },
  {
    id: 'portfolio-2',
    kind: 'portfolio_tradeoff',
    tone: 'cautious',
    text: 'Ayni anda her seyi cozmek yerine, ertelenen riski gorunur tutmak daha saglam.',
  },
  {
    id: 'portfolio-3',
    kind: 'portfolio_tradeoff',
    tone: 'mentor',
    text: 'Portfoyde iyi karar, sadece secileni degil beklemeye alinani da acik tutar.',
  },
  {
    id: 'portfolio-4',
    kind: 'portfolio_tradeoff',
    tone: 'strategic',
    text: 'Bu plan kaynaklari dagitmiyor; sonraki hamle icin okunabilir bir iz birakiyor.',
  },
  {
    id: 'defer-1',
    kind: 'defer_follow_up',
    tone: 'cautious',
    text: 'Erteledigimiz sinyal kapanmadi; sadece daha dogru zamanda bakilmak uzere bekliyor.',
  },
  {
    id: 'defer-2',
    kind: 'defer_follow_up',
    tone: 'strategic',
    text: 'Bugun dokunmadigin baski, yarin plan yaparken ilk kontrol edecegimiz yer olabilir.',
  },
  {
    id: 'defer-3',
    kind: 'defer_follow_up',
    tone: 'mentor',
    text: 'Ertelemek vazgecmek degil; izini kaybetmeden siraya almak daha iyi bir tercih.',
  },
  {
    id: 'defer-4',
    kind: 'defer_follow_up',
    tone: 'warning',
    text: 'Bu takip notunu saklayalim; ayni baski buyurse once oraya donecegiz.',
  },
  {
    id: 'retention-1',
    kind: 'one_more_day_hook',
    tone: 'positive',
    text: 'Bugunku iz temiz; yarin tek bir devam hamlesiyle etkisini buyutebiliriz.',
  },
  {
    id: 'retention-2',
    kind: 'one_more_day_hook',
    tone: 'strategic',
    text: 'Bir gun daha ilerlemek, bugunku kararlarin gercek sonucunu okumamizi saglar.',
  },
  {
    id: 'retention-3',
    kind: 'one_more_day_hook',
    tone: 'mentor',
    text: 'Devam edersen, bugunku secimin hangi mahallede yankilandigini birlikte gorecegiz.',
  },
  {
    id: 'retention-4',
    kind: 'one_more_day_hook',
    tone: 'calm',
    text: 'Bugunu kapatalim; sonraki adim icin yeterince net bir iz biraktin.',
  },
  {
    id: 'authority-1',
    kind: 'authority_benefit',
    tone: 'positive',
    text: 'Yeni yetki sadece guc degil; daha az kaynakla daha net karar alma alani aciyor.',
  },
  {
    id: 'authority-2',
    kind: 'authority_benefit',
    tone: 'strategic',
    text: 'Bu yetkiyi dogru anda kullanmak, bugunku baskiyi daha sessiz cozer.',
  },
  {
    id: 'authority-3',
    kind: 'authority_benefit',
    tone: 'mentor',
    text: 'Yetki arttikca kararlar da buyur; once etkiyi, sonra maliyeti okuyalim.',
  },
  {
    id: 'authority-4',
    kind: 'authority_benefit',
    tone: 'calm',
    text: 'Acik yetki var, ama acele etmeyelim; en uygun hamleyi sinyal belirlesin.',
  },
  {
    id: 'memory-1',
    kind: 'district_memory',
    tone: 'mentor',
    text: 'Bu bolge gecen karari unutmadi; ayni yerde daha ince bir hamle isimize yarar.',
  },
  {
    id: 'memory-2',
    kind: 'district_memory',
    tone: 'calm',
    text: 'Sehir hafizasi net bir ipucu veriyor; once eski izin bugunku etkisini okuyalim.',
  },
  {
    id: 'memory-3',
    kind: 'district_memory',
    tone: 'strategic',
    text: 'Gecmis secimlerin izi bugunku tabloya baglaniyor; bu bag kopmadan hareket edelim.',
  },
  {
    id: 'memory-4',
    kind: 'district_memory',
    tone: 'positive',
    text: 'Mahalle ayni duzeni gorunce daha hizli toparlanir; bu hafizayi avantaja cevirelim.',
  },
  {
    id: 'consequence-1',
    kind: 'decision_consequence',
    tone: 'strategic',
    text: 'Onceki karar iz birakti; bugunku secim o izi ya guclendirir ya da yumusatir.',
  },
  {
    id: 'consequence-2',
    kind: 'decision_consequence',
    tone: 'cautious',
    text: 'Bu etki tek gunde kapanmaz; simdi daha sakin bir takip hamlesi gerekir.',
  },
  {
    id: 'consequence-3',
    kind: 'decision_consequence',
    tone: 'mentor',
    text: 'Karar zincirini goruyorsun; Ece icin iyi strateji tam da bu baglantiyi okumak.',
  },
  {
    id: 'consequence-4',
    kind: 'decision_consequence',
    tone: 'positive',
    text: 'Dunku hamle bugun ise yariyor; ayni hatta kucuk bir devam etkisi buyutebilir.',
  },
  {
    id: 'map-1',
    kind: 'map_priority',
    tone: 'strategic',
    text: 'Haritadaki yogunluk tek noktada toplanmis; once orayi sakinlestirmek daha verimli.',
  },
  {
    id: 'map-2',
    kind: 'map_priority',
    tone: 'cautious',
    text: 'Rota baskisi dagilmadan kaynaklari yormayalim; en yakin net sinyale odaklanalim.',
  },
  {
    id: 'map-3',
    kind: 'map_priority',
    tone: 'mentor',
    text: 'Harita sadece yer gostermez; hangi karar gec kalmadan alinmali onu da anlatir.',
  },
  {
    id: 'map-4',
    kind: 'map_priority',
    tone: 'positive',
    text: 'Dogru rota secimi bugunku operasyonu kisaltir ve ekibi daha dengeli tutar.',
  },
  {
    id: 'resource-1',
    kind: 'resource_pressure',
    tone: 'warning',
    text: 'Kaynak baskisi artmadan once tek bir hedefe odaklanmak daha guvenli.',
  },
  {
    id: 'resource-2',
    kind: 'resource_pressure',
    tone: 'cautious',
    text: 'Ekip ve butce ayni anda yoruluyorsa, bugun daha kisa bir hamle secmeliyiz.',
  },
  {
    id: 'resource-3',
    kind: 'resource_pressure',
    tone: 'strategic',
    text: 'Kaynak sikisikligi dogru siralama ister; once en cok etki veren isi alalim.',
  },
  {
    id: 'resource-4',
    kind: 'resource_pressure',
    tone: 'mentor',
    text: 'Iyi yonetim bazen daha az is secip o isi eksiksiz bitirmektir.',
  },
  {
    id: 'style-1',
    kind: 'player_style_reflection',
    tone: 'mentor',
    text: 'Karar tarzinda sakin takip gucleniyor; bu ritmi bugunku plana da tasiyabiliriz.',
  },
  {
    id: 'style-2',
    kind: 'player_style_reflection',
    tone: 'positive',
    text: 'Son secimlerin acele etmeden okudugunu gosteriyor; bu sehir icin iyi bir aliskanlik.',
  },
  {
    id: 'style-3',
    kind: 'player_style_reflection',
    tone: 'strategic',
    text: 'Tarzin netlesiyor; once riski ayirip sonra etkiyi buyuten kararlar aliyorsun.',
  },
  {
    id: 'style-4',
    kind: 'player_style_reflection',
    tone: 'calm',
    text: 'Bu sakin karar ritmini korursan merkez daha okunabilir hale gelir.',
  },
];

export const ECE_STRATEGY_LINE_CONTENT_PACK: EceStrategyContentLine[] = [
  ...ECE_STRATEGY_LINE_CONTENT_PACK_BASE,
  ...ECE_STRATEGY_LINE_CONTENT_PACK_EXPANSION,
];
