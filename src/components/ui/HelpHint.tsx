import { Feather } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HelpHintGroupState = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const HelpHintGroupContext = createContext<HelpHintGroupState | null>(null);

/**
 * Wraps a screen (or sheet) that hosts several help hints so exactly one
 * help text is open at a time. Screens with a single hint do not need it:
 * a lone HelpHint manages its own state.
 */
export function HelpHintGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <HelpHintGroupContext.Provider value={{ openId, setOpenId }}>
      {children}
    </HelpHintGroupContext.Provider>
  );
}

export type HelpHintProps = {
  label: string;
  text: string;
  testID?: string;
};

/**
 * The phone's "tooltip" (decided option A): a 20 dp ⓘ icon inside a 44 dp
 * touch target on the same row as the label it explains. Tapping reveals the
 * explanation in place under the label, pushing content down instead of
 * covering it. The full help text is always the control's accessibilityHint,
 * so a screen reader gets it without a tap. Help never hides a value, a
 * state, a warning, an error, or a consequence — only an explanation.
 */
export function HelpHint({ label, testID, text }: HelpHintProps) {
  const theme = useTheme();
  const id = useId();
  const group = useContext(HelpHintGroupContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.openId === id : localOpen;

  const toggle = useCallback(() => {
    if (group) {
      group.setOpenId(group.openId === id ? null : id);
    } else {
      setLocalOpen((value) => !value);
    }
  }, [group, id]);

  return (
    <View style={styles.container}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Help: ${label}`}
        accessibilityHint={text}
        accessibilityState={{ expanded: open }}
        hitSlop={12}
        onPress={toggle}
        style={styles.target}>
        <Feather name="info" size={20} color={theme.primary} />
      </Pressable>
      {open ? (
        <Text style={[styles.helpText, { color: theme.textSecondary }]}>{text}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  target: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    ...Typography.caption,
  },
});
