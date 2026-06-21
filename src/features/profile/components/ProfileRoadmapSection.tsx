import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ProfileRoadmapNode } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileRoadmapSectionProps = {
  nodes: ProfileRoadmapNode[];
  onSeeFullRoadmapPress?: () => void;
};

function nodeIconName(index: number): keyof typeof Ionicons.glyphMap {
  if (index === 0) return 'business';
  if (index === 1) return 'business-outline';
  if (index === 2) return 'layers-outline';
  return 'planet-outline';
}

function RoadmapNode({ node, index, isLast }: { node: ProfileRoadmapNode; index: number; isLast: boolean }) {
  const active = node.status === 'active';

  return (
    <View style={styles.nodeWrap}>
      <View style={styles.nodeColumn}>
        <View style={[styles.nodeCircle, active ? styles.nodeCircleActive : styles.nodeCircleLocked]}>
          {active ? <View style={styles.nodeGoldRing} /> : null}
          <Ionicons
            name={nodeIconName(index)}
            size={active ? 18 : 16}
            color={active ? PROFILE_REFERENCE_THEME.goldDark : PROFILE_REFERENCE_THEME.textSecondary}
          />
        </View>
        <Text style={styles.nodeNumber}>{node.rankNumber}</Text>
        <Text style={[styles.nodeLabel, active && styles.nodeLabelActive]} numberOfLines={2}>
          {node.label}
        </Text>
        <Text
          style={[styles.nodeStatus, active && styles.nodeStatusActive]}
          numberOfLines={2}>
          {node.statusLabel}
        </Text>
      </View>
      {!isLast ? <View style={styles.connector} /> : null}
    </View>
  );
}

export function ProfileRoadmapSection({ nodes, onSeeFullRoadmapPress }: ProfileRoadmapSectionProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Ionicons name="trail-sign-outline" size={15} color={PROFILE_REFERENCE_THEME.teal} />
          <Text style={styles.title}>{PROFILE_UI_COPY.roadmapTitle}</Text>
        </View>
        <Pressable
          onPress={onSeeFullRoadmapPress}
          style={styles.headLink}
          accessibilityRole="button"
          accessibilityLabel="Tüm yol haritasını gör">
          <Text style={styles.headLinkText}>{PROFILE_UI_COPY.fullRoadmap}</Text>
          <Ionicons name="chevron-forward" size={12} color={PROFILE_REFERENCE_THEME.teal} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}>
        {nodes.map((node, index) => (
          <RoadmapNode
            key={node.id}
            node={node}
            index={index}
            isLast={index === nodes.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PROFILE_REFERENCE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PROFILE_REFERENCE_THEME.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minWidth: 0,
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  headLinkText: {
    fontSize: 10,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.teal,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
    paddingBottom: 2,
    gap: 0,
  },
  nodeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    width: 92,
    alignItems: 'center',
    gap: 4,
  },
  nodeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FAF8',
    borderWidth: 2,
    position: 'relative',
  },
  nodeCircleActive: {
    borderColor: PROFILE_REFERENCE_THEME.gold,
    backgroundColor: '#FFFBF0',
  },
  nodeCircleLocked: {
    borderColor: 'rgba(26, 143, 138, 0.16)',
  },
  nodeGoldRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(245, 183, 49, 0.45)',
  },
  nodeNumber: {
    fontSize: 9,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textSecondary,
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    textAlign: 'center',
    lineHeight: 13,
    minHeight: 26,
  },
  nodeLabelActive: {
    color: PROFILE_REFERENCE_THEME.teal,
  },
  nodeStatus: {
    fontSize: 9,
    fontWeight: '600',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
    minHeight: 24,
  },
  nodeStatusActive: {
    color: PROFILE_REFERENCE_THEME.teal,
    fontWeight: '800',
  },
  connector: {
    width: 28,
    height: 2,
    marginTop: 24,
    borderStyle: 'dashed',
    borderTopWidth: 2,
    borderColor: 'rgba(26, 143, 138, 0.22)',
  },
});
