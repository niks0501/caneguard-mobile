---
name: diagnose-reported-bug
description: Use when diagnosing a reported bug or repeated failing command/check before changing implementation.
user-invocable: false
metadata:
  internal: true
---

# Diagnose a Reported Bug or Failure

Before changing implementation, reproduce the failure and capture either a failing test or concrete runtime evidence.

- Determine whether a failure comes from the change, environment, configuration, or existing repository state.

Rank falsifiable hypotheses, run the smallest probe that distinguishes them, and change code only after the evidence identifies the defect.

- Make evidence-based corrective attempts rather than repeatedly rerunning the same failing command unchanged.
