import {
  FIELD_REPORT_FLOW_PHASES,
  FIELD_REPORT_FLOW_TRANSITIONS,
  canTransition,
  createFieldReportFlowState,
  isFlowBusy,
  reduceFieldReportFlow,
  type FieldReportFlowEvent,
  type FieldReportFlowPhase,
  type FieldReportFlowState,
} from '@/features/reports/domain/fieldReportFlow';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';

function report(authoringState: 'draft' | 'finalized' = 'draft'): FieldReport {
  return { authoringState, id: 'r1' } as FieldReport;
}

function run(
  events: FieldReportFlowEvent[],
  from: FieldReportFlowState = createFieldReportFlowState(),
): FieldReportFlowState {
  return events.reduce(reduceFieldReportFlow, from);
}

const opened = (): FieldReportFlowState =>
  run([{ type: 'LOADED', data: report() }]);

describe('field report flow reducer', () => {
  // Proves: "named states from empty through complete".
  it('walks empty -> loading -> draft -> confirming -> finalizing -> sending -> complete', () => {
    let state = createFieldReportFlowState('empty');
    const seen: FieldReportFlowPhase[] = [state.phase];
    const steps: FieldReportFlowEvent[] = [
      { type: 'LOAD_STARTED' },
      { type: 'LOADED', data: report() },
      { type: 'CONFIRM_OPENED' },
      { type: 'FINALIZE_STARTED' },
      { type: 'FINALIZE_SUCCEEDED', data: report('finalized') },
      { type: 'SEND_ENDED' },
    ];
    for (const step of steps) {
      state = reduceFieldReportFlow(state, step);
      seen.push(state.phase);
    }
    expect(seen).toEqual([
      'empty',
      'loading',
      'draft',
      'confirming',
      'finalizing',
      'sending',
      'complete',
    ]);
  });

  // Proves: "a report can no longer be lost mid-flow" (reload cannot wipe a running write).
  it('refuses a reload while a save, place write or finalize is running', () => {
    for (const start of [
      'SAVE_STARTED',
      'PLACE_STARTED',
      'FINALIZE_STARTED',
    ] as const) {
      const running = run([{ type: start }], opened());
      expect(running.data).not.toBeNull();
      expect(reduceFieldReportFlow(running, { type: 'LOAD_STARTED' })).toBe(
        running,
      );
    }
  });

  // Proves: "a report can no longer be corrupted mid-flow" (no second finalize, no save during finalize).
  it('refuses a second finalize and a save while finalizing', () => {
    const finalizing = run([{ type: 'FINALIZE_STARTED' }], opened());
    expect(finalizing.phase).toBe('finalizing');
    expect(reduceFieldReportFlow(finalizing, { type: 'FINALIZE_STARTED' })).toBe(
      finalizing,
    );
    expect(reduceFieldReportFlow(finalizing, { type: 'SAVE_STARTED' })).toBe(
      finalizing,
    );
    expect(isFlowBusy(finalizing)).toBe(true);
  });

  // Proves: "one transition table" - every phase has a row and every named target is a real phase.
  it('keeps one total table whose targets are all named phases', () => {
    expect(Object.keys(FIELD_REPORT_FLOW_TRANSITIONS).sort()).toEqual(
      [...FIELD_REPORT_FLOW_PHASES].sort(),
    );
    for (const row of Object.values(FIELD_REPORT_FLOW_TRANSITIONS)) {
      for (const target of Object.values(row)) {
        expect([
          ...FIELD_REPORT_FLOW_PHASES,
          'same',
          'resolved',
          'dismissed',
        ]).toContain(target);
      }
    }
  });

  // Proves: "never guesses where it stands from flags" - a finalized load is complete, not draft.
  it('resolves a loaded finalized report to complete', () => {
    expect(run([{ type: 'LOADED', data: report('finalized') }]).phase).toBe(
      'complete',
    );
  });

  // Proves: preserved behaviour - a GPS reading overlaps editing but never finalizing, one at a time.
  it('lets a reading overlap a save, blocks a second reading, and ends it anywhere', () => {
    const reading = run([{ type: 'LOCATE_STARTED' }], opened());
    expect(reading.reading).toBe(true);
    expect(reduceFieldReportFlow(reading, { type: 'LOCATE_STARTED' })).toBe(
      reading,
    );
    const saving = reduceFieldReportFlow(reading, { type: 'SAVE_STARTED' });
    expect(saving.phase).toBe('saving');
    expect(saving.reading).toBe(true);
    const failedLoad = reduceFieldReportFlow(reading, { type: 'LOAD_FAILED', message: 'x' });
    expect(reduceFieldReportFlow(failedLoad, { type: 'LOCATE_ENDED' }).reading).toBe(false);
    expect(canTransition('finalizing', 'LOCATE_STARTED')).toBe(false);
  });

  // Proves: preserved behaviour - a place write supersedes a running reading.
  it('clears a running reading when a place write starts', () => {
    const state = run(
      [{ type: 'LOCATE_STARTED' }, { type: 'PLACE_STARTED' }],
      opened(),
    );
    expect(state.phase).toBe('saving-location');
    expect(state.reading).toBe(false);
  });

  // Proves: preserved behaviour - invalid finalize keeps the dialog open with the fix list; dismiss lands on needs-fixes.
  it('keeps the dialog open on an invalid finalize and dismisses to needs-fixes', () => {
    const issues = ['barangay'] as never;
    const state = run(
      [
        { type: 'CONFIRM_OPENED' },
        { type: 'FINALIZE_STARTED' },
        { type: 'FINALIZE_INVALID', data: report(), issues },
      ],
      opened(),
    );
    expect(state.phase).toBe('confirming');
    expect(state.confirmNotice).toEqual({ kind: 'failed', message: null });
    expect(state.submissionIssues).toBe(issues);
    expect(reduceFieldReportFlow(state, { type: 'CONFIRM_DISMISSED' }).phase).toBe(
      'needs-fixes',
    );
  });

  // Proves: preserved behaviour - a busy refusal only shows in the open dialog.
  it('shows a busy notice only while confirming', () => {
    const confirming = run([{ type: 'CONFIRM_OPENED' }], opened());
    expect(
      reduceFieldReportFlow(confirming, { type: 'FINALIZE_REFUSED_BUSY' })
        .confirmNotice,
    ).toEqual({ kind: 'busy' });
    const draft = opened();
    expect(reduceFieldReportFlow(draft, { type: 'FINALIZE_REFUSED_BUSY' })).toBe(
      draft,
    );
  });
});
