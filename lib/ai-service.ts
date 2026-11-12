// AI Service for QITPES ERP using Google Generative AI SDK
import * as GenAI from "@google/genai";

const getApiKey = (): string | undefined => {
    const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
    return key && key !== 'undefined' ? key : undefined;
};

// The client is created lazily. Constructing it at module scope threw
// "API key must be set" whenever the env var was missing, and because this
// module is imported by the dashboard layout it took the whole app down.
let aiClient: GenAI.GoogleGenAI | null = null;

const getClient = (): GenAI.GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API_KEY_MISSING: Please configure VITE_API_KEY in your .env file and restart the dev server');
    }
    if (!aiClient) {
        aiClient = new GenAI.GoogleGenAI({ apiKey });
    }
    return aiClient;
};

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
    try {
        const ai = getClient();
        const fullMessage = context ? `${message}\n\nContext:\n${context}` : message;

        // Using the New SDK and Model
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: fullMessage }] }]
        });

        return result.text || '';
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error.message && error.message.includes('API key not valid')) {
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
