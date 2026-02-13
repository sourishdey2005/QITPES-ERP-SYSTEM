
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sparkles, Send, X, Bot, Loader2, User } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are the QITPES ERP Intelligence Assistant.
      The user is asking: "${query}"
      
      Context: The current year is 2026. The ERP manages Indian enterprise sites.
      Instructions: Provide a professional, concise response based on ERP logic. 
      If asked about data you don't have, explain that you can query active site ledgers once configured.
      Format: Use clear bullet points if needed.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const assistantMessage: Message = { role: 'assistant', content: text || "I'm sorry, I couldn't process that request." };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = { role: 'assistant', content: "System Error: Unable to connect to AI Strategy engine." };
      setMessages(prev => [...prev, errorMessage]);
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

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center py-10 px-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900">Ask your ERP anything</h3>
                  <p className="text-xs text-slate-500 mt-2">"What is our current burn rate for the Nagpur project?"</p>
                </div>
              )}
              
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center flex-shrink-0"><Bot size={20} /></div>}
                    <div className={`p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0"><User size={20} /></div>}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex items-center gap-2 p-4">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center flex-shrink-0"><Bot size={20} /></div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <Loader2 size={20} className="text-blue-600 animate-spin" />
                    </div>
                </div>
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
