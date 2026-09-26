import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../constants/colors';

type ButtonProps = {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'dark';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
};

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}: ButtonProps) {

   
    const variantStyles = {
        primary: { bg: colors.primary, text: colors.white, border: 'transparent' },
        dark: { bg: colors.dark, text: colors.white, border: 'transparent' },
        secondary: { bg: colors.blue, text: colors.dark, border: 'transparent' },
        outline: { bg: 'transparent', text: colors.dark, border: colors.dark },
    };

    const current = variantStyles[variant] || variantStyles.primary;

    const backgroundColor = disabled ? '#EFEBE4' : current.bg;
    const textColor = disabled ? '#A8A29E' : current.text;
    const borderColor = disabled ? 'transparent' : current.border;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                    opacity: pressed ? 0.85 : 1,
                },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: textColor }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#3C222D',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    text: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});