'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Lock, 
  CheckCircle, 
  Tag,
  TrendingUp,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { CoursePrice } from '@/types/payment';

interface CoursePricingProps {
  courseId: string;
  courseTitle: string;
  isOwned?: boolean;
  onPurchaseSuccess?: () => void;
}

export function CoursePricing({ 
  courseId, 
  courseTitle,
  isOwned = false,
  onPurchaseSuccess 
}: CoursePricingProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [pricing, setPricing] = useState<CoursePrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchPricing();
    }
  }, [courseId]);

  const fetchPricing = async () => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      const mockPricing: CoursePrice = {
        courseId,
        basePrice: 49.99,
        currency: 'USD',
        dynamicPricing: {
          enabled: true,
          algorithm: 'van_westendorp',
          lastAdjusted: new Date(),
          adjustmentPercentage: 10, // 10% increase based on demand
        }
      };
      
      setPricing(mockPricing);
    } catch (err) {
      setError('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!pricing) return 0;
    
    let price = pricing.basePrice;
    
    // Apply dynamic pricing adjustment
    if (pricing.dynamicPricing?.enabled) {
      price = price * (1 + pricing.dynamicPricing.adjustmentPercentage / 100);
    }
    
    return price;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseIds: [courseId],
          discountCode: discountCode || undefined,
          successUrl: `${window.location.origin}/courses/${courseId}/preview?purchase=success`,
          cancelUrl: `${window.location.origin}/courses/${courseId}/preview?purchase=cancelled`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isOwned) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            You own this course
          </CardTitle>
          <CardDescription>
            You have full access to all course content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={() => router.push(`/lms-test?courseId=${courseId}`)}
          >
            Start Learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Pricing information is not available for this course.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const finalPrice = calculateFinalPrice();
  const hasDiscount = pricing.dynamicPricing?.enabled && pricing.dynamicPricing.adjustmentPercentage < 0;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>Get Full Access</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {formatCurrency(finalPrice, pricing.currency)}
            </span>
            {pricing.dynamicPricing?.enabled && pricing.dynamicPricing.adjustmentPercentage !== 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(pricing.basePrice, pricing.currency)}
                </span>
                <Badge variant={hasDiscount ? "default" : "secondary"} className="gap-1">
                  {hasDiscount ? <Tag className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  {Math.abs(pricing.dynamicPricing.adjustmentPercentage)}% {hasDiscount ? 'OFF' : 'demand pricing'}
                </Badge>
              </>
            )}
          </div>
          <CardDescription>
            One-time payment • Lifetime access
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What's Included */}
        <div className="space-y-2">
          <p className="text-sm font-medium">What's included:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Full access to all course content
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Interactive AI-powered lessons
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Quizzes and assignments
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Certificate of completion
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Lifetime updates
            </li>
          </ul>
        </div>

        {/* Discount Code */}
        {showDiscountInput ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={purchasing}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiscountInput(false)}
                disabled={purchasing}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Have a discount code? Enter it above to apply savings.
            </p>
          </div>
        ) : (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={() => setShowDiscountInput(true)}
            disabled={purchasing}
          >
            <Tag className="h-3 w-3 mr-1" />
            Have a discount code?
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Purchase Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Purchase Course
            </>
          )}
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Secure payment powered by Stripe
        </div>

        {/* Pricing Survey Prompt */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Help us with pricing:</strong> Take our 2-minute pricing survey and get 10% off!
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto ml-2"
              onClick={() => router.push('/pricing/survey')}
            >
              Take Survey
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
