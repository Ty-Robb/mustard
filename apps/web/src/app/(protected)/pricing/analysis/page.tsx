'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3,
  Info,
  AlertCircle
} from 'lucide-react';
import type { PriceAnalysis } from '@/types/payment';

export default function PricingAnalysisPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchAnalysis();
    }
  }, [currentUser]);

  const fetchAnalysis = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/pricing/analysis', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Not enough survey data available yet. We need at least 10 responses to generate insights.');
        }
        throw new Error('Failed to fetch pricing analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getConfidenceLevel = (sampleSize: number) => {
    if (sampleSize < 10) return { level: 'Low', color: 'text-red-500' };
    if (sampleSize < 50) return { level: 'Moderate', color: 'text-yellow-500' };
    if (sampleSize < 100) return { level: 'Good', color: 'text-blue-500' };
    return { level: 'High', color: 'text-green-500' };
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert>
          <AlertDescription>
            Please sign in to view pricing analysis.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4" 
          onClick={() => router.push('/login')}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'No analysis data available'}</AlertDescription>
        </Alert>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Help Us Understand Pricing Better</CardTitle>
            <CardDescription>
              We use the Van Westendorp Price Sensitivity Meter to determine optimal pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              By participating in our pricing survey, you help us understand what prices work best 
              for our community while ensuring we can continue to provide high-quality courses.
            </p>
            <Button onClick={() => router.push('/pricing/survey')}>
              Take Pricing Survey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confidence = getConfidenceLevel(analysis.sampleSize);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Pricing Analysis</h1>
          <p className="text-muted-foreground">
            Community-driven pricing insights based on Van Westendorp analysis
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Optimal Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analysis.optimalPricePoint, analysis.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Best value perception
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Price Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analysis.acceptablePriceRange.min, analysis.currency)} - {formatCurrency(analysis.acceptablePriceRange.max, analysis.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acceptable range
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sample Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.sampleSize}</div>
              <p className={`text-xs mt-1 ${confidence.color}`}>
                {confidence.level} confidence
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Indifference Point
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analysis.indifferencePricePoint, analysis.currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Equal value perception
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Price Sensitivity Analysis</CardTitle>
            <CardDescription>
              Understanding how our community perceives course pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Points Explanation */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Optimal Price Point</h4>
                  <p className="text-sm text-muted-foreground">
                    At {formatCurrency(analysis.optimalPricePoint, analysis.currency)}, the number of people who think the price is too cheap 
                    equals those who think it's too expensive. This represents the best balance of perceived value.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Indifference Price Point</h4>
                  <p className="text-sm text-muted-foreground">
                    At {formatCurrency(analysis.indifferencePricePoint, analysis.currency)}, equal numbers of people think the price is 
                    cheap versus expensive (but not too cheap or too expensive).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                <div className="flex-1">
                  <h4 className="font-medium">Acceptable Price Range</h4>
                  <p className="text-sm text-muted-foreground">
                    The range from {formatCurrency(analysis.acceptablePriceRange.min, analysis.currency)} to {formatCurrency(analysis.acceptablePriceRange.max, analysis.currency)} represents 
                    prices that most people would find reasonable for our courses.
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence Indicator */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3">Analysis Confidence</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sample Size: {analysis.sampleSize} responses</span>
                  <span className={confidence.color}>{confidence.level} Confidence</span>
                </div>
                <Progress 
                  value={Math.min((analysis.sampleSize / 100) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  More survey responses increase the accuracy of our pricing analysis
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Help improve our pricing:</strong> If you haven't taken our pricing survey yet, 
                your input would be valuable. You'll also receive a 10% discount code as a thank you!
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button onClick={() => router.push('/pricing/survey')}>
                Take Pricing Survey
              </Button>
              <Button variant="outline" onClick={() => router.push('/courses/my-courses')}>
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-sm text-muted-foreground text-center">
          Last updated: {new Date(analysis.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
