'use client';

import React, { useEffect, useState } from 'react';
import { ContributionData } from '@/types/activity';
import { format, startOfWeek, getDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ContributionGraphProps {
  data: ContributionData[];
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ContributionGraph({ data, className }: ContributionGraphProps) {
  const [weeks, setWeeks] = useState<ContributionData[][]>([]);
  const [monthPositions, setMonthPositions] = useState<{ month: string; position: number }[]>([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create a map for quick lookup
    const dataMap = new Map<string, ContributionData>();
    data.forEach(day => {
      dataMap.set(day.date, day);
    });

    // Get the date range
    const startDate = new Date(data[0].date);
    const endDate = new Date(data[data.length - 1].date);
    
    // Start from the beginning of the week
    const weekStart = startOfWeek(startDate);
    
    // Generate all days in the range
    const allDays = eachDayOfInterval({ start: weekStart, end: endDate });
    
    // Organize into weeks
    const weeksData: ContributionData[][] = [];
    let currentWeek: ContributionData[] = [];
    const monthLabels: { month: string; position: number }[] = [];
    let lastMonth = -1;
    
    allDays.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dataMap.get(dateStr) || {
        date: dateStr,
        count: 0,
        level: 0,
      };
      
      // Track month changes
      const month = day.getMonth();
      const weekIndex = Math.floor(index / 7);
      if (month !== lastMonth && day >= startDate) {
        monthLabels.push({
          month: MONTHS[month],
          position: weekIndex,
        });
        lastMonth = month;
      }
      
      currentWeek.push(dayData);
      
      // If we've filled a week, start a new one
      if (currentWeek.length === 7) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Add the last week if it has any data
    if (currentWeek.length > 0) {
      // Fill the rest of the week with empty cells
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: 0,
        });
      }
      weeksData.push(currentWeek);
    }

    setWeeks(weeksData);
    setMonthPositions(monthLabels);
  }, [data]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-muted hover:bg-muted/80';
      case 1:
        return 'bg-green-200 dark:bg-green-900 hover:bg-green-300 dark:hover:bg-green-800';
      case 2:
        return 'bg-green-400 dark:bg-green-700 hover:bg-green-500 dark:hover:bg-green-600';
      case 3:
        return 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400';
      case 4:
        return 'bg-green-800 dark:bg-green-300 hover:bg-green-900 dark:hover:bg-green-200';
      default:
        return 'bg-muted hover:bg-muted/80';
    }
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-2 ml-10 relative">
          {monthPositions.map((label, index) => (
            <div
              key={index}
              className="text-xs text-muted-foreground absolute"
              style={{ left: `${label.position * 13}px` }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex mt-6">
          {/* Day labels */}
          <div className="flex flex-col justify-between mr-2 py-1">
            {DAYS.map((day, index) => (
              <div
                key={day}
                className={cn(
                  'text-xs text-muted-foreground h-[11px] flex items-center',
                  index % 2 === 0 && 'invisible'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Contribution grid */}
          <div className="flex gap-[3px]">
            <TooltipProvider>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    if (!day.date) {
                      return <div key={dayIndex} className="w-[10px] h-[10px]" />;
                    }

                    const date = new Date(day.date);
                    const formattedDate = format(date, 'MMM d, yyyy');

                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'w-[10px] h-[10px] rounded-sm cursor-pointer transition-colors',
                              getLevelColor(day.level)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{formattedDate}</p>
                          <p className="text-sm">
                            {day.count === 0
                              ? 'No activities'
                              : `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 ml-10 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-[3px]">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  'w-[10px] h-[10px] rounded-sm',
                  getLevelColor(level)
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
