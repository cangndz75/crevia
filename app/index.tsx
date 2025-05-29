import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import PrimaryButton from '@/components/PrimaryButton';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
      <Animated.Image
        source={require('@/assets/images/logo.png')}
        style={{ width: 100, height: 100, marginBottom: 30 }}
        entering={ZoomIn.duration(800)}
      />

      <Animated.Text
        entering={FadeInDown.delay(300).duration(500)}
        style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#1E3A8A',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        Crevia
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(600).duration(500)}
        style={{
          fontSize: 16,
          color: '#4B5563',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 40,
        }}
      >
        Mimarlıkta süreç yönetimini yeniden tanımlayan bir platform.
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(1000).duration(500)}>
        <PrimaryButton label="Hadi Başlayalım" onPress={() => router.push('/onboarding')} />
      </Animated.View>
    </View>
  );
}
