import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ROADMAP_DAYS } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type CompactPilotRoadmapProps = {
  compact?: boolean;
  highlightDay?: number;
};

export function CompactPilotRoadmap({
  compact = false,
  highlightDay = 1,
}: CompactPilotRoadmapProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(100).duration(380)}
      style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>7 günlük pilot yolu</Text>
      <View style={styles.row}>
        {ROADMAP_DAYS.map((day, index) => {
          const isStart = day.day === highlightDay;
          const isButterfly = day.day === 6;
          const isFinal = day.day === 7;

          return (
            <View key={day.id} style={styles.item}>
              <View
                style={[
                  styles.node,
                  compact && styles.nodeCompact,
                  isStart && styles.nodeStart,
                  isButterfly && styles.nodeButterfly,
                  isFinal && styles.nodeFinal,
                ]}>
                {isButterfly ? (
                  <Ionicons
                    name="infinite-outline"
                    size={compact ? 11 : 12}
                    color={onboardingTokens.primary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.nodeNum,
                      compact && styles.nodeNumCompact,
                      isStart && styles.nodeNumStart,
                    ]}>
                    {day.day}
                  </Text>
                )}
              </View>
              {(isStart || isButterfly || isFinal) && (
                <Text
                  style={[styles.label, compact && styles.labelCompact]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {isStart ? 'Başla' : isButterfly ? 'Kelebek' : 'Final'}
                </Text>
              )}
              {index < ROADMAP_DAYS.length - 1 ? (
                <View style={[styles.connector, compact && styles.connectorCompact]} />
              ) : null}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    padding: 12,
    borderRadius: onboardingRadii.lg,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  wrapCompact: {
    gap: 6,
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: onboardingTokens.textMuted,
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minWidth: 0,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.cardSoft,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  nodeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  nodeStart: {
    backgroundColor: onboardingTokens.primary,
    borderColor: onboardingTokens.primary,
  },
  nodeButterfly: {
    backgroundColor: onboardingTokens.lavender,
    borderColor: onboardingTokens.primary,
  },
  nodeFinal: {
    backgroundColor: onboardingTokens.card,
    borderColor: onboardingTokens.primary,
  },
  nodeNum: {
    fontSize: 11,
    fontWeight: '900',
    color: onboardingTokens.textMuted,
  },
  nodeNumCompact: {
    fontSize: 10,
  },
  nodeNumStart: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: '800',
    color: onboardingTokens.textMain,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 7,
    marginTop: 3,
  },
  connector: {
    position: 'absolute',
    top: 13,
    left: '62%',
    right: '-38%',
    height: 2,
    backgroundColor: '#D8D4F0',
    zIndex: -1,
  },
  connectorCompact: {
    top: 11,
  },
});
