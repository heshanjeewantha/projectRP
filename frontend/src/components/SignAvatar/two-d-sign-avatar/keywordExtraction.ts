const supportedKeywords = new Set(['computer', 'internet', 'data', 'network', 'server']);
const ignoredWords = new Set(['the', 'a', 'an', 'is', 'are', 'between', 'transfer', 'transfers', 'to', 'from', 'and', 'so', 'can', 'move', 'connect', 'connects']);

const normalizeWord = (word: string) => {
  const lower = word.toLowerCase();
  const singular = lower.endsWith('s') ? lower.slice(0, -1) : lower;
  return singular;
};

/** Extracts supported ICT sign words in their original sentence order. */
export const extractKeywords = (text: string): string[] => text
  .match(/[a-zA-Z]+/g)
  ?.map(normalizeWord)
  .filter((word) => !ignoredWords.has(word) && supportedKeywords.has(word)) || [];

