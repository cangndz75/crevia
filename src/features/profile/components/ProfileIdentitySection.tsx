import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import type { ProfileReferenceViewModel } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { HeaderXpBar } from '@/ui/components/game-header/HeaderXpBar';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const profilePortrait = require('@/assets/pp1.png');
const cityBackdrop = require('@/assets/districts/central/district_central_overview_01.png');

type ProfileIdentitySectionProps = {
  identity: ProfileReferenceViewModel['identity'];
};

export function ProfileIdentitySection({ identity }: ProfileIdentitySectionProps) {
  return (
    <View style={styles.wrap}>
      <Image
        source={cityBackdrop}
        style={styles.backdrop}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.backdropFade} />

      <View style={styles.content}>
        <View style={styles.identityRow}>
          <View style={styles.avatarStack}>
            <Image source={profilePortrait} style={styles.avatar} contentFit="cover" />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{identity.level}</Text>
            </View>
          </View>

          <View style={styles.copyCol}>
            <Text style={styles.name} numberOfLines={1}>
              {identity.playerName}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText} numberOfLines={1}>
                {identity.roleLabel}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="business-outline" size={12} color={PROFILE_REFERENCE_THEME.teal} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {identity.districtLabel}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="sunny-outline" size={12} color={PROFILE_REFERENCE_THEME.goldDark} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {identity.dayLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.xpBlock}>
          <HeaderXpBar
            progress={identity.xpProgress}
            trackColor="rgba(26, 143, 138, 0.14)"
            fillColor={PROFILE_REFERENCE_THEME.teal}
            height={8}
          />
          <View style={styles.xpMeta}>
            <Text style={styles.xpLabel} numberOfLines={1}>
              {identity.xpLabel}
            </Text>
            <Text style={styles.levelLabel} numberOfLines={1}>
              {identity.levelLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: PROFILE_REFERENCE_THEME.heroBg,
    borderWidth: 1,
    borderColor: PROFILE_REFERENCE_THEME.cardBorder,
    minHeight: 168,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  backdropFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252, 249, 242, 0.72)',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarStack: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PROFILE_REFERENCE_THEME.gold,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  copyCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  rolePill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: PROFILE_REFERENCE_THEME.teal,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    minWidth: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
    minWidth: 0,
    flexShrink: 1,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    minWidth: 0,
  },
  xpBlock: {
    gap: 6,
    marginTop: 2,
  },
  xpMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.tealDark,
    flexShrink: 0,
  },
});
