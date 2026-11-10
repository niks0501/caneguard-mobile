import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { OFFICE_CASE_COPY } from '@/constants/copy';
import { apiBaseUrl } from '@/config/env';
import { useTheme } from '@/hooks/use-theme';

/**
 * Thumbnail plus full-screen viewer for a photo that needs the session token.
 * The token is only ever attached to a url on the API origin, and a missing
 * photo or a failed load shows words instead of a broken image.
 */
export function GuardedPhoto({
  accessToken,
  emptyText,
  label,
  localUri,
  testID,
  url,
}: {
  accessToken?: string | null;
  emptyText: string;
  label: string;
  /** A copy already on this phone; shown without the network or a token. */
  localUri?: string | null;
  testID: string;
  url: string | null;
}) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!url) return <Notice testID={`${testID}.empty`} text={emptyText} />;
  const sourceUri = localUri ?? url;
  if (failedUri === sourceUri || (!localUri && (!accessToken || !isApiUrl(url)))) {
    return <Notice testID={`${testID}.unavailable`} text={OFFICE_CASE_COPY.photoUnavailable} />;
  }

  const source = localUri ? { uri: localUri } : { headers: { Authorization: `Bearer ${accessToken}` }, uri: url };
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Pressable
        testID={`${testID}.open`}
        accessibilityRole="imagebutton"
        accessibilityLabel={OFFICE_CASE_COPY.viewerOpen(label)}
        onPress={() => setOpen(true)}>
        <ExpoImage
          accessibilityLabel={label}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedUri(sourceUri)}
          source={source}
          style={styles.thumb}
          testID={testID}
        />
      </Pressable>
      <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop} testID={`${testID}.viewer`}>
          <ExpoImage
            accessibilityLabel={label}
            cachePolicy="memory-disk"
            contentFit="contain"
            onError={() => {
              setOpen(false);
              setFailedUri(sourceUri);
            }}
            source={source}
            style={styles.full}
          />
          <Pressable
            testID={`${testID}.close`}
            accessibilityRole="button"
            accessibilityLabel={OFFICE_CASE_COPY.viewerClose}
            onPress={() => setOpen(false)}
            style={styles.close}>
            <Text style={styles.closeText}>{OFFICE_CASE_COPY.viewerClose}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function Notice({ testID, text }: { testID: string; text: string }) {
  const theme = useTheme();
  return (
    <Text testID={testID} style={[styles.notice, { color: theme.textSecondary }]}>
      {text}
    </Text>
  );
}

function isApiUrl(url: string): boolean {
  try {
    return new URL(url).origin === new URL(apiBaseUrl).origin;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  block: { gap: Spacing.xs },
  label: { ...Typography.caption },
  thumb: { width: '100%', height: 160, borderRadius: Radius.md },
  notice: { ...Typography.caption },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  full: { flex: 1 },
  close: { position: 'absolute', top: Spacing['4xl'], right: Spacing.lg, padding: Spacing.md },
  closeText: { ...Typography.bodySmall, color: '#fff', fontWeight: '700' },
});
