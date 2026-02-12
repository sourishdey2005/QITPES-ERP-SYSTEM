// AI Service for QITPES ERP using Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AnalysisResult {
    insights: string;
    recommendations: string[];
    summary: string;
}

/**
 * Send a chat message to Gemini AI
 */
export async function sendChatMessage(
    message: string,
    context?: string
): Promise<string> {
    // Validate API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
        throw new Error('API_KEY_MISSING: Please configure VITE_GEMINI_API_KEY in your .env file and restart the dev server');
    }

    const systemPrompt = `You are QITPES AI Assistant, an intelligent ERP assistant for QITPES ERP System. 
You help users with:
- Data analysis and insights
- Financial reporting and trends
- Project management queries
- HR and payroll questions
- Inventory management
- Workflow automation suggestions

Provide concise, actionable, and friendly responses. Use the context provided when available. Be professional but conversational.`;

    const fullPrompt = context
        ? `${systemPrompt}\n\nContext: ${context}\n\nUser: ${message}`
        : `${systemPrompt}\n\nUser: ${message}`;

    try {
        console.log('🔵 Initializing Gemini AI...');
        console.log('🔵 API Key exists:', !!GEMINI_API_KEY);

        // Use the model that works with your API key
        // Try these in order: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        console.log('🔵 Sending request to Gemini...');
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('🟢 Response received, length:', text?.length);

        if (!text) {
            throw new Error('No response generated from AI');
        }

        return text;
    } catch (error: any) {
        console.error('🔴 Chat error details:', error);
        console.error('🔴 Error message:', error.message);

        if (error.message?.includes('API_KEY_MISSING')) {
            throw error;
        }

        if (error.message?.includes('API key not valid')) {
            throw new Error('API Error: Invalid API key. Please check your GEMINI_API_KEY in .env file');
        }

        throw new Error(`Connection failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Analyze data using Gemini AI
 */
export async function analyzeData(
    data: any[],
    analysisType: string
): Promise<AnalysisResult> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined') {
        throw new Error('API_KEY_MISSING');
    }

    const dataString = JSON.stringify(data.slice(0, 20), null, 2);

    const prompt = `Analyze the following ${analysisType} data from an ERP system:

${dataString}

Provide a comprehensive analysis in the following JSON format:
{
  "insights": "Key insights, trends, patterns, and anomalies (2-3 sentences)",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "summary": "Executive summary (1-2 sentences)"
}

Respond ONLY with valid JSON, no additional text.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text;

        try {
            return JSON.parse(jsonText);
        } catch {
            return {
                insights: text.substring(0, 200),
                recommendations: ['Review the data manually', 'Consult with your team', 'Monitor trends over time'],
                summary: 'Analysis completed. Please review the insights above.'
            };
        }
    } catch (error) {
        console.error('Analysis error:', error);
        throw error;
    }
}

export default {
    sendChatMessage,
    analyzeData,
};
