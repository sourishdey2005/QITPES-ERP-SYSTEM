# 🏢 QITPES ERP System

A comprehensive, production-ready Enterprise Resource Planning (ERP) system built with React, TypeScript, and Supabase, featuring AI-powered data analysis and insights.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)

## 🌟 Features

### Core ERP Modules
- 📊 **Dashboard** - Real-time business metrics and KPIs
- 📁 **Projects** - Project management and tracking
- 🛒 **Purchasing** - Procurement and vendor management
- 🏭 **Production** - Manufacturing and operations
- 📦 **Inventory** - Stock management and tracking
- 💰 **Finance** - Accounting, ledger, and financial reporting
- 👥 **HR Management** - Employee records and payroll
- 🚗 **Fleet & Machinery** - Asset tracking and maintenance

### Advanced Features
- 🤖 **AI Assistant** - Powered by Google Gemini AI
  - Natural language queries about your data
  - Automated data analysis and insights
  - Financial trend analysis
  - Project performance recommendations
- 📈 **BI Analytics** - Business intelligence dashboards
- 🔄 **Workflow Automation** - Custom automation protocols
- 📅 **Enterprise Calendar** - Scheduling and collaboration
- 🎯 **OKR Tracking** - Objectives and Key Results management
- 🔐 **Role-Based Access** - Owner, Director, Accounting roles

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/qitpes-erp-system.git
cd qitpes-erp-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up the database**
```bash
# Run the SQL schema in your Supabase project
# File: db.sql
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:5173
```

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **React Router** - Navigation
- **Recharts** - Data visualization

### Backend
- **Supabase** - PostgreSQL database
- **Row Level Security** - Data protection
- **Real-time subscriptions** - Live updates

### AI Integration
- **Google Generative AI** - Gemini 1.5 Pro
- **Natural Language Processing** - Chat interface
- **Automated Analysis** - Data insights

## 📁 Project Structure

```
qitpes-erp-system/
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── AIDataAnalysis.tsx
│   ├── Projects.tsx
│   └── ...
├── layouts/            # Layout components
│   └── DashboardLayout.tsx
├── lib/                # Utilities and services
│   ├── supabase.ts
│   ├── ai-service.ts
│   └── genkit.ts
├── constants.tsx       # Navigation and constants
├── types.ts            # TypeScript types
├── db.sql              # Database schema
└── .env.example        # Environment template
```

## 🤖 AI Features

### AI Assistant
The QITPES AI Assistant provides:
- **Conversational Interface** - Ask questions in natural language
- **Suggested Queries** - Pre-built questions to get started
- **Context-Aware Responses** - Uses your actual ERP data
- **Real-time Analysis** - Instant insights

### Data Analysis
- **Financial Analysis** - Revenue trends, expense patterns
- **Project Insights** - Performance metrics, delays
- **Inventory Optimization** - Stock level recommendations
- **Automated Reports** - JSON-formatted analysis results

## 🎨 Design System

- **Color Scheme** - Vibrant orange theme
- **Typography** - Modern, clean fonts
- **Responsive** - Mobile-first design
- **Accessibility** - WCAG compliant
- **Dark Mode** - Coming soon

## 🔐 Security

- ✅ Environment variables for sensitive data
- ✅ Row Level Security (RLS) in Supabase
- ✅ Role-based access control
- ✅ API key validation
- ✅ Secure authentication

## 📊 Database Schema

The system uses PostgreSQL via Supabase with the following main tables:
- `profiles` - User profiles and roles
- `projects` - Project management
- `finance_transactions` - Financial records
- `inventory` - Stock items
- `journal_entries` - Accounting ledger
- `workflows` - Automation protocols

See `db.sql` for complete schema.

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Code Style
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes (for AI features) |
| `NODE_ENV` | Environment mode | No |

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the dist/ folder
```

### Docker
```dockerfile
# Coming soon
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Abhradeep Hazra** - Director , QITPES
-  **Sourish Dey** - Developer

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- Supabase for backend infrastructure
- React community for amazing tools

## 📞 Support

For support, email sourish713321@gmail.com or open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] API documentation
- [ ] Webhook integrations
- [ ] Export to Excel/PDF

---

**Built with ❤️ for modern enterprises**
