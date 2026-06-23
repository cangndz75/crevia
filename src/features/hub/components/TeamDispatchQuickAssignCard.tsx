import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { teamDispatch } from '@/features/hub/theme/teamDispatchTokens';
import { CreviaAnimatedPressable } from '@/shared/motion';

type TeamDispatchQuickAssignCardProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

function TexturePattern() {
  const dots = [
    { top: 12, left: '18%' as const, size: 48 },
    { top: 28, left: '62%' as const, size: 36 },
    { bottom: 10, left: '42%' as const, size: 56 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((dot, index) => (
        <View
          key={index}
          style={[
            styles.textureDot,
            {
              top: dot.top,
              bottom: dot.bottom,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function TeamDispatchQuickAssignCard({
  title,
  subtitle,
  onPress,
}: TeamDispatchQuickAssignCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(80).duration(380)}>
      <CreviaAnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.pressable}>
        <LinearGradient
          colors={[teamDispatch.primaryGreen, teamDispatch.primaryGreenDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}>
          <TexturePattern />

          <View style={styles.compassWrap}>
            <Ionicons name="compass" size={24} color={teamDispatch.gold} />
          </View>

          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          <View style={styles.arrowWrap}>
            <Ionicons name="arrow-forward" size={18} color={teamDispatch.primaryGreen} />
          </View>
        </LinearGradient>
      </CreviaAnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    minHeight: 88,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    overflow: 'hidden',
  },
  textureDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  compassWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 16,
  },
  arrowWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: teamDispatch.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
