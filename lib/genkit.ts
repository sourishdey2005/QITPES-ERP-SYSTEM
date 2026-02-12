// Genkit AI Configuration for QITPES ERP
import { genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with Google AI
export const ai = genkit({
    plugins: [
        googleAI({
            apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
        }),
    ],
});

// Define AI models
export const geminiPro = ai.model('googleai/gemini-pro');
export const geminiProVision = ai.model('googleai/gemini-pro-vision');

// Chat flow for ERP Assistant
export const erpChatFlow = ai.defineFlow(
    {
        name: 'erpChatFlow',
        inputSchema: ai.schema.object({
            message: ai.schema.string(),
            context: ai.schema.string().optional(),
        }),
        outputSchema: ai.schema.string(),
    },
    async (input) => {
        const systemPrompt = `You are an intelligent ERP assistant for QITPES ERP System. 
    You help users with:
    - Data analysis and insights
    - Financial reporting
    - Project management queries
    - HR and payroll questions
    - Inventory management
    - Workflow automation suggestions
    
    Provide concise, actionable responses. Use the context provided when available.`;

        const prompt = input.context
            ? `${systemPrompt}\n\nContext: ${input.context}\n\nUser: ${input.message}`
            : `${systemPrompt}\n\nUser: ${input.message}`;

        const response = await geminiPro.generate({
            prompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            },
        });

        return response.text;
    }
);

// Data Analysis Flow
export const dataAnalysisFlow = ai.defineFlow(
    {
        name: 'dataAnalysisFlow',
        inputSchema: ai.schema.object({
            data: ai.schema.string(),
            analysisType: ai.schema.string(),
        }),
        outputSchema: ai.schema.object({
            insights: ai.schema.string(),
            recommendations: ai.schema.array(ai.schema.string()),
            summary: ai.schema.string(),
        }),
    },
    async (input) => {
        const prompt = `Analyze the following ${input.analysisType} data from an ERP system:

${input.data}

Provide:
1. Key insights (trends, patterns, anomalies)
2. Actionable recommendations
3. Executive summary

Format as JSON with fields: insights, recommendations (array), summary`;

        const response = await geminiPro.generate({
            prompt,
            config: {
                temperature: 0.5,
                maxOutputTokens: 2000,
            },
        });

        try {
            return JSON.parse(response.text);
        } catch {
            return {
                insights: response.text,
                recommendations: ['Review the analysis manually'],
                summary: 'Analysis completed',
            };
        }
    }
);

export default ai;
