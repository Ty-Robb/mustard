'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PricingSurvey } from '@/components/payment/PricingSurvey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Gift } from 'lucide-react';
import type { VanWestendorpResponses } from '@/types/payment';

export default function PricingSurveyPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (responses: VanWestendorpResponses) => {
    if (!currentUser) {
      setError('Please sign in to submit the survey');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/pricing/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      const data = await response.json();
      if (data.discountCode) {
        setDiscountCode(data.discountCode);
      }
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/courses/my-courses');
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Alert>
          <AlertDescription>
            Please sign in to participate in the pricing survey.
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

  if (isComplete) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              Your feedback helps us offer courses at the best possible value.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {discountCode && (
              <Alert className="max-w-md mx-auto">
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your discount code:</strong> {discountCode}
                  <br />
                  <span className="text-sm">Use this code for 10% off your next course purchase!</span>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={() => router.push('/courses/my-courses')}>
                Browse Courses
              </Button>
              <Button variant="outline" onClick={() => router.push('/pricing/analysis')}>
                View Pricing Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PricingSurvey
        onComplete={handleComplete}
        onSkip={handleSkip}
        productName="our courses"
        incentive={{
          type: 'discount',
          value: 10,
          description: 'receive a 10% discount code'
        }}
      />
    </div>
  );
}
