/** Yetki id → kullanıcıya görünen etiket (UI katmanı). */
export const AUTHORITY_LABELS: Record<string, string> = {
  assign_team: 'Ekip Ata',
  make_announcement: 'Duyuru Yap',
  create_route: 'Rota Oluştur',
  basic_risk_analysis: 'Basit Risk Analizi',
  start_maintenance: 'Bakım Başlat',
  view_vehicle_status: 'Araç Durumu Görüntüle',
  staff_calendar: 'Personel Takvimi',
  fixed_district_assignment: 'Sabit Bölge Atama',
  advisor_comment: 'Danışman Yorumu',
  social_media_statement: 'Sosyal Medya Açıklaması',
  permanent_solution: 'Kalıcı Çözüm',
  butterfly_tracking: 'Kelebek Etkisi Takibi',
};

export function formatAuthorityLabel(authorityId: string): string {
  return AUTHORITY_LABELS[authorityId] ?? authorityId.replace(/_/g, ' ');
}
