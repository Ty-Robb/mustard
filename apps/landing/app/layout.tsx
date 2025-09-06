import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mustard - AI-Powered Bible Study Platform',
  description: 'Transform your Bible study with AI-powered insights, personalized reading plans, interactive quizzes, and collaborative learning tools.',
  keywords: 'Bible study, AI Bible, scripture analysis, reading plans, Bible quiz, Christian education',
  openGraph: {
    title: 'Mustard - AI-Powered Bible Study Platform',
    description: 'Transform your Bible study with AI-powered insights and collaborative learning tools.',
    url: 'https://mustard.app',
    siteName: 'Mustard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mustard - AI-Powered Bible Study',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mustard - AI-Powered Bible Study Platform',
    description: 'Transform your Bible study with AI-powered insights and collaborative learning tools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
