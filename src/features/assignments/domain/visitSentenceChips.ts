/**
 * Chips for the visit form write plain sentences into the existing text fields.
 * The fields stay editable and separate (observation, finding, action); nothing
 * here is sent anywhere except as the text the inspector ends up with.
 */

/** Join sentences with a single space, trimming stray whitespace. */
function join(parts: string[]): string {
  return parts.join(' ').trim();
}

export function hasSentence(text: string, sentence: string): boolean {
  return text.includes(sentence);
}

/**
 * Adds the sentence to the end of the text, or removes it if it is already
 * there. Returns the text unchanged when adding would pass `maxLength`.
 */
export function toggleSentence(text: string, sentence: string, maxLength: number): string {
  if (hasSentence(text, sentence)) {
    const index = text.indexOf(sentence);
    return join([text.slice(0, index).trim(), text.slice(index + sentence.length).trim()]);
  }
  const next = join([text.trim(), sentence]);
  return next.length > maxLength ? text : next;
}
