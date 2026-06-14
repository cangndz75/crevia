# Crevia — Resource Pressure Balance Audit

## Audit amacı

Bu doküman, Crevia’daki kaynak baskısı, günlük kapasite maliyeti, operasyon portföyü çeşitliliği ve Day 8+ stratejik baskı eğrisinin **mevcut durumunu** değerlendirir. Hedef oyuncu hissi:

> *“Kaynaklar sınırlı ama oyun beni cezalandırmıyor; doğru okursam iyi öncelik verebilirim.”*

**Kapsam:** read-only audit ve planlama. Runtime, persist, SAVE_VERSION, applyDecision, day pipeline, balance sabitleri ve Hub/Map UI değiştirilmedi.

**Paralel pass’ler:** One More Day Retention Pass, Authority Gameplay Expansion (bu audit yalnızca öneri üretir; authority dosyalarına dokunulmadı).

---

## Mevcut resource pressure haritası

| Sistem | Baskı türü | Oyuncuya görünür mü? | Karar etkisi var mı? | Risk |
|--------|------------|----------------------|----------------------|------|
| **operationalResources** | Personel yorgunluğu, araç kapasitesi, konteyner ağı (runtime persist) | Kısmen — Hub sinyalleri, atama fazı, rapor | Evet — günlük plan ve atama sonuçları | Day 1–7 çarpanları düşük; post-pilot tam etki. Portföy maliyetine doğrudan bağlı değil |
| **dailyCapacityPortfolio** | 7 boyutlu presentation-only kapasite maliyeti + slot/defer | Evet — Hub Portfolio Surface Lite (max 3 kart) | Evet — “hangisini seçerim / erteleyeyim” tradeoff | Ana stratejik baskı taşıyıcısı; maliyet vektörleri kısmen örtüşüyor |
| **vehicleMaintenance** | Filo bakım ihtiyacı, rota yorgunluğu | Kısmen — maintenance_warning portföy item; yetkiyle preview | Evet — rota/araç maliyet boyutu | Team’den ayrışıyor; portföye yalnızca sinyal varsa girer |
| **teamSpecialization** | Ekip uzmanlığı, yorgunluk, moral | Kısmen — Hub team line; assignment_fit_preview | Evet — atama uyumu | Portföy adapter’ı yok; baskı dolaylı (personnel operation signal) |
| **containerNetwork** | Konteyner doluluk, temizlik, sosyal etki | Kısmen — container_pressure item; yetkiyle upgrade preview | Evet — resource + districtFocus maliyeti | container_pressure ≈ resource_pressure vektörü; ayrım metinle |
| **districtPersonality** | Baseline + live criterion → maliyet modifier | Özet — criterion high → portföy item | Evet — maliyet + item türü çeşitliliği | Yüksek baseline + modifier stack cezalandırıcı his riski (öz. Sanayi, İstasyon) |
| **eventVariety** | Event başına pressure hint → portföy kind | Plan/inspect copy | Orta — çeşitlilik katmanı | Tek pressure tekrarı dominant bucket riski |
| **mapGameplayBinding** | Harita rolü → önerilen item | Evet — map recommended (max 2) | Orta — yönlendirme | Kaynak guard iyi; harita olmadan da portföy doluyor |
| **report/tomorrow** | Yarın riski, defer binding | Kısmen — deferRiskLine; tomorrow_risk_preview yetkisi | Orta — erteleme motivasyonu | Yetki yoksa defer satırı sık gizlenir; “neden erteledim?” zayıf kalabilir |

**Genel güç:** Stratejik baskı **orta–güçlü** (Day 8+), ancak **presentation katmanında** yoğunlaşıyor; runtime kaynak motoru ile portföy maliyeti henüz tam senkron değil.

---

## Daily capacity cost diversity

### 12 item kind — base cost karakteri

