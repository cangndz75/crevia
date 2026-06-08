import "react-native-gesture-handler";

import { initCrashReporter, markAppStart } from "@/core/crashPerformance/crashReporter";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { OnboardingFinishPayload } from "@/features/onboarding/screens/CreviaOnboardingScreen";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import {
  useAppBootstrap,
  type AppBootstrapPhase,
} from "@/features/onboarding/hooks/useAppBootstrap";
import { SplashGateScreen } from "@/features/onboarding/screens/SplashGateScreen";
import {
  ANIMATED_TAB_BAR_HEIGHT,
  AnimatedTabBar,
} from "@/ui/components/AnimatedTabBar";
import { CreviaErrorBoundary } from "@/ui/components/CreviaErrorBoundary";
import { GestureRootProvider } from "@/ui/providers/GestureRootProvider";
import { colors } from "@/ui/theme/colors";

SplashScreen.preventAutoHideAsync();

initCrashReporter();
markAppStart();

function TabNavigator() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          height: ANIMATED_TAB_BAR_HEIGHT,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Merkez" }} />
      <Tabs.Screen
        name="events"
        options={{
          title: "Operasyon",
          headerShown: false,
        }}
      />
      <Tabs.Screen name="risks" options={{ title: "Harita" }} />
      <Tabs.Screen name="progression" options={{ title: "Başarılar" }} />
      <Tabs.Screen name="social" options={{ href: null, title: "Sosyal Nabız" }} />
      <Tabs.Screen name="reports" options={{ title: "Rapor" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "Profil" }} />
      <Tabs.Screen name="leaderboard" options={{ href: null, title: "Liderlik" }} />
    </Tabs>
  );
}

type AppGateProps = {
  phase: AppBootstrapPhase;
  retrying: boolean;
  onRetry: () => void;
  onOnboardingComplete: (payload: OnboardingFinishPayload) => void | Promise<void>;
};

function AppGate({
  phase,
  retrying,
  onRetry,
  onOnboardingComplete,
}: AppGateProps) {
  if (phase === "offline") {
    return (
      <SplashGateScreen
        mode="offline"
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }

  if (phase === "onboarding") {
    return <OnboardingFlow onComplete={onOnboardingComplete} />;
  }

  return <SplashGateScreen mode="loading" />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });
  const bootstrap = useAppBootstrap();

  useEffect(() => {
    if ((fontsLoaded || fontError) && bootstrap.gateOpen) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, bootstrap.gateOpen]);

  const showBrandedSplash = !bootstrap.gateOpen;
  const fontsReady = fontsLoaded || fontError;

  return (
    <CreviaErrorBoundary>
      <GestureRootProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <View style={styles.root}>
          {!fontsReady ? null : showBrandedSplash ? (
            <SplashGateScreen mode="loading" />
          ) : bootstrap.phase === "ready" ? (
            <TabNavigator />
          ) : (
            <AppGate
              phase={bootstrap.phase}
              retrying={bootstrap.retrying}
              onRetry={bootstrap.retryConnection}
              onOnboardingComplete={bootstrap.completeOnboarding}
            />
          )}
          </View>
        </SafeAreaProvider>
      </GestureRootProvider>
    </CreviaErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
