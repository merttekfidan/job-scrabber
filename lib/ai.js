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
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```\n?/g, '');
        }

        // Handle unescaped control characters that often break JSON.parse
        cleanText = cleanText.replace(/\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, "\\n");

        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Failed to parse AI response as JSON');
    }
}
