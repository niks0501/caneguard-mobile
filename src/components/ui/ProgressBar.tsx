import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  progress: number;
  color: string;
};

export function ProgressBar({ progress, color }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${clamped * 100}%` as any,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
