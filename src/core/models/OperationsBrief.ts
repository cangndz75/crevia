export type OpsPulseStatus = 'steady' | 'watch' | 'hot';

/** Tek satır canlı operasyon hattı (Merkez ekranı). */
export type LiveOpsPulse = {
  id: string;
  status: OpsPulseStatus;
  headline: string;
  detail: string;
};

/** Strateji / danışman notu kutusu. */
export type AdvisorBrief = {
  eyebrow: string;
  body: string;
  attribution: string;
};

/** Merkez ekranı operasyon özeti (mock kaynaklı). */
export type OperationsBrief = {
  motto: string;
  livePulse: LiveOpsPulse[];
  advisor: AdvisorBrief;
};
