import 'server-only';
import type { 
  PricingSurvey, 
  VanWestendorpResponses, 
  PriceAnalysis,
  PricingAnalysisResponse 
} from '@repo/types';

interface PricePoint {
  price: number;
  percentage: number;
}

export function analyzePricingSurveys(
  surveys: PricingSurvey[]
): PricingAnalysisResponse {
  if (surveys.length < 10) {
    throw new Error('Insufficient survey data for analysis');
  }

  // Extract price points
  const tooExpensive = surveys.map(s => s.responses.tooExpensive).sort((a, b) => a - b);
  const expensive = surveys.map(s => s.responses.expensive).sort((a, b) => a - b);
  const cheap = surveys.map(s => s.responses.cheap).sort((a, b) => a - b);
  const tooCheap = surveys.map(s => s.responses.tooCheap).sort((a, b) => a - b);

  // Calculate cumulative percentages
  const calculateCumulative = (prices: number[], reverse = false): PricePoint[] => {
    const unique = [...new Set(prices)].sort((a, b) => reverse ? b - a : a - b);
    return unique.map(price => ({
      price,
      percentage: (reverse 
        ? prices.filter(p => p >= price).length 
        : prices.filter(p => p <= price).length) / prices.length * 100
    }));
  };

  const tooExpensiveCurve = calculateCumulative(tooExpensive);
  const tooCheapCurve = calculateCumulative(tooCheap, true);
  const expensiveCurve = calculateCumulative(expensive);
  const cheapCurve = calculateCumulative(cheap, true);

  // Find intersection points
  const findIntersection = (curve1: PricePoint[], curve2: PricePoint[]): number => {
    for (let i = 0; i < curve1.length - 1; i++) {
      for (let j = 0; j < curve2.length - 1; j++) {
        if (curve1[i].price <= curve2[j].price && curve1[i + 1].price >= curve2[j + 1].price) {
          // Linear interpolation
          const x1 = curve1[i].price;
          const y1 = curve1[i].percentage;
          const x2 = curve1[i + 1].price;
          const y2 = curve1[i + 1].percentage;
          const x3 = curve2[j].price;
          const y3 = curve2[j].percentage;
          const x4 = curve2[j + 1].price;
          const y4 = curve2[j + 1].percentage;
          
          const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
          if (denominator !== 0) {
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
            return x1 + t * (x2 - x1);
          }
        }
      }
    }
    return 0;
  };

  const optimalPrice = findIntersection(tooCheapCurve, tooExpensiveCurve) || 0;
  const indifferencePrice = findIntersection(cheapCurve, expensiveCurve) || 0;
  
  // Find acceptable price range
  const minAcceptable = findIntersection(tooCheapCurve, expensiveCurve) || 0;
  const maxAcceptable = findIntersection(cheapCurve, tooExpensiveCurve) || 0;

  const analysis: PriceAnalysis = {
    courseId: surveys[0].courseId,
    optimalPricePoint: Math.round(optimalPrice * 100) / 100,
    indifferencePricePoint: Math.round(indifferencePrice * 100) / 100,
    acceptablePriceRange: {
      min: Math.round(minAcceptable * 100) / 100,
      max: Math.round(maxAcceptable * 100) / 100,
    },
    sampleSize: surveys.length,
    lastUpdated: new Date(),
    currency: surveys[0].responses.currency,
  };

  return {
    analysis,
    recommendedPrice: analysis.optimalPricePoint,
    confidence: Math.min(surveys.length / 100, 1), // Confidence increases with sample size
  };
}

export function calculateDynamicPriceAdjustment(
  basePrice: number,
  recommendedPrice: number
): number {
  return ((recommendedPrice - basePrice) / basePrice) * 100;
}
