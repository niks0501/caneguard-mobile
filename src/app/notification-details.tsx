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
import { FARMER_COPY, OFFICE_UPDATE_NOT_ON_PHONE } from '@/constants/copy';
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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';
import { formatDate } from '@/lib/formatters';

export default function NotificationDetailsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const { language } = useLanguagePreference();
  const farmerCopy = FARMER_COPY[language];
  const copy = farmerCopy.notificationDetails;
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  const notifications = useMobileNotifications();
  const notification = notifications.notifications.find((item) => item.id === id) ?? null;
  const destinations = useNotificationDestinations(notification ? [notification] : []);
  const destination = notification ? destinations.get(notification.id) : undefined;

  const route = destination ? notificationDestinationRoute(destination) : null;
  const advisoryTitle = notification
    ? notification.advisory?.title ?? notification.title
    : null;
  const advisoryBody = notification
    ? notification.advisory?.content ?? notification.content ?? notification.message
    : null;

  return (
    <SafeAreaView
      testID="notification.details-screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader
          title={isFarmer ? copy.headerTitle : 'Office update'}
          subtitle={isFarmer ? copy.headerSubtitle : 'Advice from the CaneGuard office'}
        />
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
                <Text style={[styles.label, { color: theme.primary }]}>{isFarmer ? copy.advisoryLabel : 'Advisory'}</Text>
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
                    <Text style={[styles.contextLabel, { color: theme.textSecondary }]}>{isFarmer ? copy.officeMessageLabel : 'Office message'}</Text>
                    <Text style={[styles.contextBody, { color: theme.textSecondary }]}>
                      {notification.content}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  {notification.referenceCode ?? (isFarmer ? copy.referenceFallback : 'Office update')}
                  {notification.createdAt ? ` · ${formatDate(notification.createdAt, isFarmer ? copy.recently : 'Recently')}` : ''}
                </Text>
              </View>

              {route ? (
                <AppButton
                  testID="notification.details.open-related"
                  accessibilityLabel={isFarmer ? copy.openRelatedAccessibility : 'Open related activity'}
                  onPress={() => router.push(route as never)}
                  leadingIcon="arrow-up-right">
                  {isFarmer ? copy.openRelated : 'Open related activity'}
                </AppButton>
              ) : destination?.kind === 'unavailable' ? (
                <Text
                  testID="notification.details.not-on-phone"
                  accessibilityLiveRegion="polite"
                  style={[styles.notOnPhone, { color: theme.textSecondary }]}>
                  {isFarmer ? farmerCopy.officeUpdates.notOnPhone : OFFICE_UPDATE_NOT_ON_PHONE}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.state}>
            {notifications.refreshing ? (
              <ActivityIndicator
                accessibilityLabel={isFarmer ? copy.loading : 'Loading office update'}
                color={theme.primary}
                size="large"
              />
            ) : null}
            <Text accessibilityRole="header" style={[styles.stateTitle, { color: theme.primaryDark }]}>
              {isFarmer ? copy.unavailableTitle : 'Office update unavailable'}
            </Text>
            <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>
              {isFarmer
                ? notifications.errorMessage ? farmerCopy.officeUpdates.loadError : copy.unavailableMessage
                : notifications.errorMessage ?? 'This office update is no longer available on this device.'}
            </Text>
            <AppButton
              onPress={() => void notifications.refresh({ force: true })}
              leadingIcon="refresh-cw">
              {isFarmer ? copy.retry : 'Refresh updates'}
            </AppButton>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
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
    borderRadius: Radius.lg,
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
  notOnPhone: { ...Typography.bodySmall },
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
