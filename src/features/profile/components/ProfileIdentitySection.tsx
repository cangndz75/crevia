import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type {
  ProfileIdentityBadge,
  ProfileReferenceViewModel,
} from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const profilePortrait = require('@/assets/pp1.png');
const ARC_LENGTH = 322;

type ProfileIdentitySectionProps = {
  identity: ProfileReferenceViewModel['identity'];
};

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

function LaurelSide({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.laurelSide, side === 'left' ? styles.laurelLeft : styles.laurelRight]}>
      {[0, 1, 2, 3].map((index) => (
        <Ionicons
          key={index}
          name="leaf-outline"
          size={22 - index}
          color={PROFILE_REFERENCE_THEME.goldDark}
          style={[
            styles.laurelLeaf,
            side === 'left'
              ? { transform: [{ rotate: `${-34 + index * 9}deg` }] }
              : { transform: [{ rotate: `${34 - index * 9}deg` }] },
            { top: index * 20 },
          ]}
        />
      ))}
    </View>
  );
}

function IdentityBadge({ badge }: { badge: ProfileIdentityBadge }) {
  return (
    <View style={styles.identityBadge}>
      <View style={styles.identityBadgeIcon}>
        <Ionicons name={badge.iconKey} size={15} color={PROFILE_REFERENCE_THEME.goldDark} />
      </View>
      <Text style={styles.identityBadgeText} numberOfLines={1}>
        {badge.label}
      </Text>
    </View>
  );
}

function XpArcCard({ identity }: ProfileIdentitySectionProps) {
  const progress = clampProgress(identity.xpProgress);
  const dashOffset = ARC_LENGTH * (1 - progress);

  return (
    <View style={[styles.xpCard, shadows.soft]}>
      <View style={styles.xpTopRow}>
        <Text style={styles.xpLabel} numberOfLines={1}>
          {identity.xpLabel}
        </Text>
        <Text style={styles.levelLabel} numberOfLines={1}>
          {identity.levelLabel}
        </Text>
      </View>

      <View style={styles.arcStage}>
        <Svg width="100%" height="112" viewBox="0 0 260 112">
          <Path
            d="M28 92 A102 102 0 0 1 232 92"
            stroke="rgba(14, 79, 71, 0.12)"
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M28 92 A102 102 0 0 1 232 92"
            stroke={PROFILE_REFERENCE_THEME.teal}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
        <View style={styles.arcMedal}>
          <Image
            source={creviaAssets.badges.authority.high}
            style={styles.arcMedalImage}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>
    </View>
  );
}

export function ProfileIdentitySection({ identity }: ProfileIdentitySectionProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.identityRow}>
        <View style={styles.avatarStage}>
          <LaurelSide side="left" />
          <LaurelSide side="right" />
          <View style={styles.avatarRing}>
            <Image source={profilePortrait} style={styles.avatar} contentFit="cover" />
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{identity.level}</Text>
          </View>
        </View>

        <View style={styles.copyCol}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
            {identity.playerName}
          </Text>
          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={13} color="#F7D77B" />
            <Text style={styles.rolePillText} numberOfLines={1}>
              {identity.roleLabel}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            {identity.badges.map((badge) => (
              <IdentityBadge key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      </View>

      <XpArcCard identity={identity} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  identityRow: {
    minHeight: 166,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarStage: {
    width: 142,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 3,
    borderColor: PROFILE_REFERENCE_THEME.goldDark,
    backgroundColor: '#F7F0DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  laurelSide: {
    position: 'absolute',
    width: 38,
    height: 112,
    bottom: 18,
    zIndex: 2,
  },
  laurelLeft: {
    left: 2,
    alignItems: 'flex-end',
  },
  laurelRight: {
    right: 2,
    alignItems: 'flex-start',
  },
  laurelLeaf: {
    position: 'absolute',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#A88C3B',
    borderWidth: 2,
    borderColor: '#F9E9AA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  levelBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 30,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    lineHeight: 34,
    letterSpacing: 0,
    maxWidth: '100%',
  },
  rolePill: {
    alignSelf: 'center',
    maxWidth: '100%',
    minHeight: 30,
    backgroundColor: PROFILE_REFERENCE_THEME.tealDark,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  identityBadge: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  identityBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF8DD',
    borderWidth: 1,
    borderColor: 'rgba(168, 140, 59, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    textAlign: 'center',
  },
  xpCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14, 79, 71, 0.10)',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    overflow: 'hidden',
  },
  xpTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  xpLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
  },
  arcStage: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  arcMedal: {
    position: 'absolute',
    bottom: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF8DD',
    borderWidth: 1,
    borderColor: 'rgba(168, 140, 59, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcMedalImage: {
    width: 38,
    height: 38,
  },
});
