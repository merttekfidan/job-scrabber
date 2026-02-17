import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Polyfill for DOMMatrix which is required by some versions of pdf-parse/pdf.js in Node environments
if (typeof global !== 'undefined' && !global.DOMMatrix) {
    global.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        }
    };
}

const pdf = require('pdf-parse');
import { CV_ANALYSIS_PROMPT } from '@/lib/prompts';
import { callGroqAPI, parseAIResponse } from '@/lib/ai';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse PDF to text
        let pdfData;
        try {
            pdfData = await pdf(buffer);
        } catch (parseError) {
            console.error('PDF Parse Error:', parseError);
            return NextResponse.json({ success: false, error: 'Failed to parse PDF file. Ensure it is a valid PDF.' }, { status: 422 });
        }

        if (!pdfData || !pdfData.text) {
            return NextResponse.json({ success: false, error: 'Could not extract text from PDF' }, { status: 422 });
        }

        const rawText = pdfData.text;

        // Call AI for analysis
        const analysisPrompt = CV_ANALYSIS_PROMPT(rawText);
        const aiResponse = await callGroqAPI(analysisPrompt);
        const analysisJson = parseAIResponse(aiResponse);

        // Deactivate previous CVs
        await query('UPDATE cv_data SET is_active = FALSE');

        // Store in DB
        const result = await query(
            'INSERT INTO cv_data (filename, raw_text, ai_analysis, is_active) VALUES ($1, $2, $3, TRUE) RETURNING *',
            [file.name, rawText, JSON.stringify(analysisJson)]
        );

        return NextResponse.json({
            success: true,
            message: 'CV uploaded and analyzed successfully',
            cv: result.rows[0]
        });

    } catch (error) {
        console.error('CV Upload Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process CV upload'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const result = await query('SELECT * FROM cv_data WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1');
        return NextResponse.json({
            success: true,
            cv: result.rows[0] || null
        });
    } catch (error) {
        console.error('CV Fetch Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch CV data' }, { status: 500 });
    }
}
