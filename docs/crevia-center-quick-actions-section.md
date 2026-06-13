# Crevia — Merkez Hızlı İşlemler Bölümü

Hızlı İşlemler, ana hedef dışında güvenli kısayol navigasyonu sunar. Kaynak harcama veya upgrade yapmaz.

## Amaç

- Yardımcı giriş noktaları (operasyon, harita, rapor, yetki)
- Aktif hedefi gölgelemez
- Max 4 aksiyon, 2x2 grid

## Katalog / actionKey

| actionKey | Route | Not |
|-----------|-------|-----|
| `open_operations` | `/events` | Operasyon merkezi |
| `open_map` | `/risks` | Harita (MapScreen) |
| `open_report` | `/reports` | Raporlar |
| `open_authority` | `/profile` | Yetki / profil |
| `open_assignments` | — | Disabled teaser |
| `open_resources` | — | Disabled teaser (spend yok) |

## Max 4 kural

Sort skoru: ActiveTarget domain → OperationSignals → hubQuickAction kart durumu → katalog tabanı.

## Status

- **available** — route var, `enabled: true`
- **locked** — gün/yetki kısıtı
- **disabled** — route yok, teaser
- **completed** — (ileride) günlük tamamlanan aksiyon

## Day 1

4 kart: yalnızca Operasyonları Gör açık; diğerleri locked. `visibility: locked`.

## Motion

`CreviaAnimatedPressable`, önerilen aksiyonda statik accent. Sonsuz pulse yok.

## Dedupe

ActiveTarget CTA, Ece action, header notification ile aynı label kullanılmaz.

## Verify

```bash
npm run verify:center-quick-actions
```

## Sonraki prompt

**Önerilen Plan & Şehir Günlüğü Preview**
