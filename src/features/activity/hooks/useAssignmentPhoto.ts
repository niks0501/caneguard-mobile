import { useEffect, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import type { CaneGuardDatabase } from '@/database/database';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import { managedImageExists } from '@/features/records/services/scanImageStorage';
import { findFieldReportById } from '@/features/reports/data/fieldReportRepository';
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';

type AssignmentPhotoIdentity = Pick<
  FieldValidationAssignment,
  'ownerIdentity' | 'reportClientUuid'
>;

/**
 * The office assignment feed carries no picture of its own. The reporter's
 * stored scan image is reused when this account and device already hold the
 * Field Report the assignment points at; every other case is an ordinary
 * "no picture here" outcome that the card renders as its placeholder.
 */
async function resolveAssignmentPhotoUri(
  database: CaneGuardDatabase,
  assignment: AssignmentPhotoIdentity,
): Promise<string | null> {
  try {
    const report = await findFieldReportById(
      database,
      assignment.reportClientUuid,
      assignment.ownerIdentity,
    );
    const record = await findScanRecordById(
      database,
      report.scanRecordId,
      assignment.ownerIdentity,
    );
    const candidates = [record.managedImageUri, record.submissionImageUri];
    const available = candidates.find(
      (uri) => uri !== null && managedImageExists(uri),
    );
    return available ?? null;
  } catch {
    // A missing report, record, or image file is not a card error.
    return null;
  }
}

export function useAssignmentPhotoUri(
  assignment: AssignmentPhotoIdentity,
): string | null {
  const database = useCaneGuardDatabase();
  const recordsRevision = useSyncRecordsRevision();
  const [resolved, setResolved] = useState<{
    key: string;
    uri: string | null;
  } | null>(null);
  const { ownerIdentity, reportClientUuid } = assignment;
  const assignmentKey =
    database === EMPTY_DATABASE ? null : `${ownerIdentity}:${reportClientUuid}`;

  useEffect(() => {
    let active = true;
    if (assignmentKey) {
      void resolveAssignmentPhotoUri(database, {
        ownerIdentity,
        reportClientUuid,
      }).then((uri) => {
        if (active) {
          setResolved({ key: assignmentKey, uri });
        }
      });
    }

    return () => {
      active = false;
    };
  }, [assignmentKey, database, ownerIdentity, recordsRevision, reportClientUuid]);

  return assignmentKey && resolved?.key === assignmentKey ? resolved.uri : null;
}
