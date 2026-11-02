import { Feather } from '@expo/vector-icons';
import { Image, type ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HOME_NOTE_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { fieldGuideEntries } from '@/features/field-guide/constants/fieldGuideEntries';
import { useTheme } from '@/hooks/use-theme';

export type HomeToolTile = {
  accessibilityLabel?: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
};

/** Icon tiles for the field tools, in one row. */
export function HomeToolTiles({ tiles }: { tiles: HomeToolTile[] }) {
  const theme = useTheme();

  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <Pressable
          accessibilityLabel={tile.accessibilityLabel ?? tile.label}
          accessibilityRole="button"
          key={tile.testID}
          onPress={tile.onPress}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && styles.pressed,
          ]}
          testID={tile.testID}>
          <Feather name={tile.icon} size={22} color={theme.primary} />
          <Text style={[styles.tileLabel, { color: theme.text }]}>{tile.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const SIGN_ENTRY_IDS = ['healthy', 'mosaic', 'rust', 'smut'] as const;

const signEntries = SIGN_ENTRY_IDS.flatMap((id) => {
  const entry = fieldGuideEntries.find((candidate) => candidate.id === id);
  const photo = entry?.images[0];
  return entry && photo ? [{ id, name: entry.shortName, sign: entry.signs[0], photo }] : [];
});

/** Horizontal strip of reference photos with one sign each; tapping opens that field-guide entry. */
export function HomeSignsStrip({ onOpenEntry }: { onOpenEntry: (id: string) => void }) {
  const theme = useTheme();
  if (signEntries.length === 0) return null;

  return (
    <View style={styles.section} testID="home.signs">
      <Text style={[styles.heading, { color: theme.textSecondary }]}>
        {HOME_NOTE_COPY.signsHeading}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {signEntries.map((entry) => (
          <Pressable
            accessibilityLabel={`${entry.name}. ${entry.sign}`}
            accessibilityRole="button"
            key={entry.id}
            onPress={() => onOpenEntry(entry.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && styles.pressed,
            ]}
            testID={`home.sign.${entry.id}`}>
            <Image
              accessibilityLabel={`${entry.name} ${HOME_NOTE_COPY.referencePhoto.toLowerCase()}`}
              source={entry.photo.source as ImageSourcePropType}
              style={styles.photo}
              resizeMode="cover"
            />
            <View style={styles.cardText}>
              <Text style={[styles.cardName, { color: theme.text }]}>{entry.name}</Text>
              <Text numberOfLines={2} style={[styles.cardSign, { color: theme.textSecondary }]}>
                {entry.sign}
              </Text>
              <Text style={[styles.cardCue, { color: theme.textSecondary }]}>
                {HOME_NOTE_COPY.referencePhoto}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  tileLabel: { ...Typography.bodySmall, fontWeight: '500', textAlign: 'center' },
  section: { gap: Spacing.sm },
  heading: { ...Typography.label },
  strip: { gap: Spacing.md },
  card: {
    width: 200,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 112 },
  cardText: { padding: Spacing.md, gap: Spacing.xs },
  cardName: { ...Typography.body, fontWeight: '500' },
  cardSign: { ...Typography.bodySmall },
  cardCue: { ...Typography.bodySmall },
  pressed: { opacity: 0.74 },
});
