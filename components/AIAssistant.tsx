import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Send, X, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const model = 'gemini-3-flash-preview';
      
      const prompt = `You are the QITPES ERP Intelligence Assistant.
      The user is asking: "${query}"
      
      Context: The current year is 2026. The ERP manages Indian enterprise sites.
      Instructions: Provide a professional, concise response based on ERP logic. 
      If asked about data you don't have, explain that you can query active site ledgers once configured.
      Format: Use clear bullet points if needed.`;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setResponse(result.text || "I'm sorry, I couldn't process that request.");
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setResponse("System Error: Unable to connect to AI Strategy engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-700 transition-all z-[100]"
      >
        <Sparkles size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[100] overflow-hidden"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={20} className="text-blue-400" />
                <span className="font-bold text-sm">QITPES AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!response && !loading && (
                <div className="text-center py-10 px-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900">Ask your ERP anything</h3>
                  <p className="text-xs text-slate-500 mt-2">"What is our current burn rate for the Nagpur project?"</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={32} className="text-blue-600 animate-spin mb-4" />
                  <p className="text-xs text-slate-500 font-medium">Analyzing enterprise data...</p>
                </div>
              )}

              {response && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed"
                >
                  {response}
                </motion.div>
              )}
            </div>

            <form onSubmit={handleAskAI} className="p-4 border-t border-slate-100 flex items-center gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;