import { Image, StyleSheet, View } from "react-native";

import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { colors } from "../constants/colors";

export default function LoadingScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require("../../assets/loading-cat.png")}
                style={styles.image}
                resizeMode="contain"
            />
            <Card style={styles.card}>
                <ScreenHeader title="Homi" subtitle="Preparing your home..." style={styles.header} />
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.screenBg,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    image: {
        width: 180,
        height: 180,
        marginBottom: 12,
    },
    card: {
        width: "100%",
        alignItems: "center",
    },
    header: {
        marginBottom: 0,
        alignItems: "center",
    },
});