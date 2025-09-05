'use client';

import React, { useState } from 'react';
import { ReadingPlan, ReadingPlanEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  CheckCircle2, 
  Circle,
  Trophy,
  Flame,
  Target,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Clock,
  BookOpenCheck
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { useReadingPlan } from '@/hooks/useReadingPlan';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useEffect } from 'react';
import { Home, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseVerseRange } from '@/lib/utils/passage-utils';

interface ReadingPlanDetailProps {
  planId: string;
  onBack?: () => void;
}

export function ReadingPlanDetail({ planId, onBack }: ReadingPlanDetailProps) {
  const { plan, progress, loading, error, markEntryComplete, markEntryIncomplete } = useReadingPlan(planId);
  const { setBreadcrumbs } = useBreadcrumb();
  const router = useRouter();

  // Set breadcrumbs when plan is loaded
  useEffect(() => {
    if (plan) {
      setBreadcrumbs([
        { label: 'Home', href: '/dashboard', icon: <Home className="h-3 w-3" /> },
        { label: 'Reading Plans', href: '/library/plans', icon: <Library className="h-3 w-3" /> },
        { label: plan.name }
      ]);
    }
    
    // Clear breadcrumbs on unmount
    return () => {
      setBreadcrumbs([]);
    };
  }, [plan, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error || 'Reading plan not found'}</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="mt-4">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  const handleToggleComplete = async (index: number, entry: ReadingPlanEntry) => {
    if (entry.completed) {
      await markEntryIncomplete(index);
    } else {
      await markEntryComplete(index);
    }
  };

  // Calculate progress metrics
  const calculateProgressMetrics = () => {
    if (!plan || !progress) return null;

    // Assuming plan started when first entry was completed or plan was created
    const firstCompletedEntry = plan.entries.find(e => e.completed && e.completedAt);
    const startDate = firstCompletedEntry 
      ? new Date(firstCompletedEntry.completedAt!) 
      : new Date(plan.createdAt);
    
    const today = new Date();
    const daysSinceStart = differenceInDays(today, startDate);
    const expectedProgress = Math.min(daysSinceStart + 1, plan.entries.length);
    const actualProgress = progress.completedEntries;
    const daysAheadOrBehind = actualProgress - expectedProgress;
    
    // Calculate average reading pace
    const daysActive = daysSinceStart + 1;
    const averagePerDay = daysActive > 0 ? actualProgress / daysActive : 0;
    
    // Project completion date
    const remainingEntries = plan.entries.length - actualProgress;
    const projectedDaysToComplete = averagePerDay > 0 
      ? Math.ceil(remainingEntries / averagePerDay)
      : remainingEntries;
    const projectedCompletionDate = addDays(today, projectedDaysToComplete);
    
    // Calculate catch-up options
    const catchUpOptions = [];
    if (daysAheadOrBehind < 0) {
      const behind = Math.abs(daysAheadOrBehind);
      catchUpOptions.push(
        { days: 7, extra: Math.ceil(behind / 7), total: Math.ceil(behind / 7) + 1 },
        { days: 14, extra: Math.ceil(behind / 14), total: Math.ceil(behind / 14) + 1 },
        { days: 30, extra: Math.ceil(behind / 30), total: Math.ceil(behind / 30) + 1 }
      );
    }
    
    return {
      daysAheadOrBehind,
      averagePerDay: averagePerDay.toFixed(1),
      projectedCompletionDate,
      catchUpOptions,
      isOnTrack: Math.abs(daysAheadOrBehind) <= 2,
      isBehind: daysAheadOrBehind < -2,
      isAhead: daysAheadOrBehind > 2
    };
  };

  const metrics = calculateProgressMetrics();

  // Find today's reading entry
  const getTodaysReading = () => {
    if (!plan) return null;
    
    // Find the first incomplete entry or the next entry to read
    const nextEntry = plan.entries.find(entry => !entry.completed && entry.passages && entry.passages.length > 0);
    
    if (nextEntry) {
      return nextEntry;
    }
    
    // If all are completed, return the last entry
    const entriesWithPassages = plan.entries.filter(entry => entry.passages && entry.passages.length > 0);
    return entriesWithPassages[entriesWithPassages.length - 1] || null;
  };

  const todaysReading = getTodaysReading();

  const handleReadToday = () => {
    if (!todaysReading || !todaysReading.passages || todaysReading.passages.length === 0) return;

    const firstPassage = todaysReading.passages[0];
    const verseRange = parseVerseRange(firstPassage);

    const params = new URLSearchParams({
      planId: planId,
      passages: todaysReading.passages.join(','),
      day: todaysReading.day?.toString() || '1'
    });

    if (verseRange && verseRange.start && verseRange.end) {
      params.set('startVerse', verseRange.start.toString());
      params.set('endVerse', verseRange.end.toString());
    }
    
    router.push(`/bible-reader?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Read Today's Passages Button */}
      {todaysReading && todaysReading.passages && todaysReading.passages.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5 text-primary" />
                  Today's Reading
                </h3>
                <p className="text-sm text-muted-foreground">
                  {todaysReading.reference || `Day ${todaysReading.day || 1}`}: {todaysReading.passages.join(', ')}
                </p>
              </div>
              <Button onClick={handleReadToday} size="lg">
                Read Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Progress Tracking Metrics */}
      {metrics && progress && progress.completedEntries > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              {metrics.isBehind && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {Math.abs(metrics.daysAheadOrBehind)} days behind
                </Badge>
              )}
              {metrics.isAhead && (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {metrics.daysAheadOrBehind} days ahead
                </Badge>
              )}
              {metrics.isOnTrack && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  On track
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Reading {metrics.averagePerDay} chapters per day
              </span>
            </div>

            {/* Projected Completion */}
            <div className="bg-secondary/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Projected Completion</span>
              </div>
              <p className="text-sm text-muted-foreground">
                At your current pace, you'll finish on{' '}
                <span className="font-medium">
                  {format(metrics.projectedCompletionDate, 'MMMM d, yyyy')}
                </span>
              </p>
            </div>

            {/* Catch-up Options */}
            {metrics.isBehind && metrics.catchUpOptions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Catch-up Options</span>
                </div>
                <div className="grid gap-2">
                  {metrics.catchUpOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg text-sm"
                    >
                      <span>Catch up in {option.days} days</span>
                      <span className="font-medium">
                        Read {option.total} chapters/day
                        {option.extra > 0 && (
                          <span className="text-muted-foreground ml-1">
                            (+{option.extra} extra)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          {plan.description && (
            <CardDescription>{plan.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {progress && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{progress.percentageComplete}%</span>
                </div>
                <Progress value={progress.percentageComplete} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{progress.completedEntries} completed</span>
                  <span>{progress.totalEntries} total</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{progress.percentageComplete}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{progress.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Current Streak</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">{progress.longestStreak}</div>
                  <div className="text-xs text-muted-foreground">Longest Streak</div>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{progress.totalEntries}</div>
                  <div className="text-xs text-muted-foreground">Total Readings</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reading Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-6 max-h-[500px] overflow-y-auto">
              {plan.entries.map((entry, index) => {
                // Check if entry has passages or reference
                const hasContent = (entry.passages && entry.passages.length > 0) || entry.reference;
                
                if (!hasContent) {
                  // Skip entries without content
                  return null;
                }
                
                return (
                  <Card key={index} className={entry.completed ? 'bg-secondary/20' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={entry.completed}
                          onCheckedChange={() => handleToggleComplete(index, entry)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {entry.reference || `Day ${entry.day || index + 1}`}
                              </h4>
                              {entry.passages && entry.passages.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {entry.passages.join(', ')}
                                </p>
                              )}
                            </div>
                            {entry.completed && entry.completedAt && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {format(new Date(entry.completedAt), 'MMM d, yyyy')}
                              </Badge>
                            )}
                          </div>
                          
                          {/* AI Summary if available */}
                          {entry.aiSummary && (
                            <p className="text-sm text-muted-foreground">
                              {entry.aiSummary}
                            </p>
                          )}

                          {/* Display notes if they exist (read-only) */}
                          {entry.notes && (
                            <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Show message if no entries have content */}
              {plan.entries.filter(entry => 
                (entry.passages && entry.passages.length > 0) || entry.reference
              ).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>This reading plan is being prepared.</p>
                  <p className="text-sm mt-2">Full reading schedule coming soon!</p>
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
