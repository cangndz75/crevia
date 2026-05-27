import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LockedFeature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  unlockHint: string;
};

const LOCKED_FEATURES: LockedFeature[] = [
  {
    icon: 'person',
    title: 'Hesap',
    unlockHint: 'Pilot ilerledikçe',
  },
  {
    icon: 'time',
    title: 'Geçmiş',
    unlockHint: 'Gün 3+',
  },
  {
    icon: 'notifications',
    title: 'Uyarılar',
    unlockHint: 'Seviye 2',
  },
  {
    icon: 'options',
    title: 'Ayarlar',
    unlockHint: 'Yakında',
  },
];

function LockedFeatureCard({ item }: { item: LockedFeature }) {
  return (
    <View style={[styles.featureCard, shadows.soft]} accessibilityState={{ disabled: true }}>
      <View style={styles.lockOverlay}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={11} color={colors.hubGoldDark} />
        </View>
      </View>

      <View style={styles.featureIconWrap}>
        <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureHint}>{item.unlockHint}</Text>
    </View>
  );
}

export function ProfileMenuSection() {
  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Kilitli Modüller</Text>
        <View style={styles.sectionPill}>
          <Text style={styles.sectionPillText}>4</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {LOCKED_FEATURES.map((item) => (
          <LockedFeatureCard key={item.title} item={item} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionPill: {
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: '48%',
    minHeight: 108,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252, 249, 242, 0.45)',
    alignItems: 'flex-end',
    padding: 6,
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  featureHint: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
