import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useMobileNotifications } from '@/features/notifications/hooks/useMobileNotifications';
import { useNotificationDestinations } from '@/features/notifications/hooks/useNotificationDestinations';
import { notificationDestinationRoute } from '@/features/notifications/services/resolveNotificationDestination';
import { useTheme } from '@/hooks/use-theme';

export default function NotificationDetailsScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  const notifications = useMobileNotifications();
  const notification = notifications.notifications.find((item) => item.id === id) ?? null;
  const destinations = useNotificationDestinations(notification ? [notification] : []);
  const destination = notification ? destinations.get(notification.id) : undefined;

  const route = destination ? notificationDestinationRoute(destination) : null;
  const advisoryTitle = notification?.advisory?.title ?? notification?.title ?? null;
  const advisoryBody = notification?.advisory?.content
    ?? notification?.content
    ?? notification?.message
    ?? null;

  return (
    <SafeAreaView
      testID="notification.details-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Office update" subtitle="Advice from the CaneGuard office" />
        {notification ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}>
                <Text style={[styles.label, { color: theme.primary }]}>Advisory</Text>
                <Text
                  testID="notification.details.title"
                  accessibilityRole="header"
                  style={[styles.title, { color: theme.primaryDark }]}>
                  {advisoryTitle}
                </Text>
                <Text
                  testID="notification.details.body"
                  style={[styles.body, { color: theme.text }]}>
                  {advisoryBody}
                </Text>
                {notification.advisory && notification.content ? (
                  <View style={[styles.context, { borderTopColor: theme.divider }]}>
                    <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>Office message</Text>
                    <Text style={[styles.contextBody, { color: theme.textSecondary }]}>
                      {notification.content}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {notification.referenceCode ?? 'Office update'}
                  {notification.createdAt ? ` · ${formatDate(notification.createdAt)}` : ''}
                </Text>
              </View>

              {route ? (
                <AppButton
                  testID="notification.details.open-related"
                  accessibilityLabel="Open related activity"
                  onPress={() => router.push(route as never)}
                  leadingIcon="arrow-up-right">
                  Open related activity
                </AppButton>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.state}>
            {notifications.refreshing ? (
              <ActivityIndicator
                accessibilityLabel="Loading office update"
                color={theme.primary}
                size="large"
              />
            ) : null}
            <Text accessibilityRole="header" style={[styles.stateTitle, { color: theme.primaryDark }]}>
              Office update unavailable
            </Text>
            <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>
              {notifications.errorMessage ?? 'This office update is no longer available on this device.'}
            </Text>
            <AppButton
              onPress={() => void notifications.refresh({ force: true })}
              leadingIcon="refresh-cw">
              Refresh updates
            </AppButton>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: ComponentTokens.card.padding,
    gap: Spacing.md,
  },
  label: { ...Typography.label, textTransform: 'uppercase' },
  title: { ...Typography.title },
  body: { ...Typography.body },
  context: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  contextLabel: { ...Typography.label },
  contextBody: { ...Typography.bodySmall },
  meta: { ...Typography.caption },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  stateTitle: { ...Typography.heading, textAlign: 'center' },
  stateMessage: { ...Typography.body, textAlign: 'center' },
});