| Item kind | Cost karakteri | İyi | Risk | Öneri |
|-----------|----------------|-----|------|-------|
| `active_operation` | Genel 1/1/1/1/0/1/0 | Her gün anlaşılır ana maliyet | Diğer pressure item’larla vektör örtüşmesi | Dominant boyutu event domain’e göre ayır (route event → vehicle+1) |
| `risk_signal` | **Sıfır maliyet** | İzleme baskısı yaratmaz | Tradeoff’a girmez; “ücretsiz gürültü” | Düşük followUp veya districtFocus ekle |
| `district_pressure` | Sosyal + bölge 1/1/0/1/1/1/0 | Trust/social ayrışıyor | social_pressure ile örtüşme | Trust yüksekken social item ile dedupe güçlendir |
| `resource_pressure` | Kaynak ağırlıklı 1/1/1/2/0/1/0 | Kaynak odaklı tradeoff | **container_pressure ile aynı vektör** | container → followUp veya social+0; resource → team ağırlığı |
| `route_pressure` | Araç ağırlıklı 1/1/2/1/0/1/0 | Rota tradeoff net | Sanayi+modifier ile vehicle=3 clamp | Clamp sonrası fark kaybolur; urgency ile status ayrımı |
| `social_pressure` | Sosyal ağırlıklı 1/1/0/1/2/1/0 | En net ayrışan vektör | Cumhuriyet baseline yüksek → sürekli sosyal | Recovery district’lerde social maliyet -1 (balance pass) |
| `container_pressure` | resource_pressure kopyası | Konteyner narratif ayrı | Oyuncu maliyet olarak ayırt edemez | resource+1 veya followUp+1 ile farklılaştır |
| `maintenance_warning` | Araç+takip 1/0/2/1/0/0/1 | Team’siz bakım hissi | Düşük urgency’de slot=0 — iyi | selectBenefitLine güçlendir |
| `memory_trace` | Düşük slot, takip 0/0/0/1/1/1/1 | Watch-only uygun | Karar baskısı zayıf | Bilinçli; retention hook olarak kalabilir |
| `recovery_opportunity` | Orta maliyet + followUp | Fırsat tonu pozitif badge | Risk item’ları kadar pahalı | operationSlots 0 veya team-1 teşvik pass’i |
| `positive_opportunity` | recovery’ye yakın, followUp yok | Daha hafif | selectBenefitLine zayıf kalabilir | opportunityValue high → slot maliyeti düşür |
| `follow_up_candidate` | Minimal slot, takip 1/0/0/1/0/1/1 | Erteleme alternatifi | Tek başına zayıf görünür | neglect_risk modifier ile urgency artışı iyi |

### Cost diversity skoru

- **Base vektör benzersizliği:** 10/12 = **%83** (analyzer PASS eşiği ≥70).
- **Örtüşen vektörler:** `container_pressure` = `resource_pressure`; `district_pressure` = `positive_opportunity`.
- **Senaryo çeşitliliği (Day 8 örnek):** görünür item’lar arasında **%75** farklı vektör.
- **Boyut kullanımı:** 7 boyuttan 6’sı aktif (`risk_signal` sıfır maliyet).
- **Modifier stack örneği:** route+maintenance+resource high → vehicle=3 (clamp), resource=2.

**Sonuç:** Maliyetler tamamen 1/1/1 değil; ancak **kaynak/konteyner örtüşmesi** ve **risk_signal sıfır maliyeti** diversity skorunu düşürüyor.

---

## District modifier audit

Modifierlar (`applyDistrictCostModifiers`):

| Criterion | Etki |
|-----------|------|
| social_sensitivity | social +1 |
| route_difficulty | vehicle +1 |
| container_density | resource +1 |
| trust_fragility | districtFocus +1, social +1 |
| recovery_potential | followUp +1 |
| neglect_risk | followUp +1 |
| maintenance_exposure | vehicle +1 |
| resource_dependency | resource +1 |

### Bulgular

| Soru | Değerlendirme |
|------|----------------|
| Aynı item’ları aşırı şişiriyor mu? | **Kısmen** — Sanayi’de route+maintenance aynı route_pressure item’ında vehicle+2 (clamp 3) |
| Bazı district’ler sürekli cezalandırıcı mı? | **Evet risk** — `sanayi`, `istasyon` yüksek route/maintenance baseline; `cumhuriyet` sosyal/trust |
| Baseline live pressure gibi mi? | **Hayır** — doc ile uyumlu; modifier yalnızca high criterion band |
| Recovery district maliyeti yumuşatıyor mu? | **Hayır** — recovery_potential followUp **artırıyor** (fırsat maliyeti) |
| Oyuncu district’ten kaçınır mı? | **Orta risk** — maliyet stack + tekrarlayan personality item’lar |

**Öneri:** Recovery/yesilvadi için `recovery_potential` → resource veya social **-1** (min 0) balance pass; trust_fragility çift modifier’ı yalnızca social_pressure’da uygula.

---

## Day curve audit

