import { ArrowRight, BookOpen, Brain, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Mustard</h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">
                Testimonials
              </Link>
              <Link
                href="https://app.mustard.app/signin"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-up">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Bible Study with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                AI-Powered Insights
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover deeper meaning in scripture with personalized reading plans, AI-generated summaries, 
              interactive quizzes, and collaborative study tools designed to enhance your spiritual journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://app.mustard.app/signup"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative animate-fade-up">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <p className="text-gray-500 text-center">App Screenshot Placeholder</p>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Deep Bible Study
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed to help you understand, remember, and apply God's word in your daily life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Insights',
                description: 'Get instant summaries, themes, and contextual understanding of any passage.',
              },
              {
                icon: BookOpen,
                title: 'Reading Plans',
                description: 'Follow structured plans or create custom ones tailored to your spiritual goals.',
              },
              {
                icon: Sparkles,
                title: 'Interactive Quizzes',
                description: 'Test your knowledge and track progress with AI-generated quizzes.',
              },
              {
                icon: Users,
                title: 'Study Groups',
                description: 'Join or create groups to study together and share insights with others.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Bible Study?
          </h3>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of believers deepening their faith with Mustard.
          </p>
          <Link
            href="https://app.mustard.app/signup"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold text-gray-900">Mustard</h4>
              <p className="text-gray-600 mt-1">AI-Powered Bible Study Platform</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition">
                Terms of Service
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition">
                Contact
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-gray-600">
            <p>&copy; 2025 Mustard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
