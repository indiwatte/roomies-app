import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";

type ButtonVariant = "primary" | "dark" | "light" | "outline" | "secondary" | "ghost";

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    icon?: ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
    primary: {
        container: { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1 },
        text: { color: colors.white },
    },
    dark: {
        container: { backgroundColor: colors.dark, borderColor: colors.dark, borderWidth: 1 },
        text: { color: colors.white },
    },
    light: {
        container: { backgroundColor: colors.white, borderColor: colors.background, borderWidth: 1 },
        text: { color: colors.dark },
    },
    outline: {
        container: { backgroundColor: colors.background, borderColor: colors.dark, borderWidth: 1 },
        text: { color: colors.dark },
    },
    secondary: {
        container: { backgroundColor: colors.blue, borderColor: colors.blue, borderWidth: 1 },
        text: { color: colors.dark },
    },
    ghost: {
        container: { backgroundColor: colors.background, borderColor: colors.background, borderWidth: 1 },
        text: { color: colors.dark },
    },
};

export default function Button({
    title,
    onPress,
    variant = "primary",
    disabled = false,
    icon,
    style,
    textStyle,
}: ButtonProps) {
    const tone = variantStyles[variant] ?? variantStyles.primary;

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                styles.base,
                tone.container,
                disabled && styles.disabled,
                pressed && !disabled && styles.pressed,
                style,
            ]}
        >
            <View style={styles.content}>
                {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
                <Text style={[styles.label, tone.text, textStyle]}>{title}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: 48,
        borderRadius: 14,
        paddingHorizontal: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrap: {
        marginRight: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: "700",
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.85,
    },
});