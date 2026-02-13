
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, TrendingUp, BarChart3, PieChart, LineChart, Loader2, Download, Trash2, Eye } from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const motion = motionBase as any;

interface FileData {
    name: string;
    data: any[];
    columns: string[];
    rowCount: number;
}

interface InsightData {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    visualizations: {
        type: 'bar' | 'line' | 'pie';
        title: string;
        data: any[];
        xKey?: string;
        yKey?: string;
        nameKey?: string;
        valueKey?: string;
    }[];
}

const COLORS = ['#EA4643', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const DataInsights: React.FC = () => {
    const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insights, setInsights] = useState<InsightData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
            setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
            return;
        }

        try {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    let workbook: XLSX.WorkBook;

                    if (fileExtension === 'csv') {
                        workbook = XLSX.read(data, { type: 'binary' });
                    } else {
                        workbook = XLSX.read(data, { type: 'array' });
                    }

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    if (jsonData.length === 0) {
                        setError('The file appears to be empty');
                        return;
                    }

                    const columns = Object.keys(jsonData[0] as object);

                    setUploadedFile({
                        name: file.name,
                        data: jsonData,
                        columns,
                        rowCount: jsonData.length
                    });

                    setInsights(null); // Clear previous insights
                } catch (err) {
                    setError('Error parsing file. Please ensure it\'s a valid CSV or Excel file.');
                    console.error(err);
                }
            };

            if (fileExtension === 'csv') {
                reader.readAsBinaryString(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        } catch (err) {
            setError('Error reading file');
            console.error(err);
        }
    };

    const analyzeWithGemini = async () => {
        if (!uploadedFile) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file');
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            // Prepare data summary for Gemini
            const dataSample = uploadedFile.data.slice(0, 10); // First 10 rows
            const dataInfo = {
                fileName: uploadedFile.name,
                columns: uploadedFile.columns,
                rowCount: uploadedFile.rowCount,
                sampleData: dataSample
            };

            const prompt = `You are a data analyst. Analyze this dataset and provide insights in the following JSON format:

{
  "summary": "A brief 2-3 sentence summary of what this data represents",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "visualizations": [
    {
      "type": "bar" | "line" | "pie",
      "title": "Chart title",
      "data": [{"name": "Category", "value": 100}],
      "xKey": "name",
      "yKey": "value",
      "nameKey": "name",
      "valueKey": "value"
    }
  ]
}

Dataset Information:
- File: ${dataInfo.fileName}
- Columns: ${dataInfo.columns.join(', ')}
- Total Rows: ${dataInfo.rowCount}
- Sample Data (first 10 rows): ${JSON.stringify(dataSample, null, 2)}

Provide actionable insights and suggest 2-3 meaningful visualizations based on the data. Make sure the visualization data uses actual column names from the dataset. Return ONLY valid JSON, no markdown formatting.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Clean up the response - remove markdown code blocks if present
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const parsedInsights: InsightData = JSON.parse(text);
            setInsights(parsedInsights);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze data. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const clearData = () => {
        setUploadedFile(null);
        setInsights(null);
        setError(null);
    };

    const renderVisualization = (viz: InsightData['visualizations'][0], index: number) => {
        if (!viz.data || viz.data.length === 0) return null;

        return (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm"
            >
                <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{viz.title}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    {viz.type === 'bar' && (
                        <BarChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey={viz.xKey || 'name'} stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontWeight: 600
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                            <Bar dataKey={viz.yKey || 'value'} fill="#EA4643" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    )}
                    {viz.type === 'line' && (
                        <RechartsLineChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey={viz.xKey || 'name'} stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontWeight: 600
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                            <Line type="monotone" dataKey={viz.yKey || 'value'} stroke="#EA4643" strokeWidth={3} dot={{ fill: '#EA4643', r: 5 }} />
                        </RechartsLineChart>
                    )}
                    {viz.type === 'pie' && (
                        <RechartsPieChart>
                            <Pie
                                data={viz.data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey={viz.valueKey || 'value'}
                                nameKey={viz.nameKey || 'name'}
                            >
                                {viz.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontWeight: 600
                                }}
                            />
                        </RechartsPieChart>
                    )}
                </ResponsiveContainer>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8 page-transition text-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">AI Data Insights</h1>
                    <p className="text-slate-500 text-sm font-medium">Upload CSV/Excel files and get AI-powered analysis with visualizations</p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-[48px] border-2 border-dashed border-slate-200 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mb-6">
                        <Upload size={40} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Upload Your Data</h2>
                    <p className="text-slate-500 mb-6 max-w-md font-medium">
                        Upload CSV or Excel files (.csv, .xlsx, .xls) to get instant AI-powered insights and visualizations
                    </p>

                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="bg-red-600 text-white px-8 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:bg-red-700 transition-all flex items-center gap-3">
                            <FileSpreadsheet size={20} />
                            Choose File
                        </div>
                    </label>

                    {uploadedFile && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-[20px] flex items-center gap-3"
                        >
                            <FileSpreadsheet size={20} className="text-green-600" />
                            <div className="text-left">
                                <p className="font-black text-sm text-green-900">{uploadedFile.name}</p>
                                <p className="text-xs text-green-600 font-bold">
                                    {uploadedFile.rowCount} rows × {uploadedFile.columns.length} columns
                                </p>
                            </div>
                            <button
                                onClick={clearData}
                                className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="Remove file"
                            >
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-[20px] text-red-600 font-bold text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Analyze Button */}
            {uploadedFile && !insights && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <button
                        onClick={analyzeWithGemini}
                        disabled={isAnalyzing}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Analyzing with Gemini AI...
                            </>
                        ) : (
                            <>
                                <Sparkles size={24} />
                                Analyze with Gemini AI
                            </>
                        )}
                    </button>
                </motion.div>
            )}

            {/* Insights Section */}
            {insights && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Summary */}
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-[32px] border border-purple-200">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-600 rounded-[16px] flex items-center justify-center shrink-0">
                                    <Sparkles size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">AI Summary</h3>
                                    <p className="text-slate-700 font-medium leading-relaxed">{insights.summary}</p>
                                </div>
                            </div>
                        </div>

                        {/* Key Findings */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp size={24} className="text-red-600" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Key Findings</h3>
                            </div>
                            <ul className="space-y-3">
                                {insights.keyFindings.map((finding, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3 p-4 bg-slate-50 rounded-[16px]"
                                    >
                                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-white text-xs font-black">{index + 1}</span>
                                        </div>
                                        <p className="text-slate-700 font-medium">{finding}</p>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <BarChart3 size={24} className="text-blue-600" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recommendations</h3>
                            </div>
                            <ul className="space-y-3">
                                {insights.recommendations.map((recommendation, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-start gap-3 p-4 bg-blue-50 rounded-[16px]"
                                    >
                                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-white text-xs font-black">✓</span>
                                        </div>
                                        <p className="text-slate-700 font-medium">{recommendation}</p>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Visualizations */}
                        {insights.visualizations && insights.visualizations.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <PieChart size={24} className="text-purple-600" />
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Data Visualizations</h3>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {insights.visualizations.map((viz, index) => renderVisualization(viz, index))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={clearData}
                                className="bg-slate-100 text-slate-700 px-8 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3"
                            >
                                <Trash2 size={18} />
                                Clear & Upload New
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default DataInsights;
