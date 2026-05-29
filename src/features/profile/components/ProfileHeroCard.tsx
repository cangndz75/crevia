import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import type { ProfileViewModel } from '@/features/profile/utils/profileModel';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type ProfileHeroCardProps = {
  model: ProfileViewModel;
  careerLine: string;
  rankChip: string;
};

export function ProfileHeroCard({
  model,
  careerLine,
  rankChip,
}: ProfileHeroCardProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.identityRow}>
        <View style={styles.avatarStack}>
          <View style={styles.ringOuter}>
            <HeaderAvatar size={72} borderColor="rgba(255,255,255,0.95)" />
          </View>
          <View style={styles.levelOrb}>
            <Text style={styles.levelOrbText}>{model.level}</Text>
          </View>
        </View>

        <View style={styles.identityCol}>
          <Text style={styles.kicker} numberOfLines={1}>
            {PROFILE_UI_COPY.heroKicker}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {model.playerName}
          </Text>
          <View style={styles.rankChip}>
            <Text style={styles.rankChipText} numberOfLines={1}>
              {rankChip}
            </Text>
          </View>
          <Text style={styles.role} numberOfLines={2}>
            {model.role}
          </Text>
        </View>
      </View>

      <View style={styles.careerLine}>
        <Ionicons name="sparkles-outline" size={12} color={colors.hubGold} />
        <Text style={styles.careerLineText} numberOfLines={2}>
          {careerLine}
        </Text>
      </View>

      <View style={styles.metaBar}>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={11} color={colors.hubGold} />
          <Text style={styles.metaText} numberOfLines={1}>
            {model.unit}
          </Text>
        </View>
        <View style={styles.metaDot} />
        <View style={[styles.metaItem, styles.metaItemFlex]}>
          <Ionicons name="location" size={11} color="rgba(255,255,255,0.9)" />
          <Text style={styles.metaText} numberOfLines={1}>
            {model.region}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarStack: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(245,183,49,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  levelOrb: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.hubGold,
    borderWidth: 2,
    borderColor: colors.headerTealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOrbText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textInverse,
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(245,183,49,0.95)',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  rankChip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rankChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
  },
  role: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 15,
  },
  careerLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  careerLineText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 15,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minWidth: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '46%',
    flexShrink: 1,
    minWidth: 0,
  },
  metaItemFlex: {
    flex: 1,
    maxWidth: undefined,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    flexShrink: 0,
  },
  metaText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    minWidth: 0,
  },
});
