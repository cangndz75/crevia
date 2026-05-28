import type {
  PodiumAvatarPosition,
  PodiumSlotKey,
} from "./leaderboardPodiumTypes";

/** Kaynak görsel: assets/images/leaderboard/podium-frame.png (1448×1086). */
export const PODIUM_FRAME_ASPECT_RATIO = 1448 / 1086;

export const PODIUM_FRAME_SOURCE = require("@/assets/images/leaderboard/podium-frame.png");

/**
 * PNG (1448×1086) şeffaf daire merkezleri — düzeltilmiş kalibrasyon.
 * Altın (1.) tam merkeze ve aşağı; gümüş (2.) ve bronz (3.) dışa ve aşağı.
 */
export const PODIUM_AVATAR_POSITIONS: Record<
  PodiumSlotKey,
  PodiumAvatarPosition
> = {
  /** Orta — tam merkezde, çerçeve ortasına hizalı */
  first: { centerX: 0.5, centerY: 0.375, size: 0.178 },
  /** Sol — gümüş çerçeve merkezi */
  second: { centerX: 0.22, centerY: 0.528, size: 0.178 },
  /** Sağ — bronz çerçeve merkezi (2. ile simetrik) */
  third: { centerX: 0.78, centerY: 0.528, size: 0.178 },
};

/** Alt metin sırası: sol 2. — orta 1. — sağ 3. */
export const PODIUM_CAPTION_SLOT_ORDER: PodiumSlotKey[] = [
  "second",
  "first",
  "third",
];

export const PODIUM_SLOT_TO_RANK: Record<PodiumSlotKey, 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
};
