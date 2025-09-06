'use client';

import React, { useState } from 'react';
import { ReadingPlan } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Lock, Globe, Copy, Trash2, Edit, Eye, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ReadingPlanPreviewDialog } from './ReadingPlanPreviewDialog';
import { useRouter } from 'next/navigation';

interface ReadingPlanListProps {
  plans: ReadingPlan[];
  onSelectPlan: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
  onDeletePlan?: (planId: string) => void;
  onClonePlan?: (planId: string) => void;
  showActions?: boolean;
}

export function ReadingPlanList({
  plans,
  onSelectPlan,
  onEditPlan,
  onDeletePlan,
  onClonePlan,
  showActions = true,
}: ReadingPlanListProps) {
  const router = useRouter();
  const [previewPlan, setPreviewPlan] = useState<ReadingPlan | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const calculateProgress = (plan: ReadingPlan) => {
    const completed = plan.entries.filter(e => e.completed).length;
    const total = plan.entries.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handlePlanClick = (plan: ReadingPlan) => {
    setPreviewPlan(plan);
    setShowPreview(true);
  };

  const handleStartPlan = (planId: string) => {
    // Navigate directly to the plan detail page when starting
    router.push(`/library/plans/${planId}`);
  };

  const handleViewDetails = (planId: string) => {
    // Navigate to the plan detail page
    router.push(`/library/plans/${planId}`);
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reading plans found. Create your first plan to get started!
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const progress = calculateProgress(plan);
          const completedCount = plan.entries.filter(e => e.completed).length;

          return (
            <Card
              key={plan._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handlePlanClick(plan)}
            >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="mt-1">
                      {plan.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  {plan.isPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {plan.groupId && (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{completedCount} completed</span>
                    <span>{plan.entries.length} total</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {formatDistanceToNow(new Date(plan.createdAt))} ago</span>
                </div>

                {/* Actions */}
                {showActions && (
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onEditPlan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditPlan(plan._id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {onClonePlan && plan.isPublic && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onClonePlan(plan._id)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Clone
                      </Button>
                    )}
                    {onDeletePlan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeletePlan(plan._id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <ReadingPlanPreviewDialog
        plan={previewPlan}
        open={showPreview}
        onOpenChange={setShowPreview}
        onStartPlan={handleStartPlan}
        onViewDetails={handleViewDetails}
      />
    </>
  );
}