| Day band | Baskı seviyesi | Risk | Öneri |
|----------|----------------|------|-------|
| **Day 1** | tutorial — 1 slot, 2 item max, maliyet clamp | Düşük | İyi — cezalandırma yok |
| **Day 2–7** | pilot — 1 slot, 3 item, team/vehicle cap 2 | Düşük–orta | Pilot sonu (G7) strateji provası zayıf |
| **Day 8–9** | post_pilot_light — 2 slot, 4 item, strategic flag | **Sıçrama riski** | G7→G8: slot 1→2, görünür 3→4, team/vehicle 2→3 aynı gün |
| **Day 10+** | post_pilot_strategic — aynı slot, daha fazla kaynak | Orta–güçlü | Variety artıyor; low-data boş kalıyor |

### Day 8+ tradeoff

- 2 operasyon slotu + 3–4 görünür sinyal → **defer** üretimi çalışıyor (`hasStrategicPressure`).
- `assignStatuses`: slot dolunca urgency≠low → deferred.
- **Low-data Day 8:** `adaptFallbackWatchItem` yalnız Day 1 — **boş portföy** (WARN).

**Öneri:** G7 son gün “light strategic preview” veya Day 8 low-data soft fallback (watch_only risk, confidence low).

---

## Fairness audit

| Alan | Açıklama yeterli mi? | Oyuncu adil bulur mu? | Öneri |
|------|----------------------|------------------------|-------|
| Kapasite strip (7 entry) | Özet label + band | Kısmen — hangi item hangi boyutu tükettiği kartta | Kartta boyut breakdown (Hub polish) |
| Defer risk | Kaynak guard’lı copy | Yetki yoksa çoğu defer satırı gizli | Teaser: “Yarın etkisi olabilir” |
| Maliyet → karar bağlantısı | capacityLine kartta | Zayıf — “1 kaynak” ne demek belirsiz | Authority resource_pressure_summary |
| Ani ceza hissi | Presentation-only defer | Orta — runtime ceza yok ama copy sert olabilir | Defer copy yumuşatma pass |
| Recovery denge | Pozitif badge + Ece line | Orta — maliyet hâlâ yüksek | Opportunity cost reduction pass |
| District modifier görünürlüğü | Yok | Oyuncu neden pahalı bilmiyor | assignment_fit / district_trust preview |

**Genel fairness:** **Orta** — sistem adil tasarlanmış (fake source yok, permission guard var) ama **açıklama derinliği yetkiyle sınırlı**; yetkisiz oyuncu “neden sıkıştım?” sorusunda zorlanır.

---

## Dominant pressure risk

| Metrik | Değer |
|--------|-------|
| **Dominant pressure risk** | **medium** |
| **En baskın 3 pressure** | route_vehicle, resource_container, social_trust |
| **Eksik kalan pressure** | team specialization (doğrudan portföy yok), container ayrı maliyet, memory/follow-up tradeoff |
| **Önerilen pass** | Resource Pressure Cost Differentiation Pass + Team Signal Portfolio Adapter |

Route-heavy günlerde analyzer **>60% route_vehicle** WARN üretebilir. Social/container günleri daha dengeli.

---

## Positive / recovery balance

| Kontrol | Durum |
|---------|-------|
| recovery_opportunity çıkabiliyor mu? | **Evet** — personality + rewardComeback |
| positive_opportunity çıkabiliyor mu? | **Evet** — variety opportunity_window |
| Risk kadar değerli mi? | **Hayır** — benzer maliyet, selectBenefitLine sık generic |
| Oyuncu hep pas geçer mi? | **Orta risk** — 2 slot doluyken opportunity deferred |
| “Teşvik” hissi | Badge pozitif; maliyet nötr/negatif değil |

**Öneriler:**

1. Recovery item’larda `operationSlots: 0` (high opportunityValue hariç).
2. `selectBenefitLine` opportunity-specific copy pack.
3. Defer risk `opportunity_may_expire` — mevcut copy yeterli, dramatik değil.

---

## Authority explanation audit

| Permission | Açıklama avantajı | Eksik | Öneri |
|------------|-------------------|-------|-------|
| `resource_pressure_summary` | resource_pressure → detailed visibility | Boyut başına “neden” satırı yok | Authority Expansion: maliyet breakdown satırı |
| `assignment_fit_preview` | route/active_operation detailed | Team cost reason yok | Team fatigue → team boyutu açıklaması |
| `district_trust_preview` | trust/social detailed | Modifier kaynağı görünmez | Criterion teaser → “bu mahalle hassas” |
| `tomorrow_risk_preview` | deferRiskLine açılır | advisor_specialist_notes eşlemesi kafa karıştırıcı | Copy netleştirme (Authority pass) |
| `map_resource_layer` | map recommended detailed | Harita maliyet gerekçesi kısa | mapLine güçlendirme |
| `district_memory_trace_preview` | memory_trace detailed | — | Yeterli |
| `active_task_route` | DETAILED set’te | Portföy resolve’da sınırlı kullanım | Binding pass ile hizala |

