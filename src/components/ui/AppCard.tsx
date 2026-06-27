import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ComponentTokens, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, style }: AppCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: ComponentTokens.card.padding,
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    ...Shadows.sm,
  },
});
