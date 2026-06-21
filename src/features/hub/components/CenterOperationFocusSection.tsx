import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { playLightImpactHaptic } from '@/core/feedback/hapticFeedback';
import {
  OperationFocusDetailSheet,
  operationFocusStateStyle,
} from '@/features/hub/components/OperationFocusDetailSheet';
import { CreviaAnimatedPressable } from '@/shared/motion';
import type {
  CenterOperationStatusCard,
  CenterOperationStatusCardId,
} from '@/features/hub/utils/centerOperationCommandPresentation';
import type { CenterOperationFocus } from '@/features/hub/utils/centerOperationFocusPresentation';
import type { CenterHomeVisibilityState } from '@/features/hub/utils/centerHomePresentation';

const palette = {
  deepGreen: '#064E45',
  teal: '#07564F',
  mint: '#1A8F8A',
  gold: '#D8A72E',
  goldSoft: '#F5E3AF',
  muted: '#6B7D78',
} as const;

type CenterOperationFocusSectionProps = {
  focus: CenterOperationFocus;
  visibility?: CenterHomeVisibilityState;
  reducedMotion?: boolean;
  onViewAllPress?: () => void;
};

type IconName = keyof typeof Ionicons.glyphMap;

function resolveIcon(iconKey: string): IconName {
  const known: Record<string, IconName> = {
    'git-network-outline': 'git-network-outline',
    'people-outline': 'people-outline',
    'pulse-outline': 'pulse-outline',
    'wallet-outline': 'wallet-outline',
  };
  return known[iconKey] ?? 'ellipse-outline';
}

function StatusMiniCard({
  card,
  onPress,
  reducedMotion,
}: {
  card: CenterOperationStatusCard;
  onPress: () => void;
  reducedMotion: boolean;
}) {
  const stateStyle = operationFocusStateStyle(card.state);

  return (
    <CreviaAnimatedPressable
      onPress={onPress}
      reducedMotion={reducedMotion}
      accessibilityRole="button"
      accessibilityLabel={`${card.title}. ${card.statusLine}`}
      style={[
        styles.statusCard,
        { borderColor: stateStyle.border, backgroundColor: stateStyle.bg },
      ]}>
      <View style={styles.statusHead}>
        <Ionicons name={resolveIcon(card.iconKey)} size={15} color={stateStyle.text} />
        <Text style={[styles.statusTitle, { color: stateStyle.text }]} numberOfLines={1}>
          {card.title}
        </Text>
      </View>
      <Text style={styles.statusLine} numberOfLines={2}>
        {card.statusLine}
      </Text>
    </CreviaAnimatedPressable>
  );
}

export function CenterOperationFocusSection({
  focus,
  visibility,
  reducedMotion = false,
  onViewAllPress,
}: CenterOperationFocusSectionProps) {
  const router = useRouter();
  const [openSheet, setOpenSheet] = useState<CenterOperationStatusCardId | null>(null);
  const isVisible = (visibility ?? focus.visibility) !== 'hidden';
  const commandPanel = focus.commandPanel;

  if (!isVisible || !commandPanel) return null;

  const { recommendedMove, statusCards, sheets } = commandPanel;
  const moveStyle = operationFocusStateStyle(recommendedMove.state);
  const showViewAll = focus.showViewAll || Boolean(focus.cta?.route);
  const viewAllEnabled = focus.cta?.enabled !== false;

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
      return;
    }
    const route = focus.cta?.route ?? '/events';
    if (!viewAllEnabled) return;
    playLightImpactHaptic();
    router.push(route as Href);
  };

  const handleRecommendedPress = () => {
    if (!recommendedMove.enabled || !recommendedMove.route) return;
    playLightImpactHaptic();
    router.push(recommendedMove.route as Href);
  };

  const handleOpenSheet = (id: CenterOperationStatusCardId) => {
    playLightImpactHaptic();
    setOpenSheet(id);
  };

  return (
    <View style={styles.section} accessibilityLabel={focus.accessibilityLabel}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {focus.title}
        </Text>
        {showViewAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tümünü gör"
            onPress={handleViewAll}
            disabled={!viewAllEnabled}
            hitSlop={8}
            style={({ pressed }) => [
              styles.viewAllBtn,
              pressed && viewAllEnabled ? styles.viewAllPressed : undefined,
            ]}>
            <Text
              style={[styles.viewAllText, !viewAllEnabled && styles.viewAllTextMuted]}
              numberOfLines={1}>
              Tümünü Gör
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={viewAllEnabled ? palette.teal : palette.muted}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stack}>
        <CreviaAnimatedPressable
          onPress={handleRecommendedPress}
          reducedMotion={reducedMotion}
          disabled={!recommendedMove.enabled}
          accessibilityRole="button"
          accessibilityLabel={`${recommendedMove.title}. ${recommendedMove.description}`}
          style={[
            styles.recommendedCard,
            {
              borderColor: moveStyle.border,
              backgroundColor: moveStyle.bg,
            },
          ]}>
          <Text style={styles.recommendedEyebrow}>{recommendedMove.eyebrow}</Text>
          <Text style={styles.recommendedTitle} numberOfLines={2}>
            {recommendedMove.title}
          </Text>
          <Text style={styles.recommendedDescription} numberOfLines={3}>
            {recommendedMove.description}
          </Text>

          <View style={styles.rewardRow}>
            {recommendedMove.rewardLine ? (
              <View style={styles.rewardPill}>
                <Text style={styles.rewardPillText} numberOfLines={1}>
                  {recommendedMove.rewardLine}
                </Text>
              </View>
            ) : null}
            {recommendedMove.unlockLine ? (
              <Text style={styles.unlockText} numberOfLines={1}>
                {recommendedMove.unlockLine}
              </Text>
            ) : null}
          </View>

          <View style={styles.recommendedCta}>
            <Text style={styles.recommendedCtaText}>{recommendedMove.ctaLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </View>
        </CreviaAnimatedPressable>

        <View style={styles.statusGrid}>
          {statusCards.map((card) => (
            <StatusMiniCard
              key={card.id}
              card={card}
              reducedMotion={reducedMotion}
              onPress={() => handleOpenSheet(card.id)}
            />
          ))}
        </View>
      </View>

      <OperationFocusDetailSheet
        visible={openSheet != null}
        sheetKey={openSheet}
        model={openSheet ? sheets[openSheet] : undefined}
        onClose={() => setOpenSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: palette.deepGreen,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  viewAllPressed: {
    opacity: 0.75,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.teal,
  },
  viewAllTextMuted: {
    color: palette.muted,
  },
  stack: {
    gap: 10,
  },
  recommendedCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 14,
    gap: 8,
    shadowColor: 'rgba(15, 60, 52, 0.1)',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  recommendedEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.gold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  recommendedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.deepGreen,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  recommendedDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.muted,
    lineHeight: 18,
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rewardPill: {
    borderRadius: 999,
    backgroundColor: palette.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(216, 167, 46, 0.28)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A7B28',
  },
  unlockText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.teal,
    flexShrink: 1,
  },
  recommendedCta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: palette.mint,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recommendedCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    minHeight: 72,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  statusLine: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.deepGreen,
    lineHeight: 16,
    minHeight: 32,
  },
});
