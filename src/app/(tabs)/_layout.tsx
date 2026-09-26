import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Tabs } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRooms } from "@/features/rooms/room-context";
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';


type AnimatedTabIconProps = {
  focused: boolean;
  color: ColorValue;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

function AnimatedTabIcon({
  focused,
  color,
  label,
  icon,
}: AnimatedTabIconProps) {
  const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const textOpacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const textTranslate = useRef(new Animated.Value(focused ? 0 : 2)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        speed: 15,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: focused ? 1 : 0.7,
        duration: focused ? 180 : 130,
        easing: focused ? Easing.in(Easing.quad) : Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslate, {
        toValue: focused ? 0 : 2,
        duration: focused ? 200 : 140,
        easing: focused ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, textOpacity, textTranslate]);

  const iconSize = useMemo(() => (focused ? 26 : 22), [focused]);

  return (
    <Animated.View
      style={[
        styles.tabPill,
        focused && styles.tabPillFocused,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={icon ?? "ellipse"} size={iconSize} color={color} />
      </Animated.View>

      <Animated.View
        style={[
          styles.labelWrap,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
          },
        ]}
      >
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

function TopRightProfileBar() {
  const insets = useSafeAreaInsets();
  const { members } = useRooms();
  const currentUser = members.find((member) => member.id === "you") ?? members[0];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.profileBarWrap, { top: insets.top + 8, right: Math.max(insets.right, 16) }]}
    >
      <Pressable
        style={styles.profileBadge}
        onPress={() => router.push("/profile")}
      >
        {currentUser?.avatarUri ? (
          <Image source={{ uri: currentUser.avatarUri }} style={styles.profileImage} />
        ) : (
          <View
            style={[
              styles.profileImage,
              { backgroundColor: currentUser?.avatarColor ?? colors.green },
            ]}
          >
            <Text style={styles.profileInitials}>{currentUser?.initials ?? "YO"}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { currentRoom } = useRooms();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !currentRoom) {
      router.replace("/");
    }
  }, [currentRoom, isLoading]);


  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8F7F4", alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("../../../assets/loading-cat.png")}
          style={{ width: 160, height: 160, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#222", marginBottom: 6 }}>
          I see you...
        </Text>
        <Text style={{ fontSize: 14, color: "#666", fontStyle: "italic" }}>
          Even loeren naar je huishouden...
        </Text>
      </View>
    );
  }

  if (!currentRoom) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.dark,
          headerTitleStyle: { fontWeight: "700" },

          tabBarStyle: {
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 18,
            height: 94,
            paddingTop: 10,
            paddingBottom: Platform.OS === "ios" ? 20 : 12,
            borderRadius: 30,
            borderTopWidth: 0,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.blue,
            shadowColor: "#C78CB0",
            shadowOpacity: 0.16,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          },
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarItemStyle: {
            flex: 1,
            marginHorizontal: 1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon focused={focused} color={color} label="Home" icon="home-outline" />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon focused={focused} color={color} label="Tasks" icon="checkbox-outline" />
            ),
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: "Rewards",
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon focused={focused} color={color} label="Rewards" icon="trophy-outline" />
            ),
          }}
        />
        <Tabs.Screen
          name="members"
          options={{
            title: "Members",
            tabBarIcon: ({ focused, color }) => (
              <AnimatedTabIcon focused={focused} color={color} label="Members" icon="people-outline" />
            ),
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>

      <TopRightProfileBar />
    </View>
  );
}

const styles = StyleSheet.create({
  tabPill: {
    minWidth: 58,
    height: 54,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tabPillFocused: {
    backgroundColor: colors.blue,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  labelWrap: {
    marginTop: 2,
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileBarWrap: {
    position: "absolute",
    zIndex: 20,
    elevation: 20,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.white,
    shadowColor: "#C78CB0",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  profileImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.dark,
  },
});

