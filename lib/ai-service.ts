
// AI Service for QITPES ERP using Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;

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
        throw new Error('API_KEY_MISSING: Please configure VITE_API_KEY in your .env file and restart the dev server');
    }

    try {
        // Use the latest stable flash model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const fullMessage = context ? `${message}\n\nContext:\n${context}` : message;

        const result = await model.generateContent(fullMessage);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error.message.includes('API key not valid')) {
            throw new Error('API_KEY_INVALID: The provided API key is not valid. Please check your .env configuration.');
        }
        throw new Error(`Connection failed: ${error.message}`);
    }
}

/**
 * Perform data analysis using Gemini AI
 */
export async function analyzeData(
    data: Record<string, any>[],
    prompt: string
): Promise<AnalysisResult> {
    const context = `
        Analyze the following dataset and provide insights.
        Dataset:
        ${JSON.stringify(data.slice(0, 20), null, 2)}
    `;

    const analysisPrompt = `
        ${prompt}
        
        Based on the data, provide:
        1. A concise summary of the current situation.
        2. Key insights and potential issues.
        3. A list of actionable recommendations.

        Format the output as a JSON object with keys: "summary", "insights", "recommendations".
    `;

    const response = await sendChatMessage(analysisPrompt, context);

    try {
        const result = JSON.parse(response.replace(/```json|```/g, ''));
        return {
            summary: result.summary || 'No summary provided.',
            insights: result.insights || 'No insights generated.',
            recommendations: result.recommendations || [],
        };
    } catch (e) {
        console.error("Failed to parse AI analysis response:", e);
        return {
            summary: "AI analysis failed.",
            insights: "Could not parse the response from the AI. The raw response is provided below.",
            recommendations: [response],
        };
    }
}
