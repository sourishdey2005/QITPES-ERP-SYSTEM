# AI Integration Guide - QITPES ERP System

## 🤖 Overview
Your QITPES ERP system now includes **AI-powered data analysis and chatbot functionality** using **Google Gemini AI**.

## 📁 Files Created/Modified

### New Files:
1. **`.env`** - Environment configuration with API keys
2. **`lib/ai-service.ts`** - Direct Gemini API integration service
3. **`pages/AIDataAnalysis.tsx`** - AI Data Analysis Hub page
4. **`vite-env.d.ts`** - TypeScript environment variable definitions

### Modified Files:
1. **`App.tsx`** - Added AI Data Analysis route
2. **`constants.tsx`** - Added navigation item for AI Analysis
3. **`layouts/DashboardLayout.tsx`** - Updated with orange theme

## 🔑 API Key Configuration

Your Gemini API key is stored in `.env`:
```
VITE_GEMINI_API_KEY=AIzaSyDTUC8ucgceKHSQsvNQykA04f3BvoONUHk
```

**Important:** This key is already configured and ready to use!

## 🚀 Features

### 1. AI Chatbot
- **Location:** Navigate to "AI Data Analysis" in the Analytics section
- **Capabilities:**
  - Answer questions about your ERP data
  - Provide insights on financial trends
  - Help with project management queries
  - Assist with inventory analysis
  - Suggest workflow optimizations

### 2. Automated Data Analysis
- **Datasets Supported:**
  - Financial Transactions
  - Project Performance
  - Inventory Levels
- **Output:**
  - Key Insights
  - Actionable Recommendations
  - Executive Summary

## 📊 How to Use

### Chat with AI Assistant:
1. Navigate to **Analytics → AI Data Analysis**
2. Type your question in the chat input
3. Press Enter or click Send
4. AI will analyze your data and respond

**Example Questions:**
- "What are the main financial trends this quarter?"
- "Which projects are performing best?"
- "Are there any inventory issues I should address?"

### Run Data Analysis:
1. Select a dataset (Financial/Projects/Inventory)
2. Click "Run AI Analysis"
3. Review the generated insights and recommendations

## 🛠️ Technical Details

### Architecture:
- **Frontend:** React + TypeScript
- **AI Service:** Direct Google Gemini API integration
- **API Model:** `gemini-pro`
- **Authentication:** API Key-based

### API Endpoints:
The system uses Google's Generative Language API:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

### Error Handling:
- Graceful fallbacks for API failures
- User-friendly error messages
- Automatic retry suggestions

## 🔒 Security Notes

1. **API Key Storage:** 
   - Stored in `.env` file (not committed to git)
   - Accessed via `import.meta.env.VITE_GEMINI_API_KEY`

2. **Data Privacy:**
   - Only sends limited data samples to AI (max 20 records)
   - No sensitive credentials sent to external APIs
   - All communication over HTTPS

## 🎨 UI Features

- **Orange Theme:** Consistent with your site-wide theme
- **Real-time Chat:** Instant responses from AI
- **Loading States:** Visual feedback during analysis
- **Responsive Design:** Works on all screen sizes

## 📝 Navigation

Access the AI features via:
- **Sidebar:** Analytics → AI Data Analysis
- **Direct URL:** `/#/ai-analysis`
- **Roles:** Available to Owner and Director roles

## 🐛 Troubleshooting

### If AI doesn't respond:
1. Check your internet connection
2. Verify the API key in `.env` is correct
3. Check browser console for errors
4. Ensure you have data in the selected dataset

### Common Issues:
- **"API key not configured"**: Restart the dev server after adding `.env`
- **"No data available"**: Add transactions/projects/inventory first
- **"Analysis failed"**: Check API quota limits on Google Cloud Console

## 🔄 Future Enhancements

Potential improvements:
- Multi-turn conversation memory
- Export analysis reports
- Scheduled automated insights
- Custom AI training on your data
- Voice input support

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [React Query Docs](https://tanstack.com/query/latest)

---

**Your AI-powered ERP system is ready to use!** 🎉

Navigate to the AI Data Analysis page and start exploring your data with AI assistance.
