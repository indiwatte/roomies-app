import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Zorg dat de splash screen blijft staan tot geladen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 1. Laad hier feitelijk het font in en geef het een schone naam: 'Fredoka'
  const [loaded] = useFonts({
    'Fredoka': Fredoka_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Houdt het scherm leeg tot het font klaar is
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
