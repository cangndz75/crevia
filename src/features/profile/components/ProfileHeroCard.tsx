import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ProfileViewModel } from '@/features/profile/utils/profileModel';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type ProfileHeroCardProps = {
  model: ProfileViewModel;
};

export function ProfileHeroCard({ model }: ProfileHeroCardProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.topAccent} />

      <View style={styles.identityRow}>
        <View style={styles.avatarStack}>
          <View style={styles.ringGlow} />
          <View style={styles.ringOuter}>
            <HeaderAvatar size={92} borderColor="rgba(255,255,255,0.95)" />
          </View>
          <View style={styles.levelOrb}>
            <Text style={styles.levelOrbText}>{model.level}</Text>
          </View>
        </View>

        <View style={styles.identityCol}>
          <Text style={styles.kicker}>AKTİF OPERATÖR</Text>
          <Text style={styles.name} numberOfLines={1}>
            {model.playerName}
          </Text>
          <Text style={styles.role} numberOfLines={2}>
            {model.role}
          </Text>
        </View>
      </View>

      <View style={styles.metaBar}>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={12} color={colors.hubGold} />
          <Text style={styles.metaText} numberOfLines={1}>
            {model.unit}
          </Text>
        </View>
        <View style={styles.metaDot} />
        <View style={[styles.metaItem, styles.metaItemFlex]}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.14)',
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.md,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.hubGold,
    opacity: 0.85,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarStack: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245,183,49,0.2)',
  },
  ringOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: 'rgba(245,183,49,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  levelOrb: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.hubGold,
    borderWidth: 2.5,
    borderColor: colors.headerTealDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelOrbText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textInverse,
  },
  identityCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(245,183,49,0.95)',
    letterSpacing: 1.3,
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 16,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '46%',
  },
  metaItemFlex: {
    flex: 1,
    maxWidth: undefined,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
});
