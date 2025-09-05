import { getDatabase } from '@/lib/mongodb';
import { 
  Activity, 
  ActivityType, 
  ActivityFilters, 
  ActivityStats, 
  ContributionData,
  ActivityDay 
} from '@/types/activity';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

export class ActivityService {
  private static instance: ActivityService;

  private constructor() {}

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  async logActivity(activity: Omit<Activity, '_id' | 'timestamp'>): Promise<void> {
    try {
      const db = await getDatabase();
      const collection = db.collection('activities');

      await collection.insertOne({
        ...activity,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  async getActivities(filters: ActivityFilters): Promise<Activity[]> {
    try {
      const db = await getDatabase();
      const collection = db.collection('activities');

      const query: any = {};

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.types && filters.types.length > 0) {
        query.type = { $in: filters.types };
      }

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      if (filters.courseId) {
        query.courseId = filters.courseId;
      }

      const activities = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();

      return activities as unknown as Activity[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getContributionData(userId: string, days: number = 365): Promise<ContributionData[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      return this.getContributionDataByDateRange(userId, startDate, endDate);
    } catch (error) {
      console.error('Error generating contribution data:', error);
      throw error;
    }
  }

  async getContributionDataByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ContributionData[]> {
    try {
      const activities = await this.getActivities({
        userId,
        startDate,
        endDate,
      });

      // Group activities by day
      const activityMap = new Map<string, number>();
      
      activities.forEach(activity => {
        const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
        activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
      });

      // Calculate max count for level calculation
      const maxCount = Math.max(...Array.from(activityMap.values()), 1);

      // Generate data for all days in range
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      return allDays.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const count = activityMap.get(dateKey) || 0;
        
        // Calculate level (0-4) based on activity count
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const percentage = count / maxCount;
          if (percentage <= 0.25) level = 1;
          else if (percentage <= 0.5) level = 2;
          else if (percentage <= 0.75) level = 3;
          else level = 4;
        }

        return {
          date: dateKey,
          count,
          level,
        };
      });
    } catch (error) {
      console.error('Error generating contribution data by date range:', error);
      throw error;
    }
  }

  async getActivityStats(userId: string): Promise<ActivityStats> {
    try {
      const activities = await this.getActivities({ userId });
      return this.calculateStats(activities);
    } catch (error) {
      console.error('Error calculating activity stats:', error);
      throw error;
    }
  }

  async getActivityStatsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ActivityStats> {
    try {
      const activities = await this.getActivities({ 
        userId,
        startDate,
        endDate
      });
      return this.calculateStats(activities);
    } catch (error) {
      console.error('Error calculating activity stats by date range:', error);
      throw error;
    }
  }

  private calculateStats(activities: Activity[]): ActivityStats {
    if (activities.length === 0) {
      return {
        totalActivities: 0,
        currentStreak: 0,
        longestStreak: 0,
        activeDays: 0,
        mostActiveDay: '',
        activityBreakdown: {} as Record<ActivityType, number>,
      };
    }

    // Group activities by day
    const dayMap = new Map<string, Activity[]>();
    activities.forEach(activity => {
      const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, []);
      }
      dayMap.get(dateKey)!.push(activity);
    });

    // Calculate streaks
    const sortedDays = Array.from(dayMap.keys()).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak includes today
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (dayMap.has(today)) {
      currentStreak = tempStreak;
    } else if (dayMap.has(yesterday)) {
      // Count backwards from yesterday
      let date = yesterday;
      currentStreak = 0;
      while (dayMap.has(date)) {
        currentStreak++;
        date = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
      }
    }

    // Find most active day
    let mostActiveDay = '';
    let maxActivities = 0;
    dayMap.forEach((activities, day) => {
      if (activities.length > maxActivities) {
        maxActivities = activities.length;
        mostActiveDay = day;
      }
    });

    // Activity breakdown
    const activityBreakdown: Record<string, number> = {};
    activities.forEach(activity => {
      activityBreakdown[activity.type] = (activityBreakdown[activity.type] || 0) + 1;
    });

    return {
      totalActivities: activities.length,
      currentStreak,
      longestStreak,
      activeDays: dayMap.size,
      mostActiveDay,
      activityBreakdown: activityBreakdown as Record<ActivityType, number>,
    };
  }

  async getRecentActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    try {
      const db = await getDatabase();
      const collection = db.collection('activities');

      const activities = await collection
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return activities as unknown as Activity[];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  async getActivityDays(userId: string, days: number = 30): Promise<ActivityDay[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const activities = await this.getActivities({
        userId,
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
      });

      // Group by day
      const dayMap = new Map<string, Activity[]>();
      activities.forEach(activity => {
        const dateKey = format(activity.timestamp, 'yyyy-MM-dd');
        if (!dayMap.has(dateKey)) {
          dayMap.set(dateKey, []);
        }
        dayMap.get(dateKey)!.push(activity);
      });

      // Convert to array
      return Array.from(dayMap.entries()).map(([date, activities]) => ({
        date,
        count: activities.length,
        activities,
      })).sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('Error fetching activity days:', error);
      throw error;
    }
  }
}

export const activityService = ActivityService.getInstance();
