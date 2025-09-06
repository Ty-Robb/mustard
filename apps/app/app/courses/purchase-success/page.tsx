'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PurchaseSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      fetchPurchaseDetails();
    }
  }, [sessionId]);

  const fetchPurchaseDetails = async () => {
    try {
      const response = await fetch(`/api/payments/checkout?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseDetails(data);
      }
    } catch (error) {
      console.error('Error fetching purchase details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. You now have access to your course.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {purchaseDetails && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Purchase Details</h3>
              <div className="space-y-1 text-sm">
                <p>Total: ${purchaseDetails.total} {purchaseDetails.currency?.toUpperCase()}</p>
                <p>Status: {purchaseDetails.status}</p>
                {purchaseDetails.completedAt && (
                  <p>Completed: {new Date(purchaseDetails.completedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">What's Next?</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>You can access your course from the My Courses page</li>
              <li>Check your email for a receipt and course access details</li>
              <li>Start learning at your own pace</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link href="/courses/my-courses">Go to My Courses</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/courses">Browse More Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// This should be implemented by the app to get the auth token
async function getAuthToken(): Promise<string> {
  // Implementation depends on your auth setup
  return '';
}
