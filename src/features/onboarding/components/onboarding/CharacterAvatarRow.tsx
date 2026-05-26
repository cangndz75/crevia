import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { WELCOME_CHARACTERS } from '@/features/onboarding/data/onboardingData';
import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

export function CharacterAvatarRow() {
  return (
    <View style={styles.row}>
      {WELCOME_CHARACTERS.map((character, index) => (
        <Animated.View
          key={character.id}
          entering={FadeInUp.delay(520 + index * 70).springify()}
          style={styles.item}>
          <View style={styles.avatarRing}>
            <Image
              source={onboardingAssets.characters[character.assetKey]}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.roleBadge}>
              <Ionicons name={character.roleIcon} size={10} color={onboardingTokens.primary} />
            </View>
          </View>
          <Text style={styles.label}>{character.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: onboardingTokens.border,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: onboardingTokens.textMain,
  },
});
