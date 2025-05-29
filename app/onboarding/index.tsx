import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';

const slides = [
  {
    id: '1',
    title: 'Simplify Your Financial Access',
    description: 'We will help you consolidate your credit card and make payments easier, so you can focus on other more important matters.',
    image: require('../../assets/images/onboard1.jpg'),
  },
  {
    id: '2',
    title: 'Track Everything in One Place',
    description: 'Visualize and manage your finances with ease, all from a single app.',
    image: require('../../assets/images/onboard1.jpg'),
  },
  {
    id: '3',
    title: 'Secure and Reliable',
    description: 'Your data is protected with industry-leading encryption and privacy standards.',
    image: require('../../assets/images/onboard1.jpg'),
  },
];

const { height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = slides[currentIndex];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/auth/login')
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <ImageBackground source={currentSlide.image} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ position: 'absolute', top: 20, right: 24 }}>
          {currentIndex < slides.length - 1 && (
            <TouchableOpacity onPress={() => router.push('/auth/login')} style={{ padding: 10 }}>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        <Animated.View entering={FadeInUp.duration(500)} style={{ alignItems: 'center', marginTop: 80 }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 150, height: 150, resizeMode: 'contain', marginBottom: 24 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12, paddingHorizontal: 20 }}>
            {currentSlide.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 22, paddingHorizontal: 30 }}>
            {currentSlide.description}
          </Text>
        </Animated.View>

        <View style={{ position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={handleBack}>
              <Text style={{ fontSize: 16, color: '#A78BFA' }}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 48 }} />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginHorizontal: 4,
                  backgroundColor: currentIndex === i ? '#7C3AED' : '#DDD6FE',
                }}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleNext}>
            <Text style={{ fontSize: 16, color: '#7C3AED', fontWeight: 'bold' }}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