**Coverage:** Yetkili senaryoda **2–3/3** permission detailed üretiyor; yetkisizde yalnızca summary — **tasarım gereği**.

---

## Analyzer / verify

### Script’ler

| Script | Komut |
|--------|-------|
| `scripts/analyze-resource-pressure-balance.ts` | `npm run analyze:resource-pressure-balance` |
| `scripts/verify-resource-pressure-balance.ts` | `npm run verify:resource-pressure-balance` |

### Analyzer senaryoları

Day 1, 3, 7, 8, 10, Route-heavy, Social-heavy, Container-heavy, Recovery opportunity, Low-data fallback.

### Çıktı metrikleri

- visible item count, cost diversity %, dominant pressure bucket %, opportunity ratio
- average cost by dimension, max cost item, district concentration
- fairness warnings, authority detailed coverage

### PASS/WARN kuralları

| Koşul | Sonuç |
|-------|-------|
| cost diversity low (base <70%) | WARN |
| all items risk / no opportunity | WARN |
| all costs same vector | WARN |
| one pressure bucket >60% | WARN |
| Day 8+ <3 items | WARN |
| low-data Day 8 empty | WARN |
| fake map source / negative cost | FAIL |

---

## Risk listesi

1. **container_pressure = resource_pressure** — oyuncu tradeoff okuyamaz.
2. **risk_signal sıfır maliyet** — portföy çeşitliliğini şişirir, seçim baskısı yaratmaz.
3. **Day 8 low-data boş portföy** — “her şeye yetişemem” yerine “hiç sinyal yok”.
4. **G7→G8 sıçrama** — slot ve kapasite limitleri aynı gün artıyor.
5. **District modifier stack** — Sanayi/İstasyon sürekli yüksek vehicle/resource.
6. **Recovery maliyeti** — fırsatlar risk item’ları kadar pahalı.
7. **Team specialization portföy dışı** — team boyutu çoğunlukla generic 1.
8. **Defer açıklaması yetkiye bağlı** — yetkisiz oyuncuda fairness zayıf.
9. **Portföy vs runtime ayrımı** — kapasite presentation-only; runtime sonuçla bağ kopuk hissi.

---

## Önerilen sonraki prompt’lar

| Öncelik | Prompt | Amaç |
|---------|--------|------|
| 1 | **Resource Pressure Cost Differentiation Pass** | container/resource/route/opportunity vektör ayrımı |
| 2 | **Day 8 Transition Softening Pass** | G7 preview + low-data fallback |
| 3 | **Opportunity Cost Incentive Pass** | recovery/positive maliyet + selectBenefitLine |
| 4 | **Team Signal Portfolio Adapter Pass** | team_specialization → portföy item |
| 5 | **District Modifier Fairness Pass** | recovery yumuşatma, stack cap |
| 6 | **Defer Explanation Teaser Pass** | yetkisiz oyuncu için yumuşak defer copy |
| 7 | **Authority Gameplay Expansion** (paralel) | maliyet breakdown satırları |

---

## İncelenen dosyalar

- `src/core/dailyCapacityPortfolio/*`
- `src/core/districtPersonality/*`
- `src/core/operationalResources/*`
- `src/core/vehicleMaintenance/*`
- `src/core/teamSpecialization/*`
- `src/core/containerNetwork/*`
- `src/core/eventVariety/*`
- `src/core/mapGameplayBinding/*`, `src/core/activeOperationMapBinding/*`
- `src/core/portfolioDeferRisk/*`
- `src/core/authority/*` (read-only)
- `src/core/postPilot/postPilotEventConstants.ts`
- `src/features/hub/utils/centerDailyCapacityPortfolioPresentation.ts`
- İlgili docs: daily-capacity-portfolio, district-personality, vehicle-maintenance, team-specialization, core-loop-boredom

## Eklenen çıktılar

- `docs/crevia-resource-pressure-balance-audit.md` (bu dosya)
- `scripts/analyze-resource-pressure-balance.ts`
- `scripts/verify-resource-pressure-balance.ts`
- `package.json`: `analyze:resource-pressure-balance`, `verify:resource-pressure-balance`

## Değişiklik özeti

| Alan | Değişti mi? |
|------|-------------|
| Runtime / balance sabitleri | **Hayır** |
| Persist / SAVE_VERSION | **Hayır** (verify: 26) |
| applyDecision / day pipeline | **Hayır** |
| Hub / Map / Report UI | **Hayır** |
| Authority implementation | **Hayır** |
