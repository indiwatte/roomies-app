import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    style?: StyleProp<ViewStyle>;
};

export default function ScreenHeader({ title, subtitle, style }: ScreenHeaderProps) {
    return (
        <View style={[styles.wrap, style]}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        minHeight: 84,
        justifyContent: "flex-start",
        marginBottom: 20,
    },
    title: {
        ...typography.title,
        fontSize: 28,
        color: colors.dark,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: "left",
    },
});
