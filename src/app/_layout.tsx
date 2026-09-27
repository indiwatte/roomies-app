import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Fredoka': Fredoka_700Bold,
  });

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });

    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-room" options={{ presentation: "modal" }} />
        <Stack.Screen name="join-room" options={{ presentation: "modal" }} />
        <Stack.Screen name="add-task" options={{ presentation: "modal" }} />
        <Stack.Screen name="task-detail" options={{ title: "Task detail" }} />
        <Stack.Screen name="room/[code]" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
