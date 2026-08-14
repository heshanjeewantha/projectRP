import signDictionary, { signDictionaryLookup } from '../data/signDictionary';

const DIRECT_GLOSS_SUPPORT = new Set([
  'COMPUTER',
  'DEVICE',
  'ELECTRONIC',
  'DATA',
  'INFORMATION',
  'INTERNET',
  'EMAIL',
  'DATABASE',
  'PROGRAM',
  'FLOWCHART',
  'SECURITY',
  'HARDWARE',
  'SOFTWARE',
  'INPUT',
  'OUTPUT',
  'MEMORY',
  'NETWORK',
]);

const ENGLISH_FILLER_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'using',
  'what',
  'which',
  'with',
]);

const normalizeToken = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const singularize = (value) => {
  const map = {
    databases: 'database',
    networks: 'network',
    programs: 'program',
    files: 'file',
    folders: 'folder',
    websites: 'website',
    devices: 'device',
    keyboards: 'keyboard',
    monitors: 'monitor',
    servers: 'server',
    algorithms: 'algorithm',
    browsers: 'browser',
  };

  return map[value] || value;
};

export const extractKeywords = (lessonNotes = '') => {
  const cleanedWords = normalizeToken(lessonNotes)
    .split(' ')
    .map((word) => singularize(word))
    .filter(Boolean)
    .filter((word) => !ENGLISH_FILLER_WORDS.has(word));

  const matchedKeywords = [];
  cleanedWords.forEach((word, index) => {
    if (signDictionaryLookup[word] && !matchedKeywords.includes(word)) {
      matchedKeywords.push(word);
    }

    const phrase = `${word} ${cleanedWords[index + 1] || ''}`.trim();
    if (signDictionaryLookup[phrase] && !matchedKeywords.includes(phrase)) {
      matchedKeywords.push(phrase);
    }
  });

  return matchedKeywords.length
    ? matchedKeywords
    : signDictionary.slice(0, 5).map((entry) => entry.keyword);
};

export const generateAvatarAnimationSequence = (keywords = []) =>
  keywords
    .map((keyword) => {
      const entry = signDictionaryLookup[keyword];
      if (!entry) return null;

      return {
        keyword: entry.keyword,
        animationName: entry.animationName,
        subtitle: entry.subtitleText,
        duration: entry.duration ?? 1.8,
        fallbackGesture: entry.fallbackGesture,
        sourceGloss: entry.sourceGloss,
        isFallback: !DIRECT_GLOSS_SUPPORT.has(entry.sourceGloss),
      };
    })
    .filter(Boolean);

export const buildSubtitleSegments = (sequence = []) => {
  let startMs = 0;
  return sequence.map((item) => {
    const durationMs = Math.round((item.duration || 1.8) * 1000);
    const segment = {
      keyword: item.keyword,
      subtitle: item.subtitle,
      startMs,
      endMs: startMs + durationMs,
    };
    startMs += durationMs;
    return segment;
  });
};

export const simplifyLessonNotes = (lessonNotes = '', keywords = []) => {
  const sentences = String(lessonNotes)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!sentences.length) {
    return keywords.map((keyword) => `${keyword} is important in ICT.`).join(' ');
  }

  const simpleSentences = sentences.map((sentence) =>
    sentence
      .replace(/\b(which|because|however|therefore|although)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  );

  if (keywords.length) {
    simpleSentences.push(`Key words: ${keywords.slice(0, 4).join(', ')}.`);
  }

  return simpleSentences.join(' ');
};

export const processLessonTextToSigns = (lessonNotes = '') => {
  const keywords = extractKeywords(lessonNotes);
  const avatarAnimationSequence = generateAvatarAnimationSequence(keywords);
  const subtitleSegments = buildSubtitleSegments(avatarAnimationSequence);

  return {
    keywords,
    simplifiedText: simplifyLessonNotes(lessonNotes, keywords),
    avatarAnimationSequence,
    subtitleSegments,
  };
};

export default processLessonTextToSigns;
