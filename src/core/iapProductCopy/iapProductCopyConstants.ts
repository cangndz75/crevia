import type {
  IapProductCopyItem,
  IapProductCopyItemStatus,
  IapProductCopyOfferScreenCopy,
  IapProductCopyPurchaseStateCopy,
  IapProductCopyRestoreCopy,
  IapProductCopyReviewNotes,
  IapProductCopyTrustChecklistItem,
} from './iapProductCopyTypes';

export const IAP_PRODUCT_COPY_PACK_ID = 'crevia_iap_product_copy_v1';

export const IAP_PRODUCT_COPY_DOCS_PATH = 'docs/crevia-iap-product-copy-trust-review.md';

export const IAP_PRODUCT_COPY_MIN_BENEFIT_BULLETS = 5;

export const IAP_PRODUCT_COPY_POSITIONING_TR =
  'Ana Operasyon erişimi, pilot sonrası Crevia’daki şehir kapsamını genişletir ve sezon akışını sürdürür. Satın alma, daha geniş operasyon deneyimi içindir; karar başarısı veya skor garantisi vermez.';

export const IAP_PRODUCT_COPY_POSITIONING_EN =
  'Main Operation access expands the city scope after the pilot and continues the season flow. It unlocks a broader operation experience, not guaranteed success or score advantage.';

export const IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR = [
  'Ana Operasyon Erişimi',
  'Crevia Ana Operasyon',
  'Ana Operasyon Sezon Erişimi',
] as const;

export const IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN = [
  'Main Operation Access',
  'Crevia Main Operation',
  'Main Operation Season Access',
] as const;

export const IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR = [
  'Pilot operasyon sonrası daha geniş mahalle kapsamı, ana operasyon akışı ve sezon ilerleyişine erişim sağlar.',
  'Pilot haftayı tamamladıktan sonra şehir kapsamını genişleten tek seferlik Ana Operasyon erişimi.',
] as const;

export const IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN = [
  'Unlocks the broader city scope, main operation flow and season progression after the pilot.',
  'One-time Main Operation access that expands city scope after you complete the pilot week.',
] as const;

export const IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_TR = [
  'Ana Operasyon Seni Bekliyor',
  'Şehir Kapsamı Genişliyor',
  'Pilot Bitti, Ana Operasyon Başlıyor',
] as const;

export const IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_EN = [
  'The Main Operation Awaits',
  'The City Scope Expands',
  'The Pilot Ends. The Main Operation Begins.',
] as const;

export const IAP_PRODUCT_COPY_OFFER_SUBTITLE_TR =
  'Pilot sonrası Crevia’da daha geniş mahalle kapsamı, yeni operasyon ritmi ve uzun vadeli şehir takibi açılır.';

export const IAP_PRODUCT_COPY_OFFER_SUBTITLE_EN =
  'After the pilot, Crevia opens a broader neighborhood scope, a deeper operation rhythm and long-term city tracking.';

export const IAP_PRODUCT_COPY_BENEFIT_BULLETS_TR = [
  'Pilot sonrası ana operasyon akışı',
  'Daha geniş mahalle kapsamı',
  'Şehir hafızası ve gün sonu raporlarıyla devam hissi',
  'Ece’nin daha stratejik operasyon yorumları',
  'Harita, kaynak ve sosyal nabız sinyallerinin büyüyen etkisi',
] as const;

export const IAP_PRODUCT_COPY_BENEFIT_BULLETS_EN = [
  'Main operation flow after the pilot',
  'Broader neighborhood scope',
  'City memory and end-of-day continuity',
  'More strategic Ece advisor notes',
  'Expanding map, resource and social pulse signals',
] as const;

export const IAP_PRODUCT_COPY_RESTORE: IapProductCopyRestoreCopy = {
  ctaTR: 'Satın almanı geri yükle',
  ctaEN: 'Restore purchase',
  helperTR: 'Daha önce yaptıysan erişimini geri yükleyebilirsin.',
  helperEN: 'If you already purchased access, you can restore it.',
  accountNoteTR: 'Geri yükleme işlemi Apple/Google hesabındaki satın alma durumuna göre kontrol edilir.',
  accountNoteEN: 'Restore checks the purchase status linked to your Apple or Google account.',
};

export const IAP_PRODUCT_COPY_PURCHASE_STATES: IapProductCopyPurchaseStateCopy = {
  successTR: [
    'Ana Operasyon erişimi etkin.',
    'Şehir kapsamı genişledi. Ana operasyona geçebilirsin.',
  ],
  successEN: [
    'Main Operation access is active.',
    'The city scope has expanded. You can continue into the main operation.',
  ],
  cancelledTR: ['Satın alma tamamlanmadı.', 'İstersen pilot akışına devam edebilirsin.'],
  cancelledEN: ['Purchase was not completed.', 'You can continue the pilot flow.'],
  failedTR: [
    'Satın alma doğrulanamadı.',
    'Bağlantını ve mağaza hesabını kontrol edip tekrar deneyebilirsin.',
  ],
  failedEN: [
    'Purchase could not be verified.',
    'Check your connection and store account, then try again.',
  ],
};

