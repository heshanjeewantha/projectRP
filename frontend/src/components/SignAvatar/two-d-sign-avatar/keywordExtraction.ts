/** ICT sign vocabulary — covers all 9 trained WLASL classes + GesturePoseLibrary entries. */
const SUPPORTED_KEYWORDS = new Set([
  // Trained WLASL classes
  'cloud', 'computer', 'email', 'information', 'internet',
  'keyboard', 'mouse', 'network', 'program',
  // Extended ICT vocabulary (GesturePoseLibrary)
  'software', 'hardware', 'database', 'algorithm', 'security',
  'memory', 'storage', 'input', 'output', 'monitor',
  'password', 'login', 'file', 'folder', 'server',
  'browser', 'website', 'device', 'cpu', 'code', 'data',
]);

const IGNORED_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'for', 'in', 'on', 'at', 'by', 'with', 'and', 'or',
  'from', 'so', 'can', 'move', 'connect', 'connects', 'transfer',
  'transfers', 'between', 'that', 'this', 'it', 'its', 'as',
]);

const SINGULARISE: Record<string, string> = {
  databases: 'database', networks: 'network', devices: 'device',
  programs: 'program', files: 'file', folders: 'folder',
  websites: 'website', algorithms: 'algorithm', servers: 'server',
  browsers: 'browser', keyboards: 'keyboard', monitors: 'monitor',
};

const normaliseWord = (word: string): string => {
  const lower = word.toLowerCase();
  return SINGULARISE[lower] ?? lower;
};

/** Extracts supported ICT sign words in original sentence order, deduped. */
export const extractKeywords = (text: string): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  const words = text.match(/[a-zA-Z]+/g) ?? [];

  for (const raw of words) {
    const norm = normaliseWord(raw);
    if (!IGNORED_WORDS.has(norm) && SUPPORTED_KEYWORDS.has(norm) && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
};
