import type { BadgeDefinition, BadgeId } from './badgeTypes';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_step',
    title: 'İlk Saha İmzası',
    description: 'İlk günlük operasyonu tamamla.',
    category: 'operations',
    rarity: 'common',
    target: 1,
  },
  {
    id: 'steady_operator',
    title: 'İstikrarlı Operatör',
    description: '3 günü üst üste pozitif operasyon sonucu ile kapat.',
    category: 'consistency',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'public_listener',
    title: 'Halkın Sesi',
    description: 'Sosyal nabzı dengede tutan 3 günlük sonuç üret.',
    category: 'publicTrust',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'budget_guardian',
    title: 'Kaynak Disiplini',
    description: 'Bütçe dengesini bozmadan 3 günlük operasyon tamamla.',
    category: 'resources',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'team_caretaker',
    title: 'Ekip Dengesini Koruyan',
    description: 'Personel moralini koruyan 3 günlük sonuç üret.',
    category: 'personnel',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'crisis_cooler',
    title: 'Kriz Soğutucu',
    description: 'Kritik bir olayı büyümeden kapat.',
    category: 'crisis',
    rarity: 'rare',
    target: 1,
  },
  {
    id: 'route_mind',
    title: 'Rota Aklı',
    description: 'Araç veya rota etkisi olumlu olan 3 karar günü tamamla.',
    category: 'operations',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'container_watch',
    title: 'Konteyner Nöbetçisi',
    description: 'Konteyner riskini kontrol altında tutan 3 günlük sonuç üret.',
    category: 'operations',
    rarity: 'uncommon',
    target: 3,
  },
  {
    id: 'butterfly_handler',
    title: 'Kelebek Etkisini Yöneten',
    description: 'Bir follow-up / kelebek etkisi sonucunu başarıyla yönet.',
    category: 'crisis',
    rarity: 'rare',
    target: 1,
  },
  {
    id: 'authority_candidate',
    title: 'Terfi Adayı',
    description: 'Üst yönetim değerlendirmesinde terfi adaylığı oluştur.',
    category: 'authority',
    rarity: 'rare',
    target: 1,
  },
  {
    id: 'promoted_operator',
    title: 'Yeni Görevlendirme',
    description: 'Resmi yetki değerlendirmesinde yeni görevlendirme aç.',
    category: 'authority',
    rarity: 'epic',
    target: 1,
  },
  {
    id: 'pilot_finisher',
    title: 'Pilot Tamamlandı',
    description: '7 günlük pilot dönemi tamamla.',
    category: 'pilot',
    rarity: 'common',
    target: 1,
  },
];

export const BADGE_BY_ID: Record<BadgeId, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((badge) => [badge.id, badge]),
) as Record<BadgeId, BadgeDefinition>;

export const ALL_BADGE_IDS = BADGE_DEFINITIONS.map((badge) => badge.id);
