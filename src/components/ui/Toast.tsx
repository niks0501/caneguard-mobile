import { Feather } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Layout,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastState extends ToastOptions {
  id: number;
}

export interface ToastContextValue {
  showToast: (
    messageOrOptions: string | ToastOptions,
    type?: ToastType,
  ) => void;
  hideToast: () => void;
  toast: ToastState | null;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
  toast: null,
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(
    (messageOrOptions: string | ToastOptions, typeParam?: ToastType) => {
      const options: ToastOptions =
        typeof messageOrOptions === 'string'
          ? { message: messageOrOptions, type: typeParam ?? 'success' }
          : messageOrOptions;

      const state: ToastState = {
        id: ++nextId.current,
        message: options.message,
        type: options.type ?? 'success',
        duration: options.duration ?? 3500,
      };

      setToast(state);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ showToast, hideToast, toast }),
    [showToast, hideToast, toast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toast={toast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  return <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-24));
  const [opacity] = useState(() => new Animated.Value(0));
  const useNativeDriver = Platform.OS !== 'web' && process.env.NODE_ENV !== 'test';

  const dismiss = useCallback(() => {
    if (process.env.NODE_ENV === 'test') {
      onDismiss();
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -24,
        duration: 150,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, opacity, translateY, useNativeDriver]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      translateY.setValue(0);
      opacity.setValue(1);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver,
        }),
      ]).start();
    }

    const timer = setTimeout(() => {
      dismiss();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [dismiss, opacity, toast.duration, translateY, useNativeDriver]);

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  const backgroundColor = isError
    ? theme.dangerBg
    : isInfo
      ? theme.infoBg
      : theme.successBg;

  const borderColor = isError
    ? theme.danger
    : isInfo
      ? theme.info
      : theme.success;

  const iconName: keyof typeof Feather.glyphMap = isError
    ? 'alert-circle'
    : isInfo
      ? 'info'
      : 'check-circle';

  const iconColor = borderColor;

  const topOffset = Math.max(insets.top, Spacing.md) + Spacing.xs;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: topOffset }]}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}>
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
          accessibilityLabel={toast.message}
          onPress={dismiss}
          testID="app-toast"
          style={[
            styles.toast,
            {
              backgroundColor,
              borderColor,
            },
            Shadows.md,
          ]}>
          <Feather name={iconName} size={18} color={iconColor} />
          <Text
            style={[
              styles.message,
              { color: theme.text },
            ]}
            numberOfLines={3}>
            {toast.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  animatedWrapper: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  message: {
    ...Typography.bodySmall,
    fontWeight: '700',
    flex: 1,
  },
});
