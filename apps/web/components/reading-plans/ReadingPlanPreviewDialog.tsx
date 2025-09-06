'use client';

import React from 'react';
import { ReadingPlan } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  BookOpen,
  Target,
  Users,
  Globe,
  Lock,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface ReadingPlanPreviewDialogProps {
  plan: ReadingPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartPlan: (planId: string) => void;
  onViewDetails: (planId: string) => void;
}

export function ReadingPlanPreviewDialog({
  plan,
  open,
  onOpenChange,
  onStartPlan,
  onViewDetails,
}: ReadingPlanPreviewDialogProps) {
  if (!plan) return null;

  const totalDays = plan.entries.length;
  const estimatedMinutesPerDay = 15; // Default estimate
  const sampleEntries = plan.entries.slice(0, 3).filter(entry => 
    (entry.passages && entry.passages.length > 0) || entry.reference
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{plan.name}</DialogTitle>
              {plan.description && (
                <DialogDescription className="mt-2">
                  {plan.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              {plan.isPublic ? (
                <Badge variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              {plan.groupId && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  Group
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-lg font-semibold">{totalDays}</div>
              <div className="text-xs text-muted-foreground">Total Days</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-semibold">~{estimatedMinutesPerDay}min</div>
              <div className="text-xs text-muted-foreground">Per Day</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-semibold">{plan.entries.filter(e => e.passages?.length).length}</div>
              <div className="text-xs text-muted-foreground">Readings</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <Target className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-lg font-semibold">{plan.duration || totalDays}</div>
              <div className="text-xs text-muted-foreground">Day Goal</div>
            </div>
          </div>

          {/* Tags */}
          {plan.tags && plan.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {plan.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sample Readings */}
          {sampleEntries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Sample Daily Readings</h4>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-3">
                  {sampleEntries.map((entry, index) => (
                    <div key={index} className="pb-3 border-b last:border-0">
                      <div className="font-medium text-sm">
                        Day {entry.day || index + 1}
                      </div>
                      {entry.passages && entry.passages.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {entry.passages.join(', ')}
                        </div>
                      )}
                      {entry.reference && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {entry.reference}
                        </div>
                      )}
                    </div>
                  ))}
                  {plan.entries.length > 3 && (
                    <div className="text-sm text-muted-foreground italic">
                      ...and {plan.entries.length - 3} more days
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Expected Completion */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="text-sm">
              <span className="font-medium">Expected Completion:</span>{' '}
              <span className="text-muted-foreground">
                If you start today and read daily, you'll finish on{' '}
                {format(
                  new Date(Date.now() + (totalDays * 24 * 60 * 60 * 1000)),
                  'MMMM d, yyyy'
                )}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onViewDetails(plan._id);
              onOpenChange(false);
            }}
          >
            View Full Details
          </Button>
          <Button
            onClick={() => {
              onStartPlan(plan._id);
              onOpenChange(false);
            }}
            className="gap-2"
          >
            Start This Plan
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
