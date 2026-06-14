import type {
  DistrictCriterionId,
  DistrictPersonalityLineKind,
} from './districtPersonalityTypes';
import { selectDistrictPersonalityMapCopy } from '@/core/mapSignalCopy/mapSignalCopyPresentation';

export const DISTRICT_PERSONALITY_CONTENT_LINES: Record<
  DistrictCriterionId,
  Partial<Record<DistrictPersonalityLineKind, string[]>>
> = {
  social_sensitivity: {
    map_signal: ['Bu bolgede sosyal nabiz karar tonunu daha onemli hale getirir.'],
    ece_hint: ['Burada gorunur hizmet kadar sakin ton da onemli.'],
    event_plan: ['Hizli mudahale tepkiyi yatistirabilir ama kaynak baskisini artirabilir.'],
    retention_hook: ['Yarin bu bolgede nabzi tekrar kontrol etmek iyi olur.'],
  },
  route_difficulty: {
    map_signal: ['Bu bolgede rota karari operasyon suresini belirleyebilir.'],
    ece_hint: ['Arac ve ekip secimi burada daha onemli.'],
    event_plan: ['Hizli cozum zaman kazandirir ama rota baskisi yaratabilir.'],
    retention_hook: ['Yarin rota hattini kisa bir kontrolle izlemek iyi olur.'],
  },
  container_density: {
    map_signal: ['Konteyner agi bu bolgede daha yogun calisiyor.'],
    ece_hint: ['Tek noktayi degil, hattin tamamini dusunmek gerekebilir.'],
    event_plan: ['Kalici cozum ileride cevre baskisini azaltabilir.'],
    retention_hook: ['Yarin konteyner hattini tekrar okumak faydali olabilir.'],
  },
  trust_fragility: {
    map_signal: ['Bu bolgede guven etkisi daha hassas okunur.'],
    ece_hint: ['Kararin tonu burada sonucu buyutebilir.'],
    event_plan: ['Dengeli plan guven etkisini daha guvenli tasiyabilir.'],
    retention_hook: ['Yarin guven etkisini tekrar yoklamak iyi olur.'],
  },
  recovery_potential: {
    map_signal: ['Bu bolgede toparlanma firsati var.'],
    ece_hint: ['Dogru hamle hizli bir iyilesme yaratabilir.'],
    event_plan: ['Kalici hamle bu bolgede olumlu etkiyi buyutebilir.'],
    retention_hook: ['Yarin bu bolgeyi takip etmek olumlu sonuc verebilir.'],
  },
  neglect_risk: {
    map_signal: ['Bu bolge uzun sure beklerse baski birikebilir.'],
    ece_hint: ['Bugun ertelemek yarina daha pahali donebilir.'],
    event_plan: ['Kucuk takip hamlesi birikmeyi yavaslatabilir.'],
    retention_hook: ['Yarin ilk kontrol edilecek adaylardan biri.'],
  },
  maintenance_exposure: {
    map_signal: ['Arac ve bakim karari burada daha belirleyici.'],
    ece_hint: ['Araci zorlamak sonraki rotayi etkileyebilir.'],
    event_plan: ['Kalici veya dengeli plan bakim riskini yumusatabilir.'],
    retention_hook: ['Yarin arac ve ekip yorgunlugunu tekrar kontrol etmek iyi olur.'],
  },
  operation_history_weight: {
    map_signal: ['Gecmis kararlar bu bolgede daha gorunur iz birakabilir.'],
    ece_hint: ['Burada verilen kararlar sonraki gunlerde daha kolay hatirlanir.'],
    report_note: ['Bu bolge sehir hafizasinda takip edilmeye uygun.'],
    retention_hook: ['Yarin onceki karar izini yeniden okumak iyi olur.'],
  },
  public_visibility: {
    map_signal: ['Operasyon sonucu bu bolgede daha hizli fark edilebilir.'],
    ece_hint: ['Gorunur hizmet burada oyuncuya daha net geri doner.'],
    event_plan: ['Plan secimi kamu algisina daha hizli yansiyabilir.'],
    retention_hook: ['Yarin gorunur etkiyi kisa bir notla izlemek iyi olur.'],
  },
  resource_dependency: {
    map_signal: ['Bu bolgede kaynak secimi sonucu daha cok belirler.'],
    ece_hint: ['Ekip, arac ve kapasiteyi birlikte dusunmek gerekebilir.'],
    event_plan: ['Dengeli kaynak plani sonraki baskiyi azaltabilir.'],
    retention_hook: ['Yarin kaynak yukunu tekrar kontrol etmek iyi olur.'],
  },
};

export const DISTRICT_PERSONALITY_FALLBACK_LINES: Record<
  DistrictPersonalityLineKind,
  string
> = {
  map_signal: 'Bu bolge guvenli genel operasyon baglami verir.',
  ece_hint: 'Veri sinirli; dengeli plan en guvenli okuma.',
  event_inspect: 'Bolge icin guvenli genel baglam kullaniliyor.',
  event_plan: 'Kesin baski iddiasi olmadan dengeli plan onerilir.',
  report_note: 'Bolge etkisi genel operasyon notu olarak izlenebilir.',
  retention_hook: 'Yarin bu bolge genel kontrol listesinde kalabilir.',
  authority_teaser: 'Daha fazla yetki bu bolge baglamini netlestirebilir.',
  fallback: 'Guvenli bolge ozeti kullaniliyor.',
};

export function getDistrictPersonalityLine(
  criterionId: DistrictCriterionId,
  kind: DistrictPersonalityLineKind,
  options?: { day?: number; sourceIds?: string[]; recentTemplateIds?: string[] },
): string {
  if (options?.day && options.day >= 2) {
    const selected = selectDistrictPersonalityMapCopy(criterionId, kind, {
      day: options.day,
      sourceIds: [...(options.sourceIds ?? []), `district:${criterionId}`],
      recentTemplateIds: options.recentTemplateIds,
    });
    if (!selected.isFallback) {
      return selected.text;
    }
  }
  return (
    DISTRICT_PERSONALITY_CONTENT_LINES[criterionId][kind]?.[0] ??
    DISTRICT_PERSONALITY_FALLBACK_LINES[kind]
  );
}
