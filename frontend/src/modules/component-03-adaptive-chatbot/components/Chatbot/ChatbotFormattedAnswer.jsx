import React from 'react';
import { Sparkles, Lightbulb, Bookmark } from 'lucide-react';

/**
 * Parses inline markdown (bold **text**, italic *text*, code `text`)
 * and strips unnecessary/stray markdown hashes and asterisks.
 */
function parseInlineFormatting(rawText) {
  if (!rawText) return null;

  // Clean any leading/trailing hashes, redundant symbols
  const text = rawText.replace(/^#{1,6}\s*/g, '').trim();

  // Regex to match **bold**, *italic*, `code`, and plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2).trim();
      return (
        <strong key={index} className="chatbot-formatted-strong">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1).trim();
      return (
        <em key={index} className="chatbot-formatted-em">
          {inner}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1).trim();
      return (
        <code key={index} className="chatbot-formatted-code">
          {inner}
        </code>
      );
    }

    // Clean any stray asterisks that weren't closed
    const cleanPlain = part.replace(/\*\*/g, '').replace(/\*/g, '');
    return <React.Fragment key={index}>{cleanPlain}</React.Fragment>;
  });
}

/**
 * Analyzes and classifies lines/blocks of chatbot text into rich UI structures:
 * - Question headers with sub-marks: e.g. "(a) What is a DBMS? (2 marks)"
 * - Numbered level / structure items: e.g. "1. External Level – View of the database..."
 * - Example callout boxes: e.g. "Example: MySQL, Microsoft Access, Oracle."
 * - Reminder / Key points cards: e.g. "Quick reminder: ..." or "Before this, remember ..."
 * - Bullet lists: e.g. "• Point 1"
 * - Standard paragraphs
 */
function parseAnswerBlocks(content) {
  if (!content || typeof content !== 'string') return [];

  // Normalize string: clean leading hashes, normalize CRLF to LF
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const rawLines = normalized.split('\n');

  const blocks = [];
  let currentParagraphLines = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) {
      flushParagraph();
      continue;
    }

    // Clean line from markdown header hashes
    const line = rawLine.replace(/^#{1,6}\s*/, '').trim();

    // 1. Check for Question Header: e.g. "(a) What is DBMS? (2 marks)" or "Q1. ..." or "(b) Name the three levels... (3 marks)"
    const questionHeaderMatch = line.match(/^(\([a-z0-9]+\)|[a-z0-9]+\.|\bQuestion\s+[a-z0-9]+:?)\s*(.+?)(?:\s*\((\d+\s*marks?)\))?$/i);
    if (questionHeaderMatch && !line.match(/^\d+\.\s+[A-Za-z\s]+[–\-:]/)) {
      flushParagraph();
      blocks.push({
        type: 'question_header',
        label: questionHeaderMatch[1],
        title: questionHeaderMatch[2],
        marks: questionHeaderMatch[3] || null,
      });
      continue;
    }

    // Check for bold standalone question: e.g. "**What is a DBMS?** (2 marks)"
    const boldQuestionMatch = line.match(/^\*\*([^*]+)\*\*(?:\s*\((\d+\s*marks?)\))?$/i);
    if (boldQuestionMatch) {
      flushParagraph();
      blocks.push({
        type: 'question_header',
        label: null,
        title: boldQuestionMatch[1],
        marks: boldQuestionMatch[2] || null,
      });
      continue;
    }

    // 2. Check for Numbered Structured List items: e.g. "1. External Level – Description" or "1. **External Level** - Description"
    const numberedItemMatch = line.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberedItemMatch) {
      flushParagraph();
      const num = numberedItemMatch[1];
      const rest = numberedItemMatch[2];

      // Check if it has a Title and Description separated by "–", "-", or ":"
      const splitMatch = rest.match(/^(\*\*[^*]+\*\*|[A-Za-z0-9\s/()]+?)\s*(?:[–—]| - |:\s+)(.+)$/);
      if (splitMatch) {
        blocks.push({
          type: 'structured_item',
          number: num,
          title: splitMatch[1].replace(/\*\*/g, '').trim(),
          description: splitMatch[2].trim(),
        });
      } else {
        blocks.push({
          type: 'numbered_item',
          number: num,
          text: rest.trim(),
        });
      }
      continue;
    }

    // 3. Check for Examples: e.g. "Example: MySQL, Access..." or "Examples:" or "For example: ..."
    const exampleMatch = line.match(/^(?:Example|Examples|For example|Small example|Interesting example)[:\s]\s*(.+)$/i);
    if (exampleMatch) {
      flushParagraph();
      blocks.push({
        type: 'example',
        text: exampleMatch[1].trim(),
      });
      continue;
    }

    // 4. Check for Prerequisite / Topic Memory: e.g. "Before this, remember Databases."
    const prereqMatch = line.match(/^Before this, remember\s+(.+)$/i);
    if (prereqMatch) {
      flushParagraph();
      blocks.push({
        type: 'prerequisite',
        text: prereqMatch[1].trim(),
      });
      continue;
    }

    // 5. Check for Quick Reminder / Key Points header or block
    const reminderMatch = line.match(/^(?:Quick reminder|Key reminder|Main points|Key points)[:\s]\s*(.+)$/i);
    if (reminderMatch) {
      flushParagraph();
      blocks.push({
        type: 'reminder',
        title: line.split(/[:\s]/)[0] + ' reminder',
        text: reminderMatch[1].trim(),
      });
      continue;
    }

    // 6. Check for Bullet Points
    const bulletMatch = line.match(/^[\-\*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({
        type: 'bullet_item',
        text: bulletMatch[1].trim(),
      });
      continue;
    }

    // 7. Regular paragraph line
    currentParagraphLines.push(line);
  }

  flushParagraph();
  return blocks;
}

