'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Gift } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VanWestendorpResponses, PricingSurveyProps } from '@/types/payment';

export function PricingSurvey({
  courseId,
  onComplete,
  onSkip,
  currency = 'USD',
  productName = 'this course',
  incentive
}: PricingSurveyProps) {
  const [responses, setResponses] = useState<Partial<VanWestendorpResponses>>({
    currency
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      key: 'tooCheap',
      title: 'Too Cheap',
      question: `At what price would you consider ${productName} to be priced so low that you would feel the quality couldn't be very good?`,
      hint: 'Think about the lowest price that would make you doubt the value.'
    },
    {
      key: 'cheap',
      title: 'Good Value',
      question: `At what price would you consider ${productName} to be a bargain—a great buy for the money?`,
      hint: 'The price where you feel you\'re getting excellent value.'
    },
    {
      key: 'expensive',
      title: 'Getting Expensive',
      question: `At what price would you consider ${productName} to be getting expensive, but you would still consider buying it?`,
      hint: 'The price where you\'d think twice but might still purchase.'
    },
    {
      key: 'tooExpensive',
      title: 'Too Expensive',
      question: `At what price would you consider ${productName} to be so expensive that you would not consider buying it?`,
      hint: 'The maximum price you\'d be willing to pay.'
    }
  ];

  const currentQ = questions[currentQuestion];
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;

  const validatePrice = (value: string): boolean => {
    const price = parseFloat(value);
    if (isNaN(price) || price <= 0) {
      setErrors({ [currentQ.key]: 'Please enter a valid price greater than 0' });
      return false;
    }

    // Validate logical consistency
    const prices = { ...responses, [currentQ.key]: price };
    if (currentQuestion > 0 && prices.tooCheap && price < prices.tooCheap) {
      setErrors({ [currentQ.key]: 'This price should be higher than the "too cheap" price' });
      return false;
    }
    if (currentQuestion > 1 && prices.cheap && price < prices.cheap) {
      setErrors({ [currentQ.key]: 'This price should be higher than the "good value" price' });
      return false;
    }
    if (currentQuestion > 2 && prices.expensive && price < prices.expensive) {
      setErrors({ [currentQ.key]: 'This price should be higher than the "getting expensive" price' });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    const value = responses[currentQ.key as keyof VanWestendorpResponses];
    if (!value || !validatePrice(value.toString())) {
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete the survey
      onComplete(responses as VanWestendorpResponses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setErrors({});
    }
  };

  const handleInputChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setResponses({
      ...responses,
      [currentQ.key]: cleanValue ? parseFloat(cleanValue) : undefined
    });
    setErrors({});
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Help Us Price Fairly</CardTitle>
        <CardDescription>
          Your feedback helps us offer the best value. Answer 4 quick questions about pricing.
        </CardDescription>
        {incentive && (
          <Alert className="mt-4">
            <Gift className="h-4 w-4" />
            <AlertDescription>
              Complete this survey to {incentive.description}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{currentQ.title}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg mb-2">{currentQ.question}</h3>
            <p className="text-sm text-muted-foreground">{currentQ.hint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Your Price ({currency})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={responses[currentQ.key as keyof VanWestendorpResponses] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`pl-8 ${errors[currentQ.key] ? 'border-destructive' : ''}`}
              />
            </div>
            {errors[currentQ.key] && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors[currentQ.key]}
              </p>
            )}
          </div>

          {/* Price summary for context */}
          {currentQuestion > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Your previous responses:</p>
              {responses.tooCheap && (
                <p className="text-sm text-muted-foreground">
                  Too cheap: {currencySymbol}{responses.tooCheap}
                </p>
              )}
              {responses.cheap && (
                <p className="text-sm text-muted-foreground">
                  Good value: {currencySymbol}{responses.cheap}
                </p>
              )}
              {responses.expensive && (
                <p className="text-sm text-muted-foreground">
                  Getting expensive: {currencySymbol}{responses.expensive}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
            >
              Previous
            </Button>
          )}
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
            >
              Skip Survey
            </Button>
          )}
        </div>
        <Button
          onClick={handleNext}
          disabled={!responses[currentQ.key as keyof VanWestendorpResponses]}
        >
          {currentQuestion < questions.length - 1 ? 'Next' : 'Complete Survey'}
        </Button>
      </CardFooter>
    </Card>
  );
}
