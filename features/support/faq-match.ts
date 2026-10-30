import type { FaqDTO } from "@/features/support/types";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "i", "you", "your", "my", "me", "we", "our",
  "to", "of", "for", "in", "on", "at", "and", "or", "it", "this", "that", "can", "how", "what", "when", "where",
  "will", "would", "could", "should", "have", "has", "be", "get", "about", "any", "with", "there", "please",
  "many", "much",
]);

/** Words customers use interchangeably, folded to one form so "shipping" finds the delivery answer. */
const SYNONYMS: Record<string, string> = {
  shipping: "delivery",
  shipment: "delivery",
  ship: "delivery",
  dispatch: "delivery",
  courier: "delivery",
  refund: "return",
  exchange: "return",
  cod: "cash",
};

/** Lowercased words with punctuation, stopwords and a trailing plural "s" removed, so "returns" matches "return"; synonyms are folded together. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word))
    .map((word) => SYNONYMS[word] ?? word);
}

const MIN_SCORE = 0.5;

/**
 * Best quick answer for a free-text question, or null if nothing is a
 * convincing match — the bot should hand off to a human rather than guess.
 * Score = how much of the customer's question is covered by the FAQ question
 * (full weight) and answer (half weight).
 */
export function findBestFaq(query: string, faqs: FaqDTO[]): FaqDTO | null {
  const queryTokens = [...new Set(tokenize(query))];
  if (queryTokens.length === 0) return null;

  let best: { faq: FaqDTO; score: number } | null = null;
  for (const faq of faqs) {
    const questionTokens = new Set(tokenize(faq.question));
    const answerTokens = new Set(tokenize(faq.answer));

    let score = 0;
    for (const token of queryTokens) {
      if (questionTokens.has(token)) score += 1;
      else if (answerTokens.has(token)) score += 0.5;
    }
    score /= queryTokens.length;

    if (score >= MIN_SCORE && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
}
