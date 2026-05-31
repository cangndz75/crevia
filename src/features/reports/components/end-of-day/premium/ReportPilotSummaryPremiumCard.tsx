import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import { getReportPilotStatImage } from '@/core/assets/creviaAssetPresentation';
import type { ReportPilotSummaryPremiumModel } from '@/features/reports/presentation/reportPremiumPresentation';
import { CreviaAssetImage } from '@/ui/components/CreviaAssetImage';

type Props = {
  model: ReportPilotSummaryPremiumModel;
};

const CARD_GRADIENT = ['#0A4F4A', '#116A63', '#0F8F86'] as const;

export function ReportPilotSummaryPremiumCard({ model }: Props) {
  return (
    <LinearGradient
      colors={[...CARD_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.sparkleA} pointerEvents="none" />
      <View style={styles.sparkleB} pointerEvents="none" />

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.bookIcon}>
            <CreviaAssetImage
              source={creviaAssets.icons.knowledge.operationGuide}
              containerStyle={styles.bookAsset}
              contentFit="contain"
            />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Pilot Gün Özeti
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {model.completedDayLabel}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.starBadge}>
            <CreviaAssetImage
              source={creviaAssets.badges.pilot.firstFieldDay}
              containerStyle={styles.starAsset}
              contentFit="contain"
            />
          </View>
          <View style={styles.themePill}>
            <Text style={styles.themePillText} numberOfLines={1}>
              {model.themePill}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.heroRow}>
        <View style={styles.trophyOuter}>
          <View style={styles.trophyInner}>
            <CreviaAssetImage
              source={creviaAssets.leaderboard.trophyGold}
              containerStyle={styles.trophyAsset}
              contentFit="contain"
            />
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.headline} numberOfLines={2}>
            {model.headline}
          </Text>
          <Text style={styles.summary} numberOfLines={2}>
            {model.summary}
          </Text>
        </View>
      </View>

      <View style={styles.insightPill}>
        <Text style={styles.insightText} numberOfLines={2}>
          {model.insightPill}
        </Text>
      </View>

      <View style={styles.statStrip}>
        {model.statColumns.map((column, index) => (
          <View key={`${column.title}-${index}`} style={styles.statColWrap}>
            {index > 0 ? <View style={styles.statDivider} /> : null}
            <View style={styles.statCol}>
              <CreviaAssetImage
                source={getReportPilotStatImage(column.icon)}
                containerStyle={styles.statAsset}
                contentFit="contain"
              />
              <Text style={styles.statTitle} numberOfLines={2}>
                {column.title}
              </Text>
              <Text style={styles.statSub} numberOfLines={2}>
                {column.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <CreviaAssetImage
          source={creviaAssets.operations.dispatchCompass}
          containerStyle={styles.footerAsset}
          contentFit="contain"
        />
        <Text style={styles.footerText} numberOfLines={1}>
          {model.nextDayLine}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.75)" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 16,
    gap: 12,
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.22)',
    shadowColor: '#0A3D38',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  sparkleA: {
    position: 'absolute',
    top: 12,
    right: 48,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(245, 230, 184, 0.55)',
  },
  sparkleB: {
    position: 'absolute',
    bottom: 64,
    left: 20,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 230, 184, 0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  bookIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bookAsset: {
    width: 22,
    height: 22,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
    maxWidth: '42%',
  },
  starBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D7A43C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starAsset: {
    width: 20,
    height: 20,
  },
  themePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.3)',
    maxWidth: 120,
  },
  themePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F5E6B8',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  trophyOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(215, 164, 60, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 164, 60, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trophyInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(245, 230, 184, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyAsset: {
    width: 36,
    height: 36,
  },
  statAsset: {
    width: 18,
    height: 18,
  },
  footerAsset: {
    width: 20,
    height: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  headline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5E6B8',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 18,
  },
  insightPill: {
    backgroundColor: 'rgba(255, 248, 232, 0.92)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(215, 164, 60, 0.25)',
  },
  insightText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4A1E',
    lineHeight: 18,
    textAlign: 'center',
  },
  statStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  statColWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  statSub: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 13,
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 0,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 0,
    flexShrink: 1,
  },
});
