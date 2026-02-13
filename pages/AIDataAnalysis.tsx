
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Brain, TrendingUp, MessageSquare, BarChart3, Sparkles, Send, Loader2, Lightbulb, Zap } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import { sendChatMessage, analyzeData, type AnalysisResult } from '../lib/ai-service';

const motion = motionBase as any;

// Suggested queries for users
const SUGGESTED_QUERIES = [
    "What are my top financial trends this month?",
    "Which projects need immediate attention?",
    "Show me inventory items running low",
    "Analyze my revenue vs expenses",
    "What are the key performance indicators?",
    "Suggest ways to optimize costs"
];

const AIDataAnalysis: React.FC = () => {
    const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
    const [userInput, setUserInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [selectedDataset, setSelectedDataset] = useState('financial');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Fetch data for analysis
    const { data: financialData } = useQuery({
        queryKey: ['ai-financial-data'],
        queryFn: async () => {
            const { data } = await supabase
                .from('finance_transactions')
                .select('*')
                .order('transaction_date', { ascending: false })
                .limit(100);
            return data || [];
        }
    });

    const { data: projectData } = useQuery({
        queryKey: ['ai-project-data'],
        queryFn: async () => {
            const { data } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });
            return data || [];
        }
    });

    const { data: inventoryData } = useQuery({
        queryKey: ['ai-inventory-data'],
        queryFn: async () => {
            const { data } = await supabase
                .from('inventory')
                .select('*')
                .order('last_updated', { ascending: false });
            return data || [];
        }
    });

    // AI chat with real Gemini integration
    const handleSendMessage = async (messageText?: string) => {
        const textToSend = messageText || userInput.trim();
        if (!textToSend) return;

        console.log('🔵 Sending message:', textToSend);

        // Add user message immediately to UI
        const newUserMessage = { role: 'user', content: textToSend };
        console.log('🔵 New user message object:', newUserMessage);

        setChatMessages(prev => {
            const updated = [...prev, newUserMessage];
            console.log('🔵 Updated messages after user:', updated);
            return updated;
        });

        setUserInput('');
        setIsAnalyzing(true);

        try {
            const context = getDataContext();
            const response = await sendChatMessage(textToSend, context);

            console.log('🟢 AI response received:', response);

            // Add AI response
            setChatMessages(prev => {
                const updated = [...prev, { role: 'assistant', content: response }];
                console.log('🟢 Updated messages after AI:', updated);
                return updated;
            });
        } catch (error: any) {
            console.error('🔴 Chat error:', error);

            let errorMessage = 'I apologize, but I encountered an error.';

            if (error.message.includes('API_KEY_MISSING')) {
                errorMessage = '⚠️ API Key not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.';
            } else if (error.message.includes('API Error')) {
                errorMessage = `⚠️ ${error.message}\n\nPlease check:\n1. Your API key is valid\n2. You have API quota remaining\n3. Your internet connection`;
            } else {
                errorMessage = `⚠️ Connection error: ${error.message}`;
            }

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage
            }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getDataContext = () => {
        const data = selectedDataset === 'financial' ? financialData :
            selectedDataset === 'projects' ? projectData : inventoryData;
        return JSON.stringify(data?.slice(0, 10) || []);
    };

    const runDataAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const dataToAnalyze = selectedDataset === 'financial' ? financialData :
                selectedDataset === 'projects' ? projectData : inventoryData;

            if (!dataToAnalyze || dataToAnalyze.length === 0) {
                setAnalysisResult({
                    insights: 'No data available for analysis.',
                    recommendations: ['Add data to this module to enable AI analysis'],
                    summary: 'Insufficient data'
                });
                return;
            }

            const result = await analyzeData(dataToAnalyze, selectedDataset);
            setAnalysisResult(result);
        } catch (error: any) {
            console.error('Analysis error:', error);
            setAnalysisResult({
                insights: error.message.includes('API_KEY_MISSING')
                    ? 'API key not configured. Please check your .env file.'
                    : 'Analysis failed. Please check your API configuration.',
                recommendations: ['Verify your Gemini API key in .env file', 'Restart the dev server after adding the key', 'Check your internet connection'],
                summary: 'Analysis error occurred'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSuggestedQuery = (query: string) => {
        setUserInput(query);
        handleSendMessage(query);
    };

    return (
        <div className="space-y-6 page-transition">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Brain className="text-red-600" size={36} />
                        QITPES AI Assistant
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Powered by Google Gemini AI • Real-time Data Analysis</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-200">
                    <Sparkles size={18} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Enabled</span>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    icon={<TrendingUp size={24} />}
                    label="Insights Generated"
                    value={analysisResult ? "1" : "0"}
                    trend="Ready to analyze"
                />
                <MetricCard
                    icon={<MessageSquare size={24} />}
                    label="AI Conversations"
                    value={Math.floor(chatMessages.length / 2).toString()}
                    trend="Active session"
                />
                <MetricCard
                    icon={<BarChart3 size={24} />}
                    label="Messages Exchanged"
                    value={chatMessages.length.toString()}
                    trend="Real-time"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Chat Interface */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <MessageSquare className="text-red-600" size={20} />
                            ERP AI Assistant
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Ask questions about your data • Get instant insights</p>
                    </div>

                    {/* Suggested Queries */}
                    {chatMessages.length === 0 && (
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb size={16} className="text-red-600" />
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Suggested Questions</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {SUGGESTED_QUERIES.slice(0, 3).map((query, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestedQuery(query)}
                                        className="text-left px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:border-red-300 hover:bg-red-50 transition-all"
                                    >
                                        💡 {query}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="text-center py-12">
                                <Brain size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 text-sm font-medium">Start a conversation with your AI assistant</p>
                                <p className="text-slate-300 text-xs mt-2">Try one of the suggested questions above</p>
                            </div>
                        )}
                        {chatMessages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                    }`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    <span className="text-[10px] opacity-60 mt-2 block">
                                        {msg.role === 'user' ? 'You' : 'AI Assistant'} • {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        {isAnalyzing && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-3">
                                    <Loader2 className="animate-spin text-red-600" size={20} />
                                    <span className="text-sm text-slate-600">AI is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="Ask about trends, insights, or recommendations..."
                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                disabled={isAnalyzing}
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isAnalyzing || !userInput.trim()}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Press Enter to send • Shift+Enter for new line</p>
                    </div>
                </div>

                {/* Data Analysis Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <BarChart3 className="text-red-600" size={20} />
                            Automated Data Analysis
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">AI-powered insights from your data</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Dataset</label>
                            <select
                                value={selectedDataset}
                                onChange={(e) => setSelectedDataset(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
                            >
                                <option value="financial">💰 Financial Transactions</option>
                                <option value="projects">📊 Project Performance</option>
                                <option value="inventory">📦 Inventory Levels</option>
                            </select>
                        </div>

                        <button
                            onClick={runDataAnalysis}
                            disabled={isAnalyzing}
                            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="animate-spin" size={18} /> Analyzing Data...</>
                            ) : (
                                <><Zap size={18} /> Run AI Analysis</>
                            )}
                        </button>
                    </div>

                    {analysisResult && (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                                    <TrendingUp size={16} /> Key Insights
                                </h4>
                                <p className="text-sm text-red-800 leading-relaxed">{analysisResult.insights}</p>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <Lightbulb size={16} /> Recommendations
                                </h4>
                                <ul className="space-y-2">
                                    {analysisResult.recommendations.map((rec: string, idx: number) => (
                                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                            <span className="text-blue-600 font-bold">•</span>
                                            <span className="flex-1">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                    <BarChart3 size={16} /> Executive Summary
                                </h4>
                                <p className="text-sm text-emerald-800 leading-relaxed">{analysisResult.summary}</p>
                            </div>
                        </div>
                    )}

                    {!analysisResult && (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="text-center">
                                <Sparkles size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 text-sm font-medium">Select a dataset and run analysis</p>
                                <p className="text-slate-300 text-xs mt-2">Get AI-powered insights in seconds</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, trend }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                {icon}
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                {trend}
            </span>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
    </div>
);

export default AIDataAnalysis;
