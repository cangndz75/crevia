import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ProfileReferenceViewModel, ProfileRoadmapNode } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const roadmapBackdrop = require('@/assets/districts/central/district_central_overview_02.png');

type ProfileRoadmapSectionProps = {
  nodes: ProfileRoadmapNode[];
  summary: ProfileReferenceViewModel['roadmapSummary'];
  onSeeFullRoadmapPress?: () => void;
};

function imageForIndex(index: number) {
  if (index === 0) return creviaAssets.buildings.municipalHall3d;
  if (index === 1) return creviaAssets.districts.industrialBlock;
  return creviaAssets.map.icons.layersStack;
}

function RoadmapNode({ node, index }: { node: ProfileRoadmapNode; index: number }) {
  const active = node.status === 'active';

  return (
    <View style={styles.nodeColumn}>
      <View style={[styles.nodeArtWrap, active ? styles.nodeArtActive : styles.nodeArtLocked]}>
        <Image
          source={imageForIndex(index)}
          style={[styles.nodeArt, !active && styles.nodeArtMuted]}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <View style={[styles.nodeNumber, active ? styles.nodeNumberActive : styles.nodeNumberLocked]}>
          <Text style={styles.nodeNumberText}>{node.rankNumber}</Text>
        </View>
      </View>
      <Text style={[styles.nodeLabel, active && styles.nodeLabelActive]} numberOfLines={2}>
        {node.label}
      </Text>
      <Text style={[styles.nodeStatus, active && styles.nodeStatusActive]} numberOfLines={1}>
        {node.statusLabel}
      </Text>
    </View>
  );
}

function TrustProgress({ summary }: { summary: ProfileReferenceViewModel['roadmapSummary'] }) {
  const width = `${Math.round(Math.max(0, Math.min(1, summary.progress)) * 100)}%` as `${number}%`;

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHead}>
        <View style={styles.progressTitleRow}>
          <Image
            source={creviaAssets.badges.authority.high}
            style={styles.progressBadge}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View>
            <Text style={styles.progressTitle} numberOfLines={1}>
              {summary.label}
            </Text>
            <Text style={styles.progressValue} numberOfLines={1}>
              {summary.valueLabel}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
}

export function ProfileRoadmapSection({
  nodes,
  summary,
  onSeeFullRoadmapPress,
}: ProfileRoadmapSectionProps) {
  const visibleNodes = nodes.slice(0, 3);

  return (
    <View style={[styles.card, shadows.soft]}>
      <Image
        source={roadmapBackdrop}
        style={styles.backdrop}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.backdropFade} />

      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Ionicons name="map-outline" size={15} color={PROFILE_REFERENCE_THEME.teal} />
          <Text style={styles.title} numberOfLines={1}>
            {PROFILE_UI_COPY.roadmapTitle}
          </Text>
        </View>
        <Pressable
          onPress={onSeeFullRoadmapPress}
          style={styles.headLink}
          accessibilityRole="button"
          accessibilityLabel="Tüm yol haritasını gör">
          <Text style={styles.headLinkText} numberOfLines={1}>
            {PROFILE_UI_COPY.fullRoadmap}
          </Text>
          <Ionicons name="chevron-forward" size={12} color={PROFILE_REFERENCE_THEME.teal} />
        </Pressable>
      </View>

      <View style={styles.trackWrap}>
        <Svg style={styles.pathLayer} width="100%" height="94" viewBox="0 0 320 94">
          <Path
            d="M36 66 C86 20 124 26 166 56 C208 86 234 66 284 26"
            stroke="rgba(26, 143, 138, 0.5)"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M36 66 C86 20 124 26 166 56 C208 86 234 66 284 26"
            stroke="rgba(245, 183, 49, 0.48)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            strokeDasharray="8 10"
          />
        </Svg>
        <View style={styles.track}>
          {visibleNodes.map((node, index) => (
            <RoadmapNode key={node.id} node={node} index={index} />
          ))}
        </View>
      </View>

      <View style={styles.footerRow}>
        <TrustProgress summary={summary} />
        <Pressable
          onPress={onSeeFullRoadmapPress}
          style={styles.historyBtn}
          accessibilityRole="button"
          accessibilityLabel="Güven geçmişini aç">
          <Ionicons name="stats-chart-outline" size={14} color={PROFILE_REFERENCE_THEME.teal} />
          <Text style={styles.historyText} numberOfLines={1}>
            Güven Geçmişi
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: PROFILE_REFERENCE_THEME.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PROFILE_REFERENCE_THEME.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 250,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  backdropFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252, 249, 242, 0.72)',
  },
  head: {
    position: 'relative',
    zIndex: 1,
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
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    letterSpacing: 0,
  },
  headLink: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  headLinkText: {
    fontSize: 10,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
  },
  trackWrap: {
    position: 'relative',
    zIndex: 1,
    minHeight: 130,
    justifyContent: 'center',
  },
  pathLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  nodeColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
  },
  nodeArtWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(14,79,71,0.12)',
  },
  nodeArtActive: {
    borderColor: 'rgba(245,183,49,0.72)',
    backgroundColor: '#FFF9DF',
  },
  nodeArtLocked: {
    opacity: 0.88,
  },
  nodeArt: {
    width: 62,
    height: 62,
  },
  nodeArtMuted: {
    opacity: 0.46,
  },
  nodeNumber: {
    position: 'absolute',
    bottom: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeNumberActive: {
    backgroundColor: PROFILE_REFERENCE_THEME.teal,
  },
  nodeNumberLocked: {
    backgroundColor: '#65736C',
  },
  nodeNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  nodeLabel: {
    fontSize: 10,
    fontWeight: '900',
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
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    textAlign: 'center',
  },
  nodeStatusActive: {
    color: PROFILE_REFERENCE_THEME.teal,
  },
  footerRow: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  progressBadge: {
    width: 34,
    height: 34,
    flexShrink: 0,
  },
  progressTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(14, 79, 71, 0.13)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: PROFILE_REFERENCE_THEME.teal,
  },
  historyBtn: {
    minHeight: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(14,79,71,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  historyText: {
    fontSize: 10,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.teal,
  },
});
