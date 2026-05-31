import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthorityTrustTierImage } from '@/core/assets/creviaAssetPresentation';
import type {
  AuthorityTrustTier,
  ReportAuthorityTrustModel,
} from '@/features/reports/presentation/reportPremiumPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';

type Props = {
  model: ReportAuthorityTrustModel;
};

const TIER_ACTIVE_INDEX: Record<AuthorityTrustTier, number> = {
  low: 0,
  mid: 1,
  high: 2,
};

const SEGMENT_LABELS = ['Düşük', 'Orta', 'Yüksek'] as const;

export function ReportAuthorityTrustCard({ model }: Props) {
  const activeIndex = TIER_ACTIVE_INDEX[model.tier];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.emblemCol}>
          <View style={styles.emblemOuter}>
            <View style={styles.emblemInner}>
              <CreviaAssetImage
                source={getAuthorityTrustTierImage(model.tier)}
                containerStyle={styles.emblemAsset}
                contentFit="contain"
              />
            </View>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText} numberOfLines={1}>
              {model.tierBadgeLabel}
            </Text>
          </View>
        </View>

        <View style={styles.copyCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {model.title}
            </Text>
            {model.showUpdated ? (
              <View style={styles.updatedPill}>
                <Ionicons name="checkmark-circle" size={12} color="#3BAF7A" />
                <Text style={styles.updatedText} numberOfLines={1}>
                  {model.statusLabel}
                </Text>
              </View>
            ) : (
              <Text style={styles.watchingText} numberOfLines={1}>
                {model.statusLabel}
              </Text>
            )}
          </View>
          <Text style={styles.desc} numberOfLines={2}>
            {model.descriptionLine1}
          </Text>
          <Text style={styles.desc} numberOfLines={2}>
            {model.descriptionLine2}
          </Text>
        </View>
      </View>

      <View style={styles.trackWrap}>
        <View style={styles.track}>
          {[0, 1, 2].map((index) => (
            <View
              key={SEGMENT_LABELS[index]}
              style={[
                styles.segment,
                index <= activeIndex ? styles.segmentActive : styles.segmentMuted,
                index === 0 ? styles.segmentFirst : null,
                index === 2 ? styles.segmentLast : null,
                index === activeIndex ? styles.segmentCurrent : null,
              ]}
            />
          ))}
        </View>
        <View style={styles.labelRow}>
          {SEGMENT_LABELS.map((label, index) => (
            <Text
              key={label}
              style={[
                styles.segmentLabel,
                index === activeIndex ? styles.segmentLabelActive : null,
              ]}
              numberOfLines={1}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F2FAF6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 85, 78, 0.1)',
    padding: 16,
    gap: 14,
    minWidth: 0,
    shadowColor: '#152C27',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minWidth: 0,
  },
  emblemCol: {
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    width: 78,
  },
  emblemOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF8E8',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 164, 60, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5E6B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemAsset: {
    width: 44,
    height: 44,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#173B3A',
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.35)',
    maxWidth: 78,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D7A43C',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  copyCol: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#173B3A',
    flexShrink: 1,
  },
  updatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  updatedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3BAF7A',
  },
  watchingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B8A86',
    flexShrink: 0,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#4A5F5C',
    flexShrink: 1,
  },
  trackWrap: {
    gap: 6,
    minWidth: 0,
  },
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 85, 78, 0.08)',
    position: 'relative',
  },
  segment: {
    flex: 1,
    height: '100%',
  },
  segmentActive: {
    backgroundColor: '#0F8F86',
  },
  segmentMuted: {
    backgroundColor: 'rgba(16, 85, 78, 0.12)',
  },
  segmentFirst: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  segmentLast: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  segmentCurrent: {
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.55)',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  segmentLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8AA39F',
    textAlign: 'center',
  },
  segmentLabelActive: {
    color: '#173B3A',
    fontWeight: '800',
  },
});
