import Ionicons from '@expo/vector-icons/Ionicons';
import { Image as ExpoImage } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { LEADERBOARD_BG_SOURCE } from '@/features/leaderboard/utils/leaderboardAssets';
import {
  PODIUM_AVATAR_POSITIONS,
  PODIUM_CAPTION_SLOT_ORDER,
  PODIUM_FRAME_ASPECT_RATIO,
  PODIUM_FRAME_SOURCE,
} from '@/features/leaderboard/utils/leaderboardPodiumConstants';
import type { PodiumSlotKey, PodiumUser } from '@/features/leaderboard/utils/leaderboardPodiumTypes';
import {
  computePodiumAvatarLayout,
  getInitialsPalette,
  getNameInitials,
} from '@/features/leaderboard/utils/podiumAvatarHelpers';
import { formatLeaderboardScoreBpp } from '@/features/leaderboard/utils/leaderboardUiModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

export type { PodiumUser } from '@/features/leaderboard/utils/leaderboardPodiumTypes';

export type LeaderboardPodiumHeroProps = {
  topThree: PodiumUser[];
};

type StageLayout = {
  width: number;
  height: number;
};

function resolvePodiumUsers(topThree: PodiumUser[]): Record<PodiumSlotKey, PodiumUser> {
  const placeholder = (slot: PodiumSlotKey): PodiumUser => ({
    id: `podium-placeholder-${slot}`,
    name: 'Bekleniyor',
    title: '—',
    score: 0,
    districtName: '—',
    avatarUrl: null,
  });

  return {
    first: topThree[0] ?? placeholder('first'),
    second: topThree[1] ?? placeholder('second'),
    third: topThree[2] ?? placeholder('third'),
  };
}

function PodiumInitialsAvatar({
  user,
  size,
}: {
  user: PodiumUser;
  size: number;
}) {
  const palette = getInitialsPalette(user.id);
  const fontSize = Math.max(11, Math.round(size * 0.34));

  return (
    <View
      style={[
        styles.initialsRoot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
        },
      ]}>
      <Text style={[styles.initialsText, { color: palette.text, fontSize }]}>
        {getNameInitials(user.name)}
      </Text>
    </View>
  );
}

function PodiumAvatarImage({
  user,
  size,
}: {
  user: PodiumUser;
  size: number;
}) {
  const [uriFailed, setUriFailed] = useState(false);
  const uri = user.avatarUrl?.trim();
  const showRemote = Boolean(uri) && !uriFailed;

  const imageStyle: StyleProp<ImageStyle> = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (showRemote && uri) {
    return (
      <Image
        source={{ uri }}
        style={imageStyle}
        resizeMode="cover"
        onError={() => setUriFailed(true)}
        accessibilityLabel={`${user.name} profil fotoğrafı`}
      />
    );
  }

  return <PodiumInitialsAvatar user={user} size={size} />;
}

function renderPodiumAvatar(
  user: PodiumUser,
  slot: PodiumSlotKey,
  layout: StageLayout,
) {
  const position = PODIUM_AVATAR_POSITIONS[slot];
  const avatarLayout = computePodiumAvatarLayout(
    layout.width,
    layout.height,
    position,
  );

  return (
    <View
      key={`${slot}-${user.id}`}
      pointerEvents="none"
      style={[
        styles.avatarSlot,
        {
          left: avatarLayout.left,
          top: avatarLayout.top,
          width: avatarLayout.size,
          height: avatarLayout.size,
          borderRadius: avatarLayout.borderRadius,
        },
      ]}>
      <PodiumAvatarImage user={user} size={avatarLayout.size} />
    </View>
  );
}

function PodiumCaption({
  user,
  slot,
}: {
  user: PodiumUser;
  slot: PodiumSlotKey;
}) {
  const isFirst = slot === 'first';
  const district = user.districtName?.trim() || '—';

  return (
    <View style={[styles.captionCol, isFirst && styles.captionColCenter]}>
      <Text style={[styles.captionName, isFirst && styles.captionNameFirst]} numberOfLines={1}>
        {user.name}
      </Text>
      <View style={styles.captionLocationRow}>
        <Ionicons name="location" size={10} color={colors.textSecondary} />
        <Text style={styles.captionLocation} numberOfLines={1}>
          {district}
        </Text>
      </View>
      <Text style={[styles.captionScore, isFirst && styles.captionScoreFirst]}>
        {formatLeaderboardScoreBpp(user.score)}
      </Text>
    </View>
  );
}

export function LeaderboardPodiumHero({ topThree }: LeaderboardPodiumHeroProps) {
  const [stageLayout, setStageLayout] = useState<StageLayout | null>(null);

  const usersBySlot = useMemo(() => resolvePodiumUsers(topThree), [topThree]);

  const avatarSlots = useMemo(
    () =>
      (Object.keys(PODIUM_AVATAR_POSITIONS) as PodiumSlotKey[]).map((slot) => ({
        slot,
        user: usersBySlot[slot],
      })),
    [usersBySlot],
  );

  if (topThree.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View
        style={styles.stage}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width <= 0) {
            return;
          }
          const height = width / PODIUM_FRAME_ASPECT_RATIO;
          setStageLayout((prev) =>
            prev?.width === width && prev.height === height
              ? prev
              : { width, height },
          );
        }}>
        <ExpoImage
          source={LEADERBOARD_BG_SOURCE}
          style={styles.podiumBg}
          contentFit="cover"
          contentPosition="top"
          pointerEvents="none"
          accessibilityElementsHidden
        />

        {stageLayout
          ? avatarSlots.map(({ slot, user }) =>
              renderPodiumAvatar(user, slot, stageLayout),
            )
          : null}

        <ExpoImage
          source={PODIUM_FRAME_SOURCE}
          style={styles.frameOverlay}
          contentFit="contain"
          pointerEvents="none"
          accessibilityLabel="Liderlik podyumu"
        />
      </View>

      <View style={styles.captionRow}>
        {PODIUM_CAPTION_SLOT_ORDER.map((slot) => (
          <PodiumCaption key={slot} slot={slot} user={usersBySlot[slot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
    paddingHorizontal: spacing.sm,
    overflow: 'visible',
  },
  stage: {
    width: '100%',
    aspectRatio: PODIUM_FRAME_ASPECT_RATIO,
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  podiumBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '125%',
    zIndex: 0,
    opacity: 0.38,
  },
  avatarSlot: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  initialsRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28,28,30,0.08)',
  },
  initialsText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: -4,
    gap: 4,
  },
  captionCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  captionColCenter: {
    flex: 1.12,
  },
  captionName: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
    textAlign: 'center',
  },
  captionNameFirst: {
    fontSize: 12,
  },
  captionLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: '100%',
  },
  captionLocation: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  captionScore: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  captionScoreFirst: {
    fontSize: 11,
    color: colors.hubGoldDark,
  },
});
