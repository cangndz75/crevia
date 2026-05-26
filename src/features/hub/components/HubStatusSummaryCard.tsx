import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { getDistrictProfile } from '@/core/content/districtProfiles';
import { getCurrentPilotDayPlan } from '@/core/game/getCurrentPilotDayPlan';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import { HubAssetImage } from '@/features/hub/components/HubAssetImage';
import { useHubDerivedInput } from '@/features/hub/hooks/useHubDerivedInput';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import {
  getHeroStatusTitle,
  getHeroSupportMessage,
} from '@/features/hub/utils/hubPresentation';
import { PILOT_DAY_THEME_LABELS } from '@/features/pilot/utils/pilotDayPresentation';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const MAX_PILOT_DAYS = 7;

export function HubStatusSummaryCard() {
  const input = useHubDerivedInput();
  const title = useMemo(() => getHeroStatusTitle(input), [input]);
  const support = useMemo(() => getHeroSupportMessage(input), [input]);
  const activeCount = input.activeEvents.length;

  const pilotInfo = useGameStore(
    useShallow((s) => {
      const id: PilotDistrictId =
        s.gameState.pilot.selectedDistrictId ?? DEFAULT_PILOT_DISTRICT_ID;
      const district = getDistrictProfile(id);
      const dayPlan = getCurrentPilotDayPlan(s.gameState.pilot);
      return {
        day: s.gameState.pilot.currentPilotDay,
        theme: dayPlan ? PILOT_DAY_THEME_LABELS[dayPlan.theme] : '—',
        districtShort: district?.name.split(' ')[0] ?? 'Pilot',
        districtId: id,
      };
    }),
  );

  const heroImage = useMemo(
    () => getPilotDistrictHeroImage(pilotInfo.districtId),
    [pilotInfo.districtId],
  );

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify().damping(22)}
      style={styles.cardOuter}>
      <LinearGradient
        colors={['#145A56', '#1A8F8A', '#24A89E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <Text style={styles.sectionLabel}>GÜNLÜK KOMUTA MERKEZİ</Text>

        <View style={styles.mainRow}>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.liveDot} />
            </View>

            {activeCount > 0 && (
              <View style={styles.warningChip}>
                <Ionicons name="alert-circle" size={13} color="#D4A017" />
                <Text style={styles.warningText}>
                  {activeCount} aktif olay takip ediliyor
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#D4A017" />
              </View>
            )}

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.chipText}>
                  Gün {pilotInfo.day}/{MAX_PILOT_DAYS}
                </Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="flag-outline" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.chipText}>{pilotInfo.theme}</Text>
              </View>
              <View style={styles.chip}>
                <Ionicons name="navigate-outline" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.chipText}>{pilotInfo.districtShort}</Text>
              </View>
            </View>
          </View>

          <View style={styles.visualWrap}>
            <HubAssetImage
              source={heroImage}
              containerStyle={styles.visualFrame}
              style={styles.visualImage}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.supportBox}>
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <View style={styles.supportTextCol}>
            <Text style={styles.supportLine1}>{support.line1}</Text>
            <Text style={styles.supportLine2}>{support.line2}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#0D3D3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    padding: spacing.md,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mainRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textCol: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  warningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244,183,49,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(244,183,49,0.25)',
  },
  warningText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F5D78E',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  visualWrap: {
    width: 100,
    height: 84,
  },
  visualFrame: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  visualImage: {
    borderRadius: radius.lg,
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  supportTextCol: {
    flex: 1,
    gap: 1,
  },
  supportLine1: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportLine2: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
});
