'use client';

import React, { useState } from 'react';
import { getStripePublishableKey } from '../lib/stripe-client';

interface CheckoutButtonProps {
  courseIds: string[];
  className?: string;
  children?: React.ReactNode;
  onCheckout?: () => void;
  onError?: (error: Error) => void;
}

export function CheckoutButton({
  courseIds,
  className = '',
  children = 'Purchase Course',
  onCheckout,
  onError,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      onCheckout?.();

      // This will be called from the app with the proper auth token
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`, // This function should be provided by the app
        },
        body: JSON.stringify({ courseIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
}

// Helper function that should be implemented by the consuming app
declare function getAuthToken(): Promise<string>;
