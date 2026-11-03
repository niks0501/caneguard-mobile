import type { CaneGuardDatabase } from '@/database/database';
import type { MobileUser } from '@/features/auth/types';
import { MODEL_LABELS, MODEL_VERSION } from '@/features/detection/constants/modelContract';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { findScanRecordById } from '@/features/records/data/scanRecordRepository';
import { insertScanRecord } from '@/features/records/data/scanRecordWriteRepository';
import type { SaveCompletedScanInput } from '@/features/records/domain/recordTypes';
import { registerValidationFile } from '../expo-file-system/validationFileStore';
import { isWebValidationRuntimeEnabled } from './runtime';

interface ScanRecordFixture {
  confidence: number;
  createdAt: string;
  followsUpScanId: string | null;
  id: string;
  imageAsset: string;
  imageFileName: string;
  personalNote: string | null;
  predictedLabel: (typeof MODEL_LABELS)[number];
}

interface FixtureModule {
  FAKE_FARMER_ACCOUNT: { uuid: string };
  buildScanRecords(input: { today: string }): ScanRecordFixture[];
  resolveTodayKey(env?: Record<string, string | undefined>): string;
}

// The stub fixtures are plain CommonJS so the same data serves the Node stub
// and the validation-only browser seeder.
const fixtures = require('../stub-api/fixtures') as FixtureModule;

function buildInput(
  record: ScanRecordFixture,
  ownerIdentity: string,
  apiBaseUrl: string,
): SaveCompletedScanInput {
  const managedImageUri = `${apiBaseUrl}/caneguard/scan-images/${ownerIdentity}/${record.imageFileName}`;
  const otherScore = (1 - record.confidence) / (MODEL_LABELS.length - 1);

  return {
    barangay: '',
    checklistConsistency: 'not-enough-information',
    classScores: MODEL_LABELS.map((label) => ({
      label,
      score: label === record.predictedLabel ? record.confidence : otherScore,
    })),
    confidence: record.confidence,
    createdAt: record.createdAt,
    decisionSupportWording:
      diseaseCatalog[record.predictedLabel].decisionSupportWording,
    followsUpScanId: record.followsUpScanId,
    id: record.id,
    imageMimeType: 'image/jpeg',
    imageSizeBytes: null,
    imageSourceType: 'gallery',
    inferenceMs: 120,
    managedImageUri,
    modelVersion: MODEL_VERSION,
    ownerIdentity,
    personalNote: record.personalNote,
    predictedLabel: record.predictedLabel,
    preprocessMs: 40,
    qualityWarnings: [],
    reportedSeverity: null,
    sourceHeight: 768,
    sourceWidth: 1024,
    symptoms: [],
    totalMs: 160,
    updatedAt: record.createdAt,
  };
}

/**
 * Seeds the farmer fixture's saved checks for the browser validation route.
 * It runs only for the fixture farmer against the local stub, and is
 * idempotent because every check has a fixed identifier.
 */
export async function seedValidationScanRecords({
  database,
  user,
}: {
  database: CaneGuardDatabase;
  user: MobileUser;
}): Promise<number> {
  if (!isWebValidationRuntimeEnabled() || user.role !== 'farmer') {
    return 0;
  }

  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (!apiBaseUrl) {
    return 0;
  }

  const records = fixtures.buildScanRecords({
    today: fixtures.resolveTodayKey(),
  });
  let inserted = 0;

  for (const record of records) {
    const input = buildInput(record, user.uuid, apiBaseUrl);
    registerValidationFile(input.managedImageUri, {
      mimeType: 'image/jpeg',
      sizeBytes: 1,
    });
    try {
      await findScanRecordById(database, record.id, user.uuid);
      continue;
    } catch {
      // The fixed check is not on this device yet.
    }
    await insertScanRecord(database, input);
    inserted += 1;
  }

  return inserted;
}

