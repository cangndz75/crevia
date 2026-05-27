# Events assets (`assets/events/`)

Olaylar / Operasyon ekranı için pastel oyun illüstrasyonları.

## Klasörler

| Klasör | Kullanım |
|--------|----------|
| `odor/` | Koku şikayeti, muhtar baskısı |
| `waste/` | Konteyner, toplama gecikmesi |
| `routes/` | Rota gecikmesi, araç arızası |
| `market/` | Pazar kirliliği |
| `social/` | Sosyal baskı, kriz |
| `maintenance/` | Yol, araç bakım |
| `opportunity/` | Park yenileme, ekip toparlanması |
| `complaint/` | Esnaf / konteyner şikayetleri |
| `scenes/` | Öncelikli olay kartı sahne arka planı |
| `ui/` | Mahalle mini-harita thumb |

## Kod eşlemesi

`src/features/events/utils/eventAssets.ts` — pilot olay id, görsel tip ve mahalle eşlemesi.

## İsimlendirme

`ev_{konu}_{varyant}_{sürüm}.png` — örn. `ev_odor_complaint_signal_01.png`

Yeni görsel eklerken aynı stilde üret ve ilgili map kaydını `eventAssets.ts` içine ekle.
