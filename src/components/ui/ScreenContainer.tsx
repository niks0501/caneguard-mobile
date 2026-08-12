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
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ children, contentStyle }: ScreenContainerProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        testID="screen-container.keyboard-avoiding-view"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
          style={styles.scrollView}>
          <View style={[styles.content, contentStyle]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    flexGrow: 1,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing['2xl'],
  },
});
