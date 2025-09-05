# Mustard 🌱 - Bible Study Platform

A comprehensive Bible study platform built with modern web technologies, featuring AI-powered insights, gamified learning, and collaborative study tools.

## 🚀 Overview

Mustard is a Next.js application built as a Turborepo monorepo, designed to make Bible study engaging and accessible through:

- **AI-Powered Summaries**: Get instant insights and summaries of Bible passages
- **Interactive Quizzes**: Test your knowledge with gamified quizzes and leaderboards
- **Reading Plans**: Create and follow structured Bible reading plans
- **Collaborative Features**: Study together with groups (coming soon)
- **Multiple Translations**: Access various Bible translations through the Bible API

## 📁 Project Structure

This Turborepo monorepo includes:

### Apps
- `apps/app`: The main Next.js application with all features

### Packages
- `packages/types`: Shared TypeScript type definitions used across the application
- `packages/config`: Shared configuration files (TypeScript configs)

### Documentation
- `docs/`: Comprehensive documentation including:
  - [Turborepo Migration Guide](./docs/turborepo-migration.md)
  - [MVP Launch Checklist](./docs/mvp-launch-checklist.md)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Monorepo**: Turborepo with npm workspaces
- **UI**: Shadcn UI + Tailwind CSS
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API
- **Payments**: Stripe
- **Bible Content**: Bible API

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Firebase project
- Required API keys (see Environment Setup)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ty-Robb/mustard.git
cd mustard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cd apps/app
cp .env.example .env.local
```

4. Configure your `.env.local` with required API keys and credentials

### Development

Run the development server:

```bash
# From the root directory
npm run dev

# Or run just the app
npm run dev --filter=app
```

### Build

Build all packages and the app:

```bash
npm run build
```

## 📦 Available Scripts

From the root directory:

- `npm run dev` - Start development server
- `npm run build` - Build all packages and apps
- `npm run lint` - Run ESLint across all packages
- `npm run clean` - Clean all build outputs and node_modules
- `npm run type-check` - Run TypeScript type checking

## 🔧 Environment Variables

Create a `.env.local` file in `apps/app` with:

```env
# Database
MONGODB_URI=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=

# APIs
BIBLE_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Google Cloud (for Vertex AI)
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS_JSON=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Features

### Current Features
- ✅ Bible reading with multiple translations
- ✅ AI-powered passage summaries and insights
- ✅ Interactive quizzes with scoring
- ✅ Reading plans with progress tracking
- ✅ AI chat with specialized Bible study agents
- ✅ Essay writing with AI assistance
- ✅ Presentation generation
- ✅ Export functionality (PDF, DOCX)

### Upcoming Features (MVP)
- 🔄 Subscription system with Stripe
- 🔄 Feature gating for free/premium tiers
- 🔄 Mobile responsiveness improvements
- 🔄 Enhanced error handling

### Future Roadmap
- 📅 Group study features
- 📅 Course creation and LMS
- 📅 Mobile applications
- 📅 Offline mode

## 🏗 Architecture

The application follows a modular architecture:

```
apps/app/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── lib/          # Core business logic
│   │   ├── services/ # API services
│   │   ├── agents/   # AI agents
│   │   └── utils/    # Utility functions
│   ├── hooks/        # Custom React hooks
│   └── types/        # Local type definitions
```

## 🚀 Deployment

The application is designed to be deployed on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on push

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Bible content provided by [Bible API](https://scripture.api.bible/)
- AI capabilities powered by Google Gemini
- UI components from [Shadcn UI](https://ui.shadcn.com/)

---

**Built with ❤️ for the glory of God**
