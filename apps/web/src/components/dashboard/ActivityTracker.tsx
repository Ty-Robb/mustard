'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContributionGraph } from './ContributionGraph';
import { ActivityStats, ContributionData } from '@/types/activity';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, Calendar, Award, ChevronDown } from 'lucide-react';
import { ExportDialog } from '@/components/export/ExportDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, subDays } from 'date-fns';

type DateRange = {
  label: string;
  startDate: Date;
  endDate: Date;
};

export function ActivityTracker() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [contributionData, setContributionData] = useState<ContributionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    label: 'Last 12 months',
    startDate: subDays(new Date(), 365),
    endDate: new Date(),
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAvailableYears = async () => {
      try {
        const token = await currentUser.getIdToken();
        
        // Fetch all activities to determine available years
        const response = await fetch('/api/activities', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const activities = await response.json();
          const years = new Set<number>();
          activities.forEach((activity: any) => {
            years.add(new Date(activity.timestamp).getFullYear());
          });
          setAvailableYears(Array.from(years).sort((a, b) => b - a));
        }
      } catch (err) {
        console.error('Error fetching available years:', err);
      }
    };

    fetchAvailableYears();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchActivityData = async () => {
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();
        
        // Fetch stats for the selected period
        const statsParams = new URLSearchParams({
          startDate: selectedRange.startDate.toISOString(),
          endDate: selectedRange.endDate.toISOString(),
        });
        
        const statsResponse = await fetch(`/api/activities/stats?${statsParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch activity stats');
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Fetch contribution data for the selected period
        const contributionParams = new URLSearchParams({
          startDate: selectedRange.startDate.toISOString(),
          endDate: selectedRange.endDate.toISOString(),
        });
        
        const contributionResponse = await fetch(`/api/activities/contributions?${contributionParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!contributionResponse.ok) {
          throw new Error('Failed to fetch contribution data');
        }
        
        const contributionData = await contributionResponse.json();
        setContributionData(contributionData);
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [currentUser, selectedRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Tracker</CardTitle>
          <CardDescription>Your learning activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Tracker</CardTitle>
          <CardDescription>Your learning activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const getDateRangeOptions = (): DateRange[] => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const options: DateRange[] = [
      {
        label: 'Last 30 days',
        startDate: subDays(now, 30),
        endDate: now,
      },
      {
        label: 'Last 90 days',
        startDate: subDays(now, 90),
        endDate: now,
      },
      {
        label: 'Last 12 months',
        startDate: subDays(now, 365),
        endDate: now,
      },
    ];

    // Add year options
    availableYears.forEach(year => {
      options.push({
        label: year.toString(),
        startDate: startOfYear(new Date(year, 0, 1)),
        endDate: year === currentYear ? now : endOfYear(new Date(year, 11, 31)),
      });
    });

    // Add month options for current year
    for (let month = 0; month < now.getMonth() + 1; month++) {
      const monthDate = new Date(currentYear, month, 1);
      options.push({
        label: format(monthDate, 'MMMM yyyy'),
        startDate: startOfMonth(monthDate),
        endDate: month === now.getMonth() ? now : endOfMonth(monthDate),
      });
    }

    return options;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Tracker</CardTitle>
            <CardDescription>Your learning activity over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedRange.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {getDateRangeOptions().map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => setSelectedRange(option)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ExportDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Total Activities</span>
              </div>
              <p className="text-2xl font-bold">{stats?.totalActivities || 0}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Current Streak</span>
              </div>
              <p className="text-2xl font-bold">{stats?.currentStreak || 0} days</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>Longest Streak</span>
              </div>
              <p className="text-2xl font-bold">{stats?.longestStreak || 0} days</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Active Days</span>
              </div>
              <p className="text-2xl font-bold">{stats?.activeDays || 0}</p>
            </div>
          </div>

          {/* Contribution Graph */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-4">Activity Heatmap</h3>
            <ContributionGraph data={contributionData} />
          </div>

          {/* Activity Breakdown */}
          {stats?.activityBreakdown && Object.keys(stats.activityBreakdown).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-4">Activity Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(stats.activityBreakdown).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
