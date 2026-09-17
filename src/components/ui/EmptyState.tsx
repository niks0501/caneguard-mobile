import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type EmptyStateProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Feather.glyphMap;
    variant?: 'primary' | 'secondary';
    testID?: string;
  };
  children?: ReactNode;
  liveRegion?: 'none' | 'polite' | 'assertive';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function EmptyState({
  action,
  children,
  icon,
  liveRegion,
  message,
  style,
  testID,
  title,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Card
      accessibilityLiveRegion={liveRegion}
      style={[
        styles.card,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        style,
      ]}
      testID={testID}
      variant="flat">
      <Feather name={icon} size={28} color={theme.primary} />
      <Text style={[styles.title, { color: theme.primaryDark }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {action ? (
        <View style={styles.actionContainer}>
          <AppButton
            leadingIcon={action.icon}
            onPress={action.onPress}
            testID={action.testID}
            variant={action.variant ?? 'primary'}>
            {action.label}
          </AppButton>
        </View>
      ) : null}
      {children ? <View style={styles.childrenContainer}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.subheading,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  childrenContainer: {
    marginTop: Spacing.sm,
  },
});
