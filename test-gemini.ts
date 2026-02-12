// Test script to check available Gemini models
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('Testing Gemini API...');
console.log('API Key exists:', !!GEMINI_API_KEY);
console.log('API Key (first 10 chars):', GEMINI_API_KEY?.substring(0, 10));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Try different model names
const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
];

async function testModels() {
    for (const modelName of modelsToTry) {
        try {
            console.log(`\n🔵 Testing model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say hello');
            const response = await result.response;
            const text = response.text();
            console.log(`✅ ${modelName} WORKS! Response:`, text.substring(0, 50));
            break; // Stop at first working model
        } catch (error: any) {
            console.log(`❌ ${modelName} failed:`, error.message);
        }
    }
}

testModels();
