'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ReadingPlanDetail } from '@/components/reading-plans/ReadingPlanDetail';

interface ReadingPlanPageProps {
  params: Promise<{
    planId: string;
  }>;
}

export default function ReadingPlanPage({ params }: ReadingPlanPageProps) {
  const { planId } = use(params);
  const router = useRouter();

  const handleBack = () => {
    router.push('/library/plans');
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6">
        <ReadingPlanDetail 
          planId={planId} 
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