export const IAP_PRODUCT_COPY_REVIEW_NOTES: IapProductCopyReviewNotes = {
  tr: `IAP inceleme notları (Crevia — Ana Operasyon erişimi)

• Ürün kurulumu: [APP_STORE_PRODUCT_ID_PENDING] / [PLAY_PRODUCT_ID_PENDING]
• RevenueCat entitlement: [REVENUECAT_ENTITLEMENT_PENDING]
• Sandbox test hesabı: [SANDBOX_TEST_ACCOUNT_PENDING — TODO, uydurma hesap yok]
• Gün 8 erişim yöntemi: [REVIEWER_DAY8_ACCESS_METHOD_PENDING]

Bu IAP, pilot sonrası Ana Operasyon erişimini açar. Rekabetçi avantaj veya garantili sonuç vaat etmez.
Geri yükleme akışı mevcuttur. Ödeme Apple/Google tarafından işlenir; RevenueCat entitlement durumunu yönetebilir.
Pilot hafta satın alma olmadan tamamlanabilir.`,
  en: `IAP review notes (Crevia — Main Operation access)

• Product setup: [APP_STORE_PRODUCT_ID_PENDING] / [PLAY_PRODUCT_ID_PENDING]
• RevenueCat entitlement: [REVENUECAT_ENTITLEMENT_PENDING]
• Sandbox test account: [SANDBOX_TEST_ACCOUNT_PENDING — TODO, no fabricated credentials]
• Day 8 access method: [REVIEWER_DAY8_ACCESS_METHOD_PENDING]

This IAP unlocks Main Operation access after the pilot. It does not provide competitive advantage or guaranteed outcomes.
Restore flow is available. Payment is handled by Apple/Google; RevenueCat may manage entitlement state.
The pilot week can be completed without purchasing.`,
};

export const IAP_PRODUCT_COPY_FALSE_PRESSURE_PHRASES = [
  'kaçırma',
  'son şans',
  'hemen al yoksa',
  'premium kilitli',
  'kazanmak için satın al',
  'başarı garantisi',
  'skor avantajı',
  'sınırsız ödül',
  'gizli ücret',
  'gerçek para ödülü',
  'buy to win',
  'unlock premium',
  'limited time only',
  'last chance',
  'miss out',
  'guaranteed win',
  'score advantage',
  'crypto',
  'nft',
  'resmi belediye',
  'official municipality',
  'yapay zeka',
  'ai powered',
  'bugün almazsan',
  'oyun kilitli',
  'game locked',
] as const;

export const IAP_PRODUCT_COPY_TRUST_CHECKLIST: IapProductCopyTrustChecklistItem[] = [
  { id: 'value_clear', rule: 'What is purchased is clearly stated.', status: 'required' },
  { id: 'no_guarantee', rule: 'No success/score guarantee is claimed.', status: 'required' },
  { id: 'restore_visible', rule: 'Restore access is visible in copy.', status: 'required' },
  { id: 'terms_privacy', rule: 'Terms/privacy link area documented — not hardcoded price.', status: 'documented' },
  { id: 'no_price_hardcode', rule: 'Price comes from store — never hardcoded in copy pack.', status: 'required' },
  { id: 'no_product_id_ui', rule: 'Product ID must not appear in player-facing UI copy.', status: 'required' },
  { id: 'calm_failure', rule: 'Purchase failed/cancelled states use calm copy.', status: 'required' },
  { id: 'limited_mode', rule: 'Limited/light mode language does not contradict offer copy.', status: 'required' },
  { id: 'no_blame', rule: 'No blaming or rushing language toward the player.', status: 'required' },
  { id: 'no_fomo', rule: 'No “buy today or miss out” pressure.', status: 'required' },
];

export const IAP_PRODUCT_COPY_OFFER_SCREEN: IapProductCopyOfferScreenCopy = {
  titleOptionsTR: [...IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_TR],
  titleOptionsEN: [...IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_EN],
  subtitleTR: IAP_PRODUCT_COPY_OFFER_SUBTITLE_TR,
  subtitleEN: IAP_PRODUCT_COPY_OFFER_SUBTITLE_EN,
};

function item(
  partial: Omit<IapProductCopyItem, 'status'> & { status?: IapProductCopyItemStatus },
): IapProductCopyItem {
  return {
    ...partial,
    status: partial.status ?? 'ready_for_review',
  };
}

