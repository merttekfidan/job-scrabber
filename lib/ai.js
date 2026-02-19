export async function callGroqAPI(prompt, temperature = 0.2) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables.');
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [{
            role: 'user',
            content: prompt
        }],
        temperature: temperature,
        max_tokens: 2048,
        top_p: 0.95
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
