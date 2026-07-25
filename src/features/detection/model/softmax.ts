export function softmax(logits: readonly number[]): number[] {
  if (logits.length === 0) {
    return [];
  }

  const max = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - max));
  const sum = exponentials.reduce((total, value) => total + value, 0);

  return exponentials.map((value) => value / sum);
}
