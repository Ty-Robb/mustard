'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestStripePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const testCheckout = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/test-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: 'test-course-123',
          courseName: 'Test Course',
          amount: 4999, // $49.99 in cents
          currency: 'usd',
          userId: 'test-user-123',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testStripeConfig = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/test-config');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test configuration');
      }

      setSuccess('Stripe configuration is valid! ' + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Stripe Integration</h1>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Verify that your Stripe configuration is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testStripeConfig} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Testing...' : 'Test Stripe Config'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Checkout</CardTitle>
            <CardDescription>
              Create a test checkout session with a sample course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Test Course Details:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Course ID: test-course-123</li>
                <li>Course Name: Test Course</li>
                <li>Price: $49.99</li>
                <li>User ID: test-user-123</li>
              </ul>
            </div>
            
            <Button 
              onClick={testCheckout} 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Checkout...' : 'Test Checkout ($49.99)'}
            </Button>

          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-500">Success</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-green-600 whitespace-pre-wrap">{success}</pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Test Cards</CardTitle>
            <CardDescription>Use these test card numbers in Stripe Checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Success:</strong> 4242 4242 4242 4242
              </div>
              <div>
                <strong>Decline:</strong> 4000 0000 0000 0002
              </div>
              <div>
                <strong>Requires authentication:</strong> 4000 0025 0000 3155
              </div>
              <div className="text-muted-foreground mt-2">
                Use any future date for expiry and any 3 digits for CVC
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
