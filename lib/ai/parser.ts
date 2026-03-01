import logger from '@/lib/logger';

/**
 * Parse AI JSON response — strips markdown fences and extracts JSON object/array.
 */
export function parseAIResponse(responseText: string): unknown {
  try {
    let cleanText = responseText.trim();

    const jsonBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleanText = jsonBlockMatch[1].trim();
    } else {
      const firstBrace = cleanText.indexOf('{');
      const firstBracket = cleanText.indexOf('[');
      let startIdx = -1;
      let endIdx = -1;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        let balance = 0,
          insideString = false,
          escape = false;
        for (let i = startIdx; i < cleanText.length; i++) {
          const char = cleanText[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === '\\') {
            escape = true;
            continue;
          }
          if (char === '"') {
            insideString = !insideString;
            continue;
          }
          if (!insideString) {
            if (char === '{') balance++;
            else if (char === '}') {
              balance--;
              if (balance === 0) {
                endIdx = i;
                break;
              }
            }
          }
        }
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        let balance = 0,
          insideString = false,
          escape = false;
        for (let i = startIdx; i < cleanText.length; i++) {
          const char = cleanText[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === '\\') {
            escape = true;
            continue;
          }
          if (char === '"') {
            insideString = !insideString;
            continue;
          }
          if (!insideString) {
            if (char === '[') balance++;
            else if (char === ']') {
              balance--;
              if (balance === 0) {
                endIdx = i;
                break;
              }
            }
          }
        }
      }

      if (startIdx !== -1 && endIdx !== -1) {
        cleanText = cleanText.substring(startIdx, endIdx + 1);
      }
    }

    return JSON.parse(cleanText) as unknown;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.error('Parse AI response failed', { message: err.message });
    throw new Error('Failed to parse AI response as JSON. ' + err.message);
  }
}
