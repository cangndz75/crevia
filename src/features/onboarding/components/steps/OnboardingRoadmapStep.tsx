import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ROADMAP_DAYS } from '@/features/onboarding/content/onboardingContent';
import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

export function OnboardingRoadmapStep() {
  return (
    <View style={styles.wrap}>
      <View style={styles.scenarioBadge}>
        <Ionicons name="pulse" size={14} color={onboardingTheme.primary} />
        <Text style={styles.scenarioText}>Yarı lineer pilot senaryo</Text>
      </View>

      <ScrollableRoadmap />

      <View style={styles.grid}>
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.resultCard, shadows.soft]}>
          <Text style={styles.resultTitle}>Pilot Bölge Sonucu 🎉</Text>
          <Text style={styles.resultStatus}>Bölge pozitife döndü!</Text>
          <View style={styles.ring}>
            <Ionicons name="heart" size={28} color={onboardingTheme.success} />
          </View>
          <View style={styles.resultStats}>
            <ResultLine icon="pulse" label="Mahalle Nabzı" value="Kontrollü" positive />
            <ResultLine icon="people" label="Güven" value="+12" positive />
            <ResultLine icon="shield" label="Risk" value="-8" positive={false} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).springify()}
          style={[styles.mapCard, shadows.soft]}>
          <View style={styles.hexMap}>
            <View style={styles.hexHighlight} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.hexCell, { opacity: 0.3 + (i % 3) * 0.2 }]} />
            ))}
          </View>
          <View style={styles.mapBadge}>
            <Ionicons name="business" size={12} color={onboardingTheme.primary} />
            <Text style={styles.mapBadgeText}>Pilot sonrası ilçe geneline aç!</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.miniRow}>
        <MiniCard
          title="Fırsat Kartı"
          subtitle="Gençlik Merkezi + Güven"
          badge="+5"
          badgeColor={onboardingTheme.purpleMuted}
          badgeTextColor={onboardingTheme.purple}
          icon="business-outline"
        />
        <MiniCard
          title="Risk Uyarısı"
          subtitle="Trafik Yoğunluğu"
          badge="-3"
          badgeColor={onboardingTheme.warningMuted}
          badgeTextColor={onboardingTheme.warning}
          icon="warning-outline"
        />
        <MiniCard
          title="Seviye İlerlemesi"
          subtitle="Seviye 4"
          badge="650/900"
          badgeColor={onboardingTheme.primaryMuted}
          badgeTextColor={onboardingTheme.primary}
          icon="trophy-outline"
          progress={0.72}
        />
      </View>
    </View>
  );
}

function ScrollableRoadmap() {
  return (
    <View style={styles.roadmapWrap}>
      <View style={styles.roadmapCards}>
        {ROADMAP_DAYS.map((day, i) => (
          <Animated.View
            key={day.id}
            entering={FadeInDown.delay(i * 40).springify()}
            style={styles.dayCard}>
            <View
              style={[
                styles.dayIcon,
                i < 4 && { backgroundColor: onboardingTheme.primaryMuted },
              ]}>
              <Ionicons
                name={day.icon}
                size={16}
                color={i < 4 ? onboardingTheme.primary : onboardingTheme.textMuted}
              />
            </View>
            <Text style={styles.dayLabel} numberOfLines={2}>
              {day.label}
            </Text>
          </Animated.View>
        ))}
      </View>
      <View style={styles.progressLine}>
        {ROADMAP_DAYS.map((day, i) => (
          <View
            key={day.id}
            style={[
              styles.progressDot,
              i < 4 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ResultLine({
  icon,
  label,
  value,
  positive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <View style={styles.resultLine}>
      <Ionicons
        name={icon}
        size={14}
        color={positive ? onboardingTheme.success : onboardingTheme.danger}
      />
      <Text style={styles.resultLineLabel}>{label}:</Text>
      <Text
        style={[
          styles.resultLineValue,
          { color: positive ? onboardingTheme.success : onboardingTheme.danger },
        ]}>
        {value}
      </Text>
    </View>
  );
}

function MiniCard({
  title,
  subtitle,
  badge,
  badgeColor,
  badgeTextColor,
  icon,
  progress,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  badgeTextColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress?: number;
}) {
  return (
    <View style={[styles.miniCard, shadows.soft]}>
      <View style={styles.miniTop}>
        <Ionicons name={icon} size={16} color={badgeTextColor} />
        <View style={[styles.miniBadge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.miniBadgeText, { color: badgeTextColor }]}>
            {badge}
          </Text>
        </View>
      </View>
      <Text style={styles.miniTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.miniSub} numberOfLines={1}>
        {subtitle}
      </Text>
      {progress != null && (
        <View style={styles.miniTrack}>
          <View style={[styles.miniFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  scenarioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: onboardingTheme.primaryMuted,
  },
  scenarioText: {
    fontSize: 12,
    fontWeight: '700',
    color: onboardingTheme.primary,
  },
  roadmapWrap: {
    gap: spacing.sm,
  },
  roadmapCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  dayIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEEDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: onboardingTheme.navy,
    textAlign: 'center',
  },
  progressLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4D2E8',
    flex: 1,
    marginHorizontal: 2,
    maxWidth: 24,
  },
  progressDotActive: {
    backgroundColor: onboardingTheme.primary,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: onboardingTheme.navy,
    textAlign: 'center',
  },
  resultStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: onboardingTheme.success,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: onboardingTheme.successMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  resultStats: {
    width: '100%',
    gap: 4,
  },
  resultLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultLineLabel: {
    fontSize: 9,
    color: onboardingTheme.textMuted,
    flex: 1,
  },
  resultLineValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  mapCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  hexMap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    alignContent: 'center',
    position: 'relative',
  },
  hexHighlight: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: onboardingTheme.primary,
    backgroundColor: 'rgba(91,95,239,0.12)',
    top: '30%',
    left: '25%',
  },
  hexCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: onboardingTheme.primaryMuted,
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: onboardingTheme.primaryMuted,
    padding: 6,
    borderRadius: radius.sm,
  },
  mapBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: onboardingTheme.primary,
    flex: 1,
  },
  miniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: onboardingTheme.glassBorder,
    padding: spacing.sm,
    gap: 4,
    minHeight: 88,
  },
  miniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  miniTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: onboardingTheme.navy,
  },
  miniSub: {
    fontSize: 8,
    color: onboardingTheme.textMuted,
    fontWeight: '500',
  },
  miniTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: onboardingTheme.primaryMuted,
    overflow: 'hidden',
    marginTop: 4,
  },
  miniFill: {
    height: '100%',
    backgroundColor: onboardingTheme.primary,
    borderRadius: 2,
  },
});
