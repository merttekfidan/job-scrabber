
import { parseAIResponse } from './lib/ai.js';

const testCases = [
    {
        name: "Standard JSON",
        input: '{"key": "value"}',
        expected: { key: "value" }
    },
    {
        name: "JSON with trailing text",
        input: '{"key": "value"} Here is some extra text',
        expected: { key: "value" }
    },
    {
        name: "JSON with leading text",
        input: 'Here is the JSON: {"key": "value"}',
        expected: { key: "value" }
    },
    {
        name: "JSON with nested objects",
        input: '{"key": {"nested": "value"}}',
        expected: { key: { nested: "value" } }
    },
    {
        name: "JSON Array",
        input: '[{"key": "value"}, {"key": "value2"}]',
        expected: [{ key: "value" }, { key: "value2" }]
    },
    {
        name: "JSON with trailing text containing braces",
        input: '{"key": "value"}  Note: {this is not json}',
        expected: { key: "value" }
    }
];

console.log("Running JSON Parsing Tests...\n");

let passed = 0;
let failed = 0;

for (const test of testCases) {
    try {
        const result = parseAIResponse(test.input);
        const jsonResult = JSON.stringify(result);
        const jsonExpected = JSON.stringify(test.expected);

        if (jsonResult === jsonExpected) {
            console.log(`✅ ${test.name}: PASSED`);
            passed++;
        } else {
            console.log(`❌ ${test.name}: FAILED`);
            console.log(`   Expected: ${jsonExpected}`);
            console.log(`   Got:      ${jsonResult}`);
            failed++;
        }
    } catch (e) {
        console.log(`❌ ${test.name}: FAILED (Threw Error)`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
if (failed > 0) process.exit(1);
