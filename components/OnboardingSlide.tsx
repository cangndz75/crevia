import React from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

type OnboardingSlideProps = {
  title: string;
  description: string;
  image: any;
  isLast: boolean;
  showBack: boolean;
  showSkip: boolean;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

export default function OnboardingSlide({
  title,
  description,
  image,
  isLast,
  showBack,
  showSkip,
  onNext,
  onSkip,
  onBack,
}: OnboardingSlideProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        {showSkip && (
          <TouchableOpacity onPress={onSkip}>
            <Text style={{ fontSize: 16, color: '#6B7280' }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={image} style={{ width: 280, height: 220, resizeMode: 'contain' }} />
      </View>

      <View
        style={{
          height: height * 0.35,
          backgroundColor: '#5B21B6',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 24,
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 15, color: '#EDE9FE', textAlign: 'center', lineHeight: 22 }}>
            {description}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNext}
          style={{
            backgroundColor: '#F472B6',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 999,
            alignSelf: 'center',
            marginTop: 16,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
