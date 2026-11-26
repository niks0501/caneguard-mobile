import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FarmerInquiryItem } from '@/features/farmer-care/data/farmerCareRepository';
import { inquiryStage, type FarmerInquiryStage } from '@/features/farmer-care/domain/farmerCareTypes';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

const STEP_ORDER: FarmerInquiryStage[] = ['sent', 'looking', 'advice'];

/**
 * Where a farmer's question to the office stands: Sent, Looking, Advice ready.
 * A question still waiting for signal reads as saved, never as an error.
 */
export function FarmerInquiryTracker({
  inquiry,
  onAskAgain,
  onRemoveUnsent,
}: {
  inquiry: FarmerInquiryItem;
  onAskAgain: () => void;
  onRemoveUnsent: () => void;
}) {
  const theme = useTheme();
  const copy = useFarmerCopy().care.track;
  const stage = inquiryStage(inquiry);
  const failed = inquiry.syncStatus === 'failed';
  const reached = stage === 'queued' ? -1 : STEP_ORDER.indexOf(stage);
  const message = failed
    ? copy.failed
    : stage === 'queued'
      ? copy.queued
      : stage === 'sent'
        ? copy.sent
        : stage === 'looking'
          ? copy.looking
          : copy.advice;

  return (
    <View
      testID="farmer-care.tracker"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
        {copy.heading}
      </Text>
      <View style={styles.steps} accessibilityRole="progressbar">
        {STEP_ORDER.map((step, index) => {
          const done = !failed && index <= reached;
          return (
            <View key={step} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: done ? theme.primary : 'transparent', borderColor: done ? theme.primary : theme.border },
                ]}
              />
              <Text style={[styles.stepLabel, { color: done ? theme.text : theme.textSecondary }]}>
                {copy.steps[step as 'sent' | 'looking' | 'advice']}
              </Text>
            </View>
          );
        })}
      </View>
      <Text
        testID="farmer-care.tracker.message"
        accessibilityLiveRegion="polite"
        style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </Text>
      {inquiry.replies.map((reply) => (
        <View key={reply.id} style={[styles.reply, { backgroundColor: theme.successBg }]}>
          <Text style={[styles.replyLabel, { color: theme.text }]}>
            {reply.advisoryTitle ?? copy.officeSays}
          </Text>
          <Text style={[styles.replyBody, { color: theme.text }]}>{reply.body}</Text>
        </View>
      ))}
      {failed || stage === 'advice' ? (
        <AppButton testID="farmer-care.ask-again" variant="secondary" onPress={onAskAgain}>
          {copy.askAgain}
        </AppButton>
      ) : null}
      {inquiry.syncStatus !== 'synced' ? (
        <AppButton testID="farmer-care.remove-unsent" variant="text" onPress={onRemoveUnsent}>
          {copy.removeUnsent}
        </AppButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  heading: { ...Typography.subheading },
  steps: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  step: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  dot: { width: 16, height: 16, borderRadius: Radius.full, borderWidth: 2 },
  stepLabel: { ...Typography.caption, textAlign: 'center' },
  message: { ...Typography.body },
  reply: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs },
  replyLabel: { ...Typography.label },
  replyBody: { ...Typography.body },
});
