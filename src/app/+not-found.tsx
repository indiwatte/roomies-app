import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Card from "@/components/Card";
import { colors } from "../constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>This screen does not exist.</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Go to home screen</Text>
          </Link>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.screenBg,
  },
  card: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.dark,
  },
  link: {
    marginTop: 16,
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 16,
    color: colors.dark,
    textDecorationLine: "underline",
  },
});
