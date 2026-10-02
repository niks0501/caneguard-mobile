import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComponentTokens, Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  testID?: string;
};

export function ScreenContainer({
  children,
  header,
  footer,
  contentStyle,
  scrollable = true,
  testID,
}: ScreenContainerProps) {
  const theme = useTheme();

  const bodyContent = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView testID={testID} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {header}
      <KeyboardAvoidingView
        testID="screen-container.keyboard-avoiding-view"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}>
        {scrollable ? (
          <ScrollView
            testID="screen-container.scroll-view"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}>
            {bodyContent}
          </ScrollView>
        ) : (
          <View style={[styles.nonScrollContent, { backgroundColor: theme.background }]}>
            {bodyContent}
          </View>
        )}
      </KeyboardAvoidingView>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  nonScrollContent: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    flexGrow: 1,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
  },
});
