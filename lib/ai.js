import { callAIWithPool } from '@/lib/ai-router';

/**
 * Legacy entry point — delegates to the multi-provider pool router.
 * Kept for backward compatibility with existing import sites.
 */
export async function callGroqAPI(prompt, temperature = 0.2, userId = null) {
    return callAIWithPool(prompt, temperature, userId);
}

/**
 * Parse AI JSON response — strips markdown fences and extracts JSON object/array.
 */
export function parseAIResponse(responseText) {
    try {
        let cleanText = responseText.trim();

        // 1. Try to extract JSON from markdown code blocks
        const jsonBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            cleanText = jsonBlockMatch[1].trim();
        } else {
            // 2. Find first '{' or '['
            const firstBrace = cleanText.indexOf('{');
            const firstBracket = cleanText.indexOf('[');
            let startIdx = -1;
            let endIdx = -1;

            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                startIdx = firstBrace;
                let balance = 0, insideString = false, escape = false;
                for (let i = startIdx; i < cleanText.length; i++) {
                    const char = cleanText[i];
                    if (escape) { escape = false; continue; }
                    if (char === '\\') { escape = true; continue; }
                    if (char === '"') { insideString = !insideString; continue; }
                    if (!insideString) {
                        if (char === '{') balance++;
                        else if (char === '}') { balance--; if (balance === 0) { endIdx = i; break; } }
                    }
                }
            } else if (firstBracket !== -1) {
                startIdx = firstBracket;
                let balance = 0, insideString = false, escape = false;
                for (let i = startIdx; i < cleanText.length; i++) {
                    const char = cleanText[i];
                    if (escape) { escape = false; continue; }
                    if (char === '\\') { escape = true; continue; }
                    if (char === '"') { insideString = !insideString; continue; }
                    if (!insideString) {
                        if (char === '[') balance++;
                        else if (char === ']') { balance--; if (balance === 0) { endIdx = i; break; } }
                    }
                }
            }

            if (startIdx !== -1 && endIdx !== -1) {
                cleanText = cleanText.substring(startIdx, endIdx + 1);
            }
        }

        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Failed to parse AI response as JSON. ' + e.message);
    }
}
