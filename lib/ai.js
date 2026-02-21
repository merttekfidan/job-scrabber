import logger from './logger.js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']; // fallback to smaller model

export async function callGroqAPI(prompt, temperature = 0.2) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables.');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        // Use fallback model on last attempt
        const model = attempt < MAX_RETRIES - 1 ? MODELS[0] : MODELS[1];

        const requestBody = {
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: 2048,
            top_p: 0.95
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                if (attempt > 0) {
                    logger.info('AI call succeeded after retry', { attempt, model });
                }
                return data.choices[0].message.content;
            }

            // Rate limited — wait and retry
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
                logger.warn('AI rate limited, waiting', { retryAfter, attempt });
                await sleep(retryAfter * 1000);
                continue;
            }

            // Other API errors
            const errorData = await response.json().catch(() => ({}));
            lastError = new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);

            // 5xx = server error, retry. 4xx (except 429) = client error, don't retry
            if (response.status >= 500) {
                logger.warn('AI server error, retrying', { status: response.status, attempt });
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }

            throw lastError;
        } catch (error) {
            lastError = error;
            if (error.name === 'TypeError' || error.message?.includes('fetch')) {
                // Network error — retry
                logger.warn('AI network error, retrying', { error: error.message, attempt });
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }
            throw error;
        }
    }

    logger.error('AI call failed after all retries', { error: lastError?.message });
    throw lastError || new Error('AI call failed after all retries');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseAIResponse(responseText) {
    try {
        let cleanText = responseText.trim();

        // 1. Try to extract JSON from markdown code blocks
        const jsonBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
            cleanText = jsonBlockMatch[1].trim();
        } else {
            // 2. If no code block, find the first '{' or '['
            const firstBrace = cleanText.indexOf('{');
            const firstBracket = cleanText.indexOf('[');

            let startIdx = -1;
            let endIdx = -1;

            // Determine if we are looking for an object or an array
            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                startIdx = firstBrace;
                // Find matching closing brace
                let balance = 0;
                let insideString = false;
                let escape = false;

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
                // Find matching closing bracket
                let balance = 0;
                let insideString = false;
                let escape = false;

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

        // Handle unescaped control characters
        cleanText = cleanText.replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n");

        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Failed to parse AI response as JSON.' + e.message);
    }
}
