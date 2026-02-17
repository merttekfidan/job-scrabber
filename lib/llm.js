export async function callLLM(messages, options = {}) {
    const {
        model = 'llama-3.3-70b-versatile',
        temperature = 0.7,
        max_tokens = 2048
    } = options;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables. Please add it to your .env or .env.local file.');
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer \${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || \`Groq API Error: \${response.statusText}\`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from Groq API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM Call Failed:', error);
        throw error;
    }
}
