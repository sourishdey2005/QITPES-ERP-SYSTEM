
import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Send, Bot, Loader2, ArrowRight } from 'lucide-react';
import { motion as motionBase } from 'framer-motion';
import * as GenAI from "@google/genai";

const motion = motionBase as any;

const AIStrategy: React.FC = () => {
   const [prompt, setPrompt] = useState('');
   const [result, setResult] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);

   const generateStrategy = async () => {
      if (!prompt.trim()) return;
      setLoading(true);
      setResult(null);
      try {
         const ai = new GenAI.GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

         const fullPrompt = `Act as a senior ERP strategist. Based on the 2026 enterprise roadmap for QITPES, analyze this: ${prompt}. Provide high-level organizational insights.`;

         const generationResult = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
         });

         setResult(generationResult.text || "Unable to formulate strategy at this time.");
      } catch (e) {
         console.error("AI Strategy Error:", e);
         setResult("Strategic engine offline. Check configuration.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-6 page-transition max-w-4xl mx-auto">
         <div className="text-center space-y-2 py-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
               <BrainCircuit size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">AI Strategy Engine</h1>
            <p className="text-slate-500">Gemini-powered organizational intelligence and predictive forecasting.</p>
         </div>

         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
            <div className="space-y-4">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Strategic Query</label>
               <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Based on current site burn rates, what is our projected cash flow for Q4 2026?"
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-red-500/10 transition-all text-slate-800"
               />
               <button
                  onClick={generateStrategy}
                  disabled={loading}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:bg-slate-300 transition-all shadow-lg"
               >
                  {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Formulate Strategic Insight</>}
               </button>
            </div>

            {result && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 prose prose-slate max-w-none">
                  <div className="flex items-center gap-2 mb-4 text-red-600">
                     <Bot size={20} />
                     <span className="font-bold text-sm">Strategic Output</span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                     {result}
                  </div>
               </motion.div>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 text-blue-800 rounded-2xl border border-red-100 flex items-center justify-between group cursor-pointer">
               <div className="text-sm font-bold">Forecast 2027 Headcount</div>
               <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center justify-between group cursor-pointer">
               <div className="text-sm font-bold">Optimize Site Logistics</div>
               <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-all" />
            </div>
         </div>
      </div>
   );
};

export default AIStrategy;
