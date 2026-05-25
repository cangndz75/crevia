import "react-native-gesture-handler";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
import { colors } from "@/ui/theme/colors";

SplashScreen.preventAutoHideAsync();

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
          title: "Olaylar",
          headerShown: false,
        }}
      />
      <Tabs.Screen name="risks" options={{ title: "Riskler" }} />
      <Tabs.Screen name="progression" options={{ title: "Yetkiler" }} />
      <Tabs.Screen name="reports" options={{ title: "Rapor" }} />
    </Tabs>
  );
}

type AppGateProps = {
  phase: AppBootstrapPhase;
  retrying: boolean;
  onRetry: () => void;
  onOnboardingComplete: () => void | Promise<void>;
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const showBrandedSplash = !bootstrap.gateOpen;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.root}>
        {showBrandedSplash ? (
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
