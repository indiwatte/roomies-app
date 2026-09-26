import React, { forwardRef } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { colors } from '../constants/colors';

type CardProps = {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
};

const Card = forwardRef<View, CardProps>(function Card(
    { children, style, onPress, disabled },
    ref
) {
    if (onPress) {
        return (
            <Pressable
                ref={ref}
                onPress={onPress}
                disabled={disabled}
                style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
            >
                {children}
            </Pressable>
        );
    }

    return (
        <View ref={ref} style={[styles.card, style]}>
            {children}
        </View>
    );
});

export default Card;

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
    },
    pressed: {
        opacity: 0.85,
    },
});
