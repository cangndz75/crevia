import "react-native-gesture-handler";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ANIMATED_TAB_BAR_HEIGHT,
  AnimatedTabBar,
} from "@/ui/components/AnimatedTabBar";

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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TabNavigator />
    </SafeAreaProvider>
  );
}