export default function ChatbotFormattedAnswer({ content, compact = false }) {
  if (!content) return null;

  const blocks = parseAnswerBlocks(content);

  if (blocks.length === 0) {
    return <p className="dashboard-text-wrap text-sm text-white/95">{content}</p>;
  }

  return (
    <div className={`chatbot-formatted-answer ${compact ? 'is-compact' : ''}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'question_header':
            return (
              <div key={index} className="chatbot-answer-question-header">
                {block.label && (
                  <span className="chatbot-question-marker">{block.label}</span>
                )}
                <span className="chatbot-question-title">
                  {parseInlineFormatting(block.title)}
                </span>
                {block.marks && (
                  <span className="chatbot-marks-badge">
                    {block.marks}
                  </span>
                )}
              </div>
            );

          case 'structured_item':
            return (
              <div key={index} className="chatbot-structured-row">
                <span className="chatbot-structured-num">{block.number}</span>
                <div className="chatbot-structured-body">
                  <span className="chatbot-structured-title">
                    {parseInlineFormatting(block.title)}
                  </span>
                  <span className="chatbot-structured-sep">–</span>
                  <span className="chatbot-structured-desc">
                    {parseInlineFormatting(block.description)}
                  </span>
                </div>
              </div>
            );

          case 'numbered_item':
            return (
              <div key={index} className="chatbot-numbered-row">
                <span className="chatbot-structured-num">{block.number}</span>
                <span className="chatbot-numbered-text">
                  {parseInlineFormatting(block.text)}
                </span>
              </div>
            );

          case 'example':
            return (
              <div key={index} className="chatbot-example-card">
                <div className="chatbot-example-pill">
                  <Sparkles size={13} className="text-amber-300" />
                  <span>Example</span>
                </div>
                <div className="chatbot-example-content">
                  {parseInlineFormatting(block.text)}
                </div>
              </div>
            );

          case 'prerequisite':
            return (
              <div key={index} className="chatbot-prereq-badge-card">
                <Bookmark size={13} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-semibold text-xs">Prior Knowledge:</span>
                <span className="text-emerald-100/90 text-xs">
                  {parseInlineFormatting(block.text)}
                </span>
              </div>
            );

          case 'reminder':
            return (
              <div key={index} className="chatbot-reminder-card">
                <div className="chatbot-reminder-header">
                  <Lightbulb size={14} className="text-cyan-400" />
                  <span>{block.title || 'Quick Reminder'}</span>
                </div>
                <div className="chatbot-reminder-body">
                  {parseInlineFormatting(block.text)}
                </div>
              </div>
            );

          case 'bullet_item':
            return (
              <div key={index} className="chatbot-bullet-row">
                <span className="chatbot-bullet-dot" />
                <span className="chatbot-bullet-text">
                  {parseInlineFormatting(block.text)}
                </span>
              </div>
            );

          case 'paragraph':
          default:
            return (
              <p key={index} className="chatbot-answer-paragraph">
                {parseInlineFormatting(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}


