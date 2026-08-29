# T13 possible-match warning

This document records the mobile portion of GitHub issue #61 and its parent issue #58.

## Current integration boundary

The current Mobile/API contract exposes report upload and report-status reads, but it does not expose a possible-match endpoint.

The mobile implementation therefore uses finalized local Field Reports owned by the authenticated submitter as its conservative offline-safe source.

The lookup reads existing records only and never changes a Scan Record or Field Report.

A database read failure is treated as an unavailable advisory feature, so it produces no warning and cannot affect Draft finalization or synchronization.

## Matching policy

A warning is shown only when all of these signals agree:

- the candidate is a different finalized Field Report and Scan Record;
- the candidate is no more than seven days older than the current observation;
- both reports have the same non-empty farmer or farm reference, province, municipality, and barangay;
- both Scan Records have the same AI-supported result label; and
- final coordinates are within 100 meters.

Same location or the same AI-supported result alone is not enough to produce a warning.

A matching candidate is presented as a possible recent match, not as a duplicate determination.

The normal Finalize Report action remains available, and the new report is retained as a separate local record.

## Future Web/API seam

A future remote implementation can replace the `PossibleRecentMatchLookup` function in `src/features/reports/hooks/usePossibleRecentMatch.ts` without changing the form or lifecycle code.

The function should accept the current report UUID, Scan Record UUID, observation timestamp, AI-supported result label, farmer or farm reference, province, municipality, barangay, location source, and final coordinates.

It should return either a validated possible-match summary with the existing report UUID, Scan Record UUID, observation timestamp, result label, matching location context, and distance in meters, or `null` when no conservative match is available.

A missing endpoint, unsupported response, network failure, or malformed candidate must resolve to no warning rather than blocking local finalization.

Any server contract should keep matching advisory-only and must not ask Mobile to merge, delete, suppress, or replace a record.
