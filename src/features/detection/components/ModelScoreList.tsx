import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import {
  MODEL_LABELS,
  type ModelLabel,
} from '@/features/detection/constants/modelContract';
import { useTheme } from '@/hooks/use-theme';

export type ModelScore = {
  label: string;
  score: number;
};

/**
 * The single shared definition of the per-condition model score table,
 * rendered on both the analysis result (T2) and the saved record detail
 * (T1) screens so the two presentations cannot drift apart.
 */
export function ModelScoreList({ scores }: { scores: ModelScore[] }) {
  return (
    <View>
      {MODEL_LABELS.map((label) => (
        <ModelScoreRow
          key={label}
          label={label}
          score={scores.find((item) => item.label === label)?.score}
        />
      ))}
    </View>
  );
}

function ModelScoreRow({ label, score }: { label: ModelLabel; score?: number }) {
  const theme = useTheme();
  const metadata = diseaseCatalog[label];
  const value = score === undefined ? 'Unavailable' : formatPercentage(score);

  return (
    <View
      accessibilityLabel={`${metadata.label === 'healthy' ? 'Healthy' : metadata.displayName} score ${value}`}
      style={styles.scoreRow}>
      <View style={styles.scoreLabel}>
        <Feather
          name={metadata.icon}
          size={17}
          color={theme[metadata.themeToken.foreground]}
        />
        <Text style={[styles.scoreName, { color: theme.text }]}>
          {metadata.label === 'healthy' ? 'Healthy' : metadata.displayName}
        </Text>
      </View>
      <Text style={[styles.scoreValue, { color: theme.primaryDark }]}>{value}</Text>
    </View>
  );
}

function formatPercentage(score: number) {
  return `${Math.round(score * 100)}%`;
}

const styles = StyleSheet.create({
  scoreRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  scoreLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreName: { ...Typography.bodySmall, flex: 1 },
  scoreValue: { ...Typography.body, fontWeight: '800' },
});
