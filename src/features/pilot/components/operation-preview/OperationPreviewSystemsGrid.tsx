import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  SYSTEM_CARDS,
  type SystemCardItem,
} from '@/features/pilot/components/operation-preview/operationPreviewData';
import { GameCard } from '@/ui/components/GameCard';
import { SectionHeader } from '@/ui/components/SectionHeader';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

const GRID_GAP = spacing.sm;
const GRID_COLUMNS = 2;

function useGridCardWidth() {
  return useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const horizontalPadding = spacing.lg * 2;
    const totalGap = GRID_GAP * (GRID_COLUMNS - 1);
    return (screenWidth - horizontalPadding - totalGap) / GRID_COLUMNS;
  }, []);
}

function OperationPreviewSystemCard({
  card,
  index,
  width,
}: {
  card: SystemCardItem;
  index: number;
  width: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(280 + index * 45).duration(300).springify().damping(20)}
      style={{ width }}>
      <GameCard
        padding="md"
        style={[
          styles.card,
          shadows.soft,
          card.emphasis && styles.cardEmphasis,
        ]}>
        <View style={styles.head}>
          <View
            style={[
              styles.iconBox,
              card.emphasis && styles.iconBoxEmphasis,
            ]}>
            <Ionicons name={card.icon} size={22} color={colors.secondary} />
          </View>
          {card.locked ? (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color={colors.hubGoldDark} />
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {card.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {card.description}
        </Text>

        <View style={styles.tag}>
          <Text style={styles.tagText}>{card.tag}</Text>
        </View>
      </GameCard>
    </Animated.View>
  );
}

export function OperationPreviewSystemsGrid() {
  const cardWidth = useGridCardWidth();

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Açılacak Sistemler"
        subtitle="Ana operasyonda genişleyecek oyun katmanları"
        icon="layers-outline"
        iconColor={colors.secondary}
      />
      <View style={styles.grid}>
        {SYSTEM_CARDS.map((card, index) => (
          <OperationPreviewSystemCard
            key={card.id}
            card={card}
            index={index}
            width={cardWidth}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    minHeight: 148,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEmphasis: {
    borderColor: `${colors.hubGold}88`,
    backgroundColor: '#FFFDF8',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxEmphasis: {
    backgroundColor: `${colors.secondaryMuted}`,
    borderWidth: 1,
    borderColor: `${colors.secondary}33`,
  },
  lockBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: colors.hubGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    flex: 1,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