export const IAP_PRODUCT_COPY_ITEMS_TEMPLATE: IapProductCopyItem[] = [
  ...IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_TR.map((text, i) =>
    item({
      id: `ipc_name_tr_${i + 1}`,
      locale: 'tr',
      target: 'app_store_product_name',
      text,
      tone: 'clear value',
      claimRisk: 'low',
      requiresManualStoreCheck: true,
    }),
  ),
  ...IAP_PRODUCT_COPY_PRODUCT_NAME_OPTIONS_EN.map((text, i) =>
    item({
      id: `ipc_name_en_${i + 1}`,
      locale: 'en',
      target: 'app_store_product_name',
      text,
      tone: 'clear value',
      claimRisk: 'low',
      requiresManualStoreCheck: true,
    }),
  ),
  ...IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_TR.map((text, i) =>
    item({
      id: `ipc_desc_tr_${i + 1}`,
      locale: 'tr',
      target: 'app_store_product_description',
      text,
      tone: 'transparent',
      claimRisk: 'low',
      requiresManualStoreCheck: true,
    }),
  ),
  ...IAP_PRODUCT_COPY_PRODUCT_DESCRIPTION_OPTIONS_EN.map((text, i) =>
    item({
      id: `ipc_desc_en_${i + 1}`,
      locale: 'en',
      target: 'play_product_description',
      text,
      tone: 'transparent',
      claimRisk: 'low',
      requiresManualStoreCheck: true,
    }),
  ),
  ...IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_TR.map((text, i) =>
    item({
      id: `ipc_offer_title_tr_${i + 1}`,
      locale: 'tr',
      target: 'paywall_title',
      text,
      tone: 'inviting calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_OFFER_TITLE_OPTIONS_EN.map((text, i) =>
    item({
      id: `ipc_offer_title_en_${i + 1}`,
      locale: 'en',
      target: 'paywall_title',
      text,
      tone: 'inviting calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  item({
    id: 'ipc_offer_subtitle_tr',
    locale: 'tr',
    target: 'paywall_subtitle',
    text: IAP_PRODUCT_COPY_OFFER_SUBTITLE_TR,
    tone: 'transparent',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  item({
    id: 'ipc_offer_subtitle_en',
    locale: 'en',
    target: 'paywall_subtitle',
    text: IAP_PRODUCT_COPY_OFFER_SUBTITLE_EN,
    tone: 'transparent',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  ...IAP_PRODUCT_COPY_BENEFIT_BULLETS_TR.map((text, i) =>
    item({
      id: `ipc_bullet_tr_${i + 1}`,
      locale: 'tr',
      target: 'benefit_bullet',
      text,
      tone: 'player benefit',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_BENEFIT_BULLETS_EN.map((text, i) =>
    item({
      id: `ipc_bullet_en_${i + 1}`,
      locale: 'en',
      target: 'benefit_bullet',
      text,
      tone: 'player benefit',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  item({
    id: 'ipc_restore_cta_tr',
    locale: 'tr',
    target: 'restore_copy',
    text: IAP_PRODUCT_COPY_RESTORE.ctaTR,
    tone: 'neutral',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  item({
    id: 'ipc_restore_cta_en',
    locale: 'en',
    target: 'restore_copy',
    text: IAP_PRODUCT_COPY_RESTORE.ctaEN,
    tone: 'neutral',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  item({
    id: 'ipc_restore_helper_tr',
    locale: 'tr',
    target: 'restore_copy',
    text: IAP_PRODUCT_COPY_RESTORE.helperTR,
    tone: 'helpful',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  item({
    id: 'ipc_restore_helper_en',
    locale: 'en',
    target: 'restore_copy',
    text: IAP_PRODUCT_COPY_RESTORE.helperEN,
    tone: 'helpful',
    claimRisk: 'low',
    requiresManualStoreCheck: false,
  }),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.successTR.map((text, i) =>
    item({
      id: `ipc_success_tr_${i + 1}`,
      locale: 'tr',
      target: 'purchase_success',
      text,
      tone: 'positive calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.successEN.map((text, i) =>
    item({
      id: `ipc_success_en_${i + 1}`,
      locale: 'en',
      target: 'purchase_success',
      text,
      tone: 'positive calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.cancelledTR.map((text, i) =>
    item({
      id: `ipc_cancelled_tr_${i + 1}`,
      locale: 'tr',
      target: 'purchase_cancelled',
      text,
      tone: 'neutral',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.cancelledEN.map((text, i) =>
    item({
      id: `ipc_cancelled_en_${i + 1}`,
      locale: 'en',
      target: 'purchase_cancelled',
      text,
      tone: 'neutral',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.failedTR.map((text, i) =>
    item({
      id: `ipc_failed_tr_${i + 1}`,
      locale: 'tr',
      target: 'purchase_failed',
      text,
      tone: 'helpful calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  ...IAP_PRODUCT_COPY_PURCHASE_STATES.failedEN.map((text, i) =>
    item({
      id: `ipc_failed_en_${i + 1}`,
      locale: 'en',
      target: 'purchase_failed',
      text,
      tone: 'helpful calm',
      claimRisk: 'low',
      requiresManualStoreCheck: false,
    }),
  ),
  item({
    id: 'ipc_review_tr',
    locale: 'tr',
    target: 'review_note',
    text: IAP_PRODUCT_COPY_REVIEW_NOTES.tr,
    tone: 'reviewer clarity',
    claimRisk: 'medium',
    requiresManualStoreCheck: true,
  }),
  item({
    id: 'ipc_review_en',
    locale: 'en',
    target: 'review_note',
    text: IAP_PRODUCT_COPY_REVIEW_NOTES.en,
    tone: 'reviewer clarity',
    claimRisk: 'medium',
    requiresManualStoreCheck: true,
  }),
];
