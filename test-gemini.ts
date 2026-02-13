// Test script to check available Gemini models
import * as GenAI from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;

console.log('Testing Gemini API...');
console.log('API Key exists:', !!GEMINI_API_KEY);

const ai = new GenAI.GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

// Try different model names
const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-pro',
];

async function testModels() {
    for (const modelName of modelsToTry) {
        try {
            console.log(`\n🔵 Testing model: ${modelName}`);
            const result = await ai.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }]
            });
            const text = result.text;
            console.log(`✅ ${modelName} WORKS! Response:`, text.substring(0, 50));
            break; // Stop at first working model
        } catch (error: any) {
            console.log(`❌ ${modelName} failed:`, error.message);
        }
    }
}

testModels();
