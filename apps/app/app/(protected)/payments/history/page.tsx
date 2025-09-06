'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar,
  Receipt,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import type { Payment } from '@/types/payment';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchPaymentHistory();
    }
  }, [currentUser]);

  const fetchPaymentHistory = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to request a refund? This action cannot be undone.')) {
      return;
    }

    setRefundingId(paymentId);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch('/api/payments/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId, action: 'refund' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process refund');
      }

      // Refresh payment history
      await fetchPaymentHistory();
      alert('Refund processed successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setRefundingId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      succeeded: 'default',
      refunded: 'secondary',
      failed: 'destructive',
      pending: 'outline',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isRefundEligible = (payment: Payment) => {
    if (payment.status !== 'succeeded' || payment.refundedAt) return false;
    
    const paymentDate = new Date(payment.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return paymentDate > thirtyDaysAgo;
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert>
          <AlertDescription>
            Please sign in to view your payment history.
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
          <h1 className="text-3xl font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">
            View and manage your course purchases
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment List */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
              <p className="text-muted-foreground mb-4">
                Your payment history will appear here once you purchase a course.
              </p>
              <Button onClick={() => router.push('/courses/my-courses')}>
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {formatCurrency(payment.amount, payment.currency)}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payment.createdAt)}
                        </div>
                      </CardDescription>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Course Information */}
                    <div>
                      <p className="text-sm font-medium mb-1">Course</p>
                      <p className="text-sm text-muted-foreground">
                        Course ID: {payment.courseId}
                      </p>
                    </div>

                    {/* Payment Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Payment Method</p>
                        <p className="text-muted-foreground capitalize">
                          {payment.paymentMethod?.type || 'Card'} 
                          {payment.paymentMethod?.last4 && ` •••• ${payment.paymentMethod.last4}`}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Transaction ID</p>
                        <p className="text-muted-foreground font-mono text-xs">
                          {payment.stripePaymentIntentId}
                        </p>
                      </div>
                    </div>

                    {/* Refund Information */}
                    {payment.refundedAt && (
                      <Alert>
                        <RefreshCw className="h-4 w-4" />
                        <AlertDescription>
                          Refunded on {formatDate(payment.refundedAt)}
                          {payment.refundAmount && (
                            <span> • Amount: {formatCurrency(payment.refundAmount, payment.currency)}</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.print()}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Receipt
                      </Button>
                      {isRefundEligible(payment) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(payment.id)}
                          disabled={refundingId === payment.id}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${refundingId === payment.id ? 'animate-spin' : ''}`} />
                          Request Refund
                        </Button>
                      )}
                    </div>

                    {/* Refund Policy Notice */}
                    {isRefundEligible(payment) && (
                      <p className="text-xs text-muted-foreground">
                        Refunds are available within 30 days of purchase
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold">
                    {payments.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      payments.reduce((sum, p) => sum + (p.status === 'succeeded' ? p.amount : 0), 0),
                      'USD'
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.refundedAt).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Refunds</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      payments.reduce((sum, p) => sum + (p.refundAmount || 0), 0),
                      'USD'
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Refunded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
