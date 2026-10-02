/**
 * The card's footer sentence: the reference's book comparison.
 *
 * The numbers are the reference's own, recovered from its bundle: ten titles
 * with a token count each, and two message shapes. The rule is
 *
 * ```
 * eligible = books the total already exceeds          (none → the line is hidden)
 * book     = eligible[floor(random * eligible.length)] (drawn once per mount)
 * times    = floor(total / book.tokens)
 * times >= 2 → "You've used ~{times}× more tokens than {book}."
 * otherwise  → "You've used about as many tokens as {book}."
 * ```
 *
 * Only the sentence is copied; nothing is fetched and no book text is
 * involved. The copy stays English, exactly as the reference writes it —
 * including its typographic apostrophe and multiplication sign.
 */

/** One comparable book: the title as printed, and the tokens it would take. */
export interface Book {
  readonly name: string;
  readonly tokens: number;
}

/** The reference's list, in its own order. */
export const BOOKS: readonly Book[] = Object.freeze([
  { name: 'The Little Prince', tokens: 22_000 },
  { name: 'Animal Farm', tokens: 39_000 },
  { name: 'The Great Gatsby', tokens: 62_000 },
  { name: 'Harry Potter and the Philosopher\u2019s Stone', tokens: 103_000 },
  { name: 'The Hobbit', tokens: 123_000 },
  { name: 'Pride and Prejudice', tokens: 156_000 },
  { name: 'Dune', tokens: 244_000 },
  { name: 'Moby-Dick', tokens: 268_000 },
  { name: 'The Lord of the Rings', tokens: 576_000 },
  { name: 'War and Peace', tokens: 730_000 },
]);

/**
 * Build the footer sentence for one token total.
 *
 * @param totalTokens - all-time token total at the provider's scale.
 * @param random - one draw in `[0, 1)`; callers pass a value that is stable for
 *   the lifetime of a mount, so the sentence does not change between polls.
 * @returns the sentence, or null while no book is smaller than the total.
 */
export function bookNote(totalTokens: number, random: () => number): string | null {
  const eligible = BOOKS.filter(book => totalTokens >= book.tokens);
  if (eligible.length === 0) return null;
  const draw = Math.min(Math.max(random(), 0), 0.999_999);
  const book = eligible[Math.floor(draw * eligible.length)];
  if (book === undefined) return null;
  const times = Math.floor(totalTokens / book.tokens);
  if (times >= 2) return `You\u2019ve used ~${times}\u00D7 more tokens than ${book.name}.`;
  return `You\u2019ve used about as many tokens as ${book.name}.`;
}
